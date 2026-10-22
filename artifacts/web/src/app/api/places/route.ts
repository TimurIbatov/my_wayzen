import { ListPlacesQueryParams, ListPlacesResponse } from "@workspace/api-zod";
import { NextRequest, NextResponse } from "next/server";
import { listPublicPlaces } from "@/lib/places-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = ListPlacesQueryParams.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    region: request.nextUrl.searchParams.get("region") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The request did not match the expected format." },
      { status: 400 },
    );
  }
  try {
    const places = await listPublicPlaces(parsed.data);
    return NextResponse.json(ListPlacesResponse.parse(places));
  } catch (error) {
    console.error("GET /api/places failed", error);
    return NextResponse.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
