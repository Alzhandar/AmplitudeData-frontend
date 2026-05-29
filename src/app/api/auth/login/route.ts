import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const backendBaseUrl = getBackendBaseUrl();

  try {
    const body = await request.text();
    const backendResponse = await fetch(`${backendBaseUrl}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    const data = (await backendResponse.json()) as Record<string, unknown>;

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Extract token, set as httpOnly cookie — never expose it to client JS
    const token = typeof data.token === "string" ? data.token : null;
    const { token: _omit, ...clientData } = data;

    const response = NextResponse.json(clientData, { status: 200 });

    if (token) {
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("[auth/login] upstream request failed", error);
    return NextResponse.json({ detail: "Backend API unavailable" }, { status: 502 });
  }
}
