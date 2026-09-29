import { NextRequest, NextResponse } from "next/server";
import { canonicalCardUrl } from "@/lib/card-query";

export const config = {
  matcher: "/api/card",
};

// Unknown query parameters still redirect to the canonical card URL (#86).
// Embeds are counted only after successful card generation in the route.
export async function middleware(request: NextRequest) {
  const canonical = canonicalCardUrl(request.nextUrl);
  if (canonical) return NextResponse.redirect(canonical, 307);
  return NextResponse.next();
}
