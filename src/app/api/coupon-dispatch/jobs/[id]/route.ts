import { NextRequest } from "next/server";

import { proxyGet } from "../../../amplitude/_lib/proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = String(params.id || "").trim();
  return proxyGet(request, `/api/coupon-dispatch/jobs/${id}/`);
}
