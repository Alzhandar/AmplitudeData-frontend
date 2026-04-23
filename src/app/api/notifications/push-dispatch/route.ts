import { NextRequest, NextResponse } from "next/server";

import { proxyPost } from "../../amplitude/_lib/proxy";

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

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return proxyPost(request, "/api/notifications/push-dispatch/");
  }

  const backendBaseUrl = getBackendBaseUrl();
  const authorization = request.headers.get("authorization") || "";

  if (isSelfProxyLoop(request, backendBaseUrl)) {
    return NextResponse.json(
      {
        detail: "BACKEND_BASE_URL points to frontend origin and causes an infinite proxy loop.",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const response = await fetch(`${backendBaseUrl}/api/notifications/push-dispatch/`, {
      method: "POST",
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: formData,
      cache: "no-store",
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      {
        detail: "Backend API unavailable",
      },
      { status: 502 },
    );
  }
}
