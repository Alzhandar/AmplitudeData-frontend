import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
}

function isSelfProxyLoop(request: NextRequest, backendBaseUrl: string): boolean {
  try {
    return new URL(backendBaseUrl).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

/** Reads token from httpOnly cookie; falls back to Authorization header for backward compat. */
function getAuthorizationForBackend(request: NextRequest): string {
  const tokenFromCookie = request.cookies.get("auth_token")?.value;
  if (tokenFromCookie) return `Token ${tokenFromCookie}`;
  return request.headers.get("authorization") || "";
}

export async function proxyGet(request: NextRequest, backendPath: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const search = request.nextUrl.search || "";
  const authorization = getAuthorizationForBackend(request);

  if (isSelfProxyLoop(request, backendBaseUrl)) {
    return NextResponse.json(
      { detail: "BACKEND_BASE_URL points to frontend origin and causes an infinite proxy loop." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${backendBaseUrl}${backendPath}${search}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      cache: "no-store",
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    console.error("[api-proxy][GET] upstream request failed", {
      backendBaseUrl,
      backendPath,
      search,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ detail: "Backend API unavailable" }, { status: 502 });
  }
}

export async function proxyPost(request: NextRequest, backendPath: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const authorization = getAuthorizationForBackend(request);

  if (isSelfProxyLoop(request, backendBaseUrl)) {
    return NextResponse.json(
      { detail: "BACKEND_BASE_URL points to frontend origin and causes an infinite proxy loop." },
      { status: 500 },
    );
  }

  try {
    const body = await request.text();
    const response = await fetch(`${backendBaseUrl}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    console.error("[api-proxy][POST] upstream request failed", {
      backendBaseUrl,
      backendPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ detail: "Backend API unavailable" }, { status: 502 });
  }
}

export { getAuthorizationForBackend };
