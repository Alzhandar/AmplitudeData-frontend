"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthUser, authApi } from "@/features/auth/api";
import { firstAllowedPath, PortalPage } from "@/features/auth/permissions";
import { clearAuthSession } from "@/features/auth/storage";

type AuthGuardState = {
  ready: boolean;
  authenticated: boolean;
  hasPageAccess: boolean;
  iin: string;
  allowedPages: PortalPage[];
  profile: AuthUser;
  logout: () => Promise<void>;
};

const EMPTY_PROFILE: AuthUser = {
  id: 0,
  email: "",
  full_name: "",
  position: { guid: "", name: "" },
};

export function useAuthGuard(requiredPage?: PortalPage): AuthGuardState {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [iin, setIin] = useState("");
  const [allowedPages, setAllowedPages] = useState<PortalPage[]>([]);
  const [profile, setProfile] = useState<AuthUser>(EMPTY_PROFILE);

  useEffect(() => {
    let mounted = true;

    // Token lives in an httpOnly cookie — just call /me directly.
    // If the cookie is absent or expired, the backend returns 401 and we redirect.
    authApi
      .me()
      .then((me) => {
        if (!mounted) return;

        const pages = me.allowed_pages || [];
        const pageAllowed = requiredPage ? pages.includes(requiredPage) : true;

        setProfile(me.user ?? EMPTY_PROFILE);
        setIin(me.iin ?? "");
        setAllowedPages(pages);
        setAuthenticated(true);

        if (!pageAllowed) {
          // Redirect silently — don't set ready=true so we never flash an access-denied screen
          const fallbackPath = firstAllowedPath(pages);
          if (fallbackPath) {
            router.replace(fallbackPath);
          } else {
            clearAuthSession();
            router.replace("/login");
          }
          return;
        }

        setHasPageAccess(true);
        setReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        clearAuthSession();
        router.replace("/login");
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [requiredPage, router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearAuthSession();
    router.replace("/login");
  }, [router]);

  return { ready, authenticated, hasPageAccess, iin, allowedPages, profile, logout };
}
