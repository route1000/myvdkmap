import { NextResponse, type NextRequest } from "next/server";

// Preserve deep links and reloads. Only cross-site writes to the API are blocked.
export function middleware(req: NextRequest) {
  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json(
      { error: "Запрос с другого сайта отклонён" },
      { status: 403 },
    );
  }
}

export const config = { matcher: ["/api/:path*"] };
