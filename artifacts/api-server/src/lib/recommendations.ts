import type { Place } from "@workspace/db";

/** RU interest labels used in onboarding/profile → place.category slugs. */
export const INTEREST_TO_CATEGORY: Record<string, string> = {
  Природа: "nature",
  Наследие: "heritage",
  Ремёсла: "crafts",
  "Еда и рынки": "food",
  "Местный быт": "local_life",
};

const CATEGORY_LABEL_RU: Record<string, string> = {
  nature: "Природа",
  heritage: "Наследие",
  crafts: "Ремёсла",
  food: "Еда и рынки",
  local_life: "Местный быт",
};

/** Extra keyword tokens (lowercase) that reinforce an interest beyond category. */
const INTEREST_KEYWORDS: Record<string, string[]> = {
  Природа: ["nature", "lake", "lakes", "mountain", "mountains", "park", "waterfall", "plateau", "desert", "озеро", "парк", "водопад", "горы"],
  Наследие: ["heritage", "archaeology", "unesco", "necropolis", "petroglyph", "ancient", "городище", "наследие", "музей"],
  Ремёсла: ["crafts", "ceramics", "silk", "ceramic", "ремесл", "керамик", "шёлк", "шелк"],
  "Еда и рынки": ["food", "bazaar", "market", "базар", "рынок", "еда", "кухн"],
  "Местный быт": ["local", "local-life", "yurt", "village", "быт", "юрт", "парк", "город"],
};

export type RankedPlace = {
  place: Place;
  score: number;
  reasons: string[];
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function interestCategory(interest: string): string | undefined {
  return INTEREST_TO_CATEGORY[interest];
}

/**
 * Deterministic, explainable score: category match + tag/kind/name keyword overlap.
 * Does not invent verification status or change place fields.
 */
export function scorePlaceForInterests(
  place: Place,
  interests: string[],
): RankedPlace {
  const reasons: string[] = [];
  let score = 0;
  const tags = (place.tags ?? []).map(normalize);
  const kind = normalize(place.kind ?? "");
  const haystack = normalize(
    `${place.nameRu} ${place.nameEn} ${place.summaryRu} ${place.summaryEn} ${place.kind}`,
  );

  for (const interest of interests) {
    const category = interestCategory(interest);
    if (category && place.category === category) {
      score += 5;
      reasons.push(`Категория: ${CATEGORY_LABEL_RU[category] ?? interest}`);
    }
    if (category && tags.includes(category)) {
      score += 2;
      reasons.push(`Тег категории: ${category}`);
    }
    const keywords = INTEREST_KEYWORDS[interest] ?? [];
    for (const keyword of keywords) {
      if (tags.some((tag) => tag === keyword || tag.includes(keyword))) {
        score += 2;
        reasons.push(`Тег: ${keyword}`);
        break;
      }
      if (kind.includes(keyword) || haystack.includes(keyword)) {
        score += 1;
        reasons.push(`Описание/тип: ${interest}`);
        break;
      }
    }
  }

  // Stable unique reasons (preserve order).
  const uniqueReasons = [...new Set(reasons)].slice(0, 4);
  return { place, score, reasons: uniqueReasons };
}

export function rankPlacesByInterests(
  places: Place[],
  interests: string[],
  limit = 8,
): RankedPlace[] {
  const cleaned = interests.map((item) => item.trim()).filter(Boolean);
  if (!cleaned.length) return [];

  return places
    .map((place) => scorePlaceForInterests(place, cleaned))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.place.nameEn.localeCompare(b.place.nameEn);
    })
    .slice(0, limit);
}
