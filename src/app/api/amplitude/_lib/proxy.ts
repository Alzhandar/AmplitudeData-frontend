import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function proxyGet(request: NextRequest, backendPath: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const search = request.nextUrl.search || "";

  try {
    const response = await fetch(`${backendBaseUrl}${backendPath}${search}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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

export async function proxyPost(request: NextRequest, backendPath: string) {
  const backendBaseUrl = getBackendBaseUrl();

  try {
    const body = await request.text();
    const response = await fetch(`${backendBaseUrl}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
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
