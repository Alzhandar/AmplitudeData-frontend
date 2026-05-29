import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const backendBaseUrl = getBackendBaseUrl();
  const token = request.cookies.get("auth_token")?.value;

  if (token) {
    try {
      await fetch(`${backendBaseUrl}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // Best-effort — always clear the cookie even if backend call fails
    }
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete("auth_token");
  return response;
}
