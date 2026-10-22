import { GetOverviewResponse } from "@workspace/api-zod";
import { NextResponse } from "next/server";
import { getOverview } from "@/lib/places-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOverview();
    return NextResponse.json(GetOverviewResponse.parse(data));
  } catch (error) {
    console.error("GET /api/overview failed", error);
    return NextResponse.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
