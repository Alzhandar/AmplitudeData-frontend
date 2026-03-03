import { NextRequest } from "next/server";

import { proxyGet } from "../_lib/proxy";

export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/amplitude/today-mobile-activity/");
}
