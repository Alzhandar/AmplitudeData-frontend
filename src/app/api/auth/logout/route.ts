import { NextRequest } from "next/server";

import { proxyPost } from "../../amplitude/_lib/proxy";

export async function POST(request: NextRequest) {
  return proxyPost(request, "/api/auth/logout/");
}
