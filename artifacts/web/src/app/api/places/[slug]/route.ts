import { GetPlaceParams, GetPlaceResponse } from "@workspace/api-zod";
import { NextResponse } from "next/server";
import { getPublicPlaceBySlug } from "@/lib/places-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const parsed = GetPlaceParams.safeParse({ slug });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The request did not match the expected format." },
      { status: 400 },
    );
  }
  try {
    const place = await getPublicPlaceBySlug(parsed.data.slug);
    if (!place) {
      return NextResponse.json({ error: "Place not found." }, { status: 404 });
    }
    return NextResponse.json(GetPlaceResponse.parse(place));
  } catch (error) {
    console.error("GET /api/places/:slug failed", error);
    return NextResponse.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
