import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let placesTotal: number | null = null;
  let overviewError = "";
  if (process.env.DATABASE_URL) {
    try {
      const { getOverview } = await import("@/lib/places-query");
      const overview = await getOverview();
      placesTotal = overview.placesTotal;
    } catch (error) {
      overviewError = error instanceof Error ? error.message : "overview failed";
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 20px 80px" }}>
      <p style={{ color: "#2dd4bf", fontWeight: 600, margin: 0 }}>WayZen · Vercel + Neon</p>
      <h1 style={{ fontStyle: "italic", fontSize: "clamp(2.4rem,6vw,3.5rem)", margin: "12px 0" }}>
        Deploy surface
      </h1>
      <p style={{ color: "#94a3b8", lineHeight: 1.65 }}>
        Phase 1 ships Next.js Route Handlers for core catalog APIs on Vercel, wired to Neon Postgres
        via <code>DATABASE_URL</code>. The full Vite SPA (landing / AI / admin) still runs locally
        until Phase 2 embeds it here — see <code>docs/deploy-vercel-neon.md</code>.
      </p>
      <ul style={{ lineHeight: 1.8, color: "#cbd5e1" }}>
        <li>
          Health: <Link href="/api/healthz">/api/healthz</Link>
        </li>
        <li>
          Places: <Link href="/api/places">/api/places</Link>
        </li>
        <li>
          Overview: <Link href="/api/overview">/api/overview</Link>
        </li>
      </ul>
      <p style={{ color: "#64748b", fontSize: 14 }}>
        DATABASE_URL {process.env.DATABASE_URL ? "is set" : "is missing"}
        {placesTotal != null ? ` · catalog placesTotal=${placesTotal}` : ""}
        {overviewError ? ` · ${overviewError}` : ""}
      </p>
    </main>
  );
}
