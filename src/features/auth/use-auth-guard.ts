"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthUser, authApi } from "@/features/auth/api";
import { firstAllowedPath, PortalPage } from "@/features/auth/permissions";

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
  position: {
    guid: "",
    name: "",
  },
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
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    let mounted = true;
    authApi
      .me()
      .then((me) => {
        if (!mounted) return;
        const pages = me.allowed_pages || [];
        const pageAllowed = requiredPage ? pages.includes(requiredPage) : true;

        setProfile(me.user || EMPTY_PROFILE);
        setIin(me.iin || "");
        setAllowedPages(pages);
        setHasPageAccess(pageAllowed);
        setAuthenticated(true);
        setReady(true);

        if (!pageAllowed) {
          const fallbackPath = firstAllowedPath(pages);
          if (fallbackPath) {
            router.replace(fallbackPath);
          }
        }
      })
      .catch(() => {
        if (!mounted) return;
        window.localStorage.removeItem("auth_token");
        router.replace("/login");
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [requiredPage, router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    window.localStorage.removeItem("auth_token");
    router.replace("/login");
  }, [router]);

  return {
    ready,
    authenticated,
    hasPageAccess,
    iin,
    allowedPages,
    profile,
    logout,
  };
}
