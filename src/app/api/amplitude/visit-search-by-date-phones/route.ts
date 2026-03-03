import { NextRequest } from "next/server";

import { proxyPost } from "../_lib/proxy";

export async function POST(request: NextRequest) {
  return proxyPost(request, "/api/v1/visit-search-by-date-phones/");
}
