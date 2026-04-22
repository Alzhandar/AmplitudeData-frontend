import { NextRequest } from "next/server";

import { proxyGet } from "../../amplitude/_lib/proxy";

export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/coupon-dispatch/marketing-sales/");
}
