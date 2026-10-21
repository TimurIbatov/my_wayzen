/**
 * Generates lib/db/src/seed-places-extra.mjs — upgrades of former template
 * places + new preliminary archive leads (all handWritten, never verified).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function P({
  slug, nameRu, nameEn, nameUz = null, latitude, longitude, region, category, kind, kindEn,
  summaryRu, summaryEn, ru, en, practicalNotesRu, practicalNotesEn,
  imageUrls, imageCredit, tags, seasonality, accessDifficulty, storySource,
}) {
  return {
    handWritten: true,
    slug, nameRu, nameEn, nameUz, latitude, longitude, region, category, kind, kindEn,
    summaryRu, summaryEn,
    storyRu: ru.join("\n\n"),
    storyEn: en.join("\n\n"),
    practicalNotesRu, practicalNotesEn, imageUrls, imageCredit, tags, seasonality,
    accessDifficulty, storySource,
  };
}

const notesDefault = {
  ru: "Уточните доступ, подъезд и актуальные правила перед поездкой. Часы, цены и безопасность в архиве WayZen не подтверждены.",
  en: "Confirm access, approach roads, and current rules before travel. Hours, prices, and safety are not verified in the WayZen archive.",
};

const records = [
  P({
    slug: "kitab-geological-reserve",
    nameRu: "Китабский геологический заповедник",
    nameEn: "Kitab Geological Reserve",
    latitude: 39.133333, longitude: 66.883333,
    region: "Кашкадарьинская область", category: "nature",
    kind: "Геологический заповедник", kindEn: "geological reserve",
    summaryRu: "Охраняемый геологический участок у Китаба. Архив даёт ориентир; режим посещения заповедника нужно уточнять официально.",
    summaryEn: "A protected geological area near Kitab. The archive provides a lead; visiting rules need official confirmation.",
    ru: [
      "Китабский государственный геологический заповедник в открытых описаниях связывают с разрезами палеозойских пород и научной ценностью обнажений у Китаба. WayZen сохраняет точку как природоохранный ориентир, а не как туристический маршрут.",
      "Заповедный статус обычно означает строгие ограничения: не каждая тропа доступна, а исследовательский режим может отличаться от прогулочного. Архив не подтверждает входы, экскурсии или сезонные разрешения.",
      "Используйте карточку, чтобы найти район на карте и начать проверку у официальных источников. Не считайте предварительную запись разрешением войти на охраняемую территорию.",
    ],
    en: [
      "Public descriptions link Kitab State Geological Reserve to Paleozoic rock sections near Kitab. WayZen keeps a conservation lead, not a tourist itinerary through the reserve.",
      "Reserve status usually means strict limits: not every path is open, and research access may differ from casual visiting. The archive does not confirm entrances, tours, or seasonal permits.",
      "Use the card to locate the area on a map and begin checking official sources. Do not treat this preliminary record as permission to enter a protected area.",
    ],
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: ["https://upload.wikimedia.org/wikipedia/commons/c/c6/Kitob_davlat_geologiya_qo%CA%BBriqxonasi_manzarasi.jpg"],
    imageCredit: "Photo: Akobirolmasov diplomat, “Kitob davlat geologiya qoʻriqxonasi manzarasi.jpg”, CC BY-SA 4.0, Wikimedia Commons.",
    tags: ["nature", "geology", "reserve", "qashqadaryo"],
    seasonality: ["spring", "autumn"],
    accessDifficulty: "Охраняемая территория — доступ требует официальной проверки / Protected reserve — access needs official confirmation",
    storySource: "WayZen prototype archive + public descriptions of Kitab Geological Reserve; not an official reserve brief.",
  }),
  P({
    slug: "langar-canyon",
    nameRu: "Каньон Лангар и мавзолей Лангар-ота",
    nameEn: "Langar Canyon and Langar-ota Mausoleum",
    latitude: 38.966667, longitude: 66.233333,
    region: "Кашкадарьинская область", category: "heritage",
    kind: "Каньон и мавзолей", kindEn: "canyon and mausoleum",
    summaryRu: "Каньон и святое место у Лангара. Архивная точка объединяет ландшафт и наследие; доступ и этикет нужно уточнять локально.",
    summaryEn: "A canyon and sacred site near Langar. The archive pin joins landscape and heritage; access and etiquette need local confirmation.",
    ru: [
      "Лангар в публичных заметках часто описывают как сочетание узкого каньона и мавзолея Лангар-ота — место, где рельеф соседствует с паломнической практикой. WayZen хранит объединённый ориентир.",
      "Посещение каньона и визит к мазару могут подчиняться разным ожиданиям: одежда, поведение, сезонный поток воды. Архив не проверял тропы, парковку или правила у смотрителей.",
      "Начните с карты и местных источников, прежде чем строить день вокруг этой точки. Карточка остаётся предварительной.",
    ],
    en: [
      "Public notes often describe Langar as a narrow canyon beside the Langar-ota mausoleum — landscape next to pilgrimage practice. WayZen keeps a combined lead.",
      "Canyon walking and shrine visits may carry different expectations: dress, behavior, seasonal water. The archive has not verified trails, parking, or caretaker rules.",
      "Start with a map and local sources before building a day around this pin. The card remains preliminary.",
    ],
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: ["https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Langar_canion.jpg/1280px-Langar_canion.jpg"],
    imageCredit: "Photo: German Stimban, “Langar canion.jpg”, CC BY-SA 4.0, Wikimedia Commons.",
    tags: ["heritage", "canyon", "shrine", "qashqadaryo"],
    seasonality: ["spring", "autumn"],
    accessDifficulty: "Каньон и священное место — условия не проверены / Canyon and sacred site — conditions unverified",
    storySource: "WayZen prototype archive + public mentions of Langar Canyon / Langar-ota; not field-verified.",
  }),
  P({
    slug: "urgut-bazaar",
    nameRu: "Базар Ургута", nameEn: "Urgut Bazaar",
    latitude: 39.402222, longitude: 67.243056,
    region: "Самаркандская область", category: "food",
    kind: "Базар", kindEn: "bazaar",
    summaryRu: "Крупный пригородный базар у Ургута. Архив отмечает локальный ориентир еды и ремёсел; дни торговли нужно проверять.",
    summaryEn: "A large suburban bazaar near Urgut. The archive marks a food-and-crafts lead; market days need confirmation.",
    ru: [
      "Ургутский базар в путевых заметках часто упоминают как место за продуктами, тканями и бытовыми товарами за пределами центра Самарканда. WayZen сохраняет рыночный ориентир, а не гид по рядам.",
      "Рынки меняют ассортимент, дни пиковой торговли и правила парковки. Архив не подтверждает «лучший» день недели или цены.",
      "Используйте карточку, чтобы найти базар на карте, и уточняйте расписание у местных источников перед поездкой.",
    ],
    en: [
      "Travel notes often mention Urgut Bazaar for food, textiles, and household goods beyond central Samarkand. WayZen keeps a market lead, not a stall guide.",
      "Markets change goods, peak days, and parking rules. The archive does not confirm the “best” weekday or prices.",
      "Use the card to locate the bazaar, and confirm schedules with local sources before travel.",
    ],
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: ["https://upload.wikimedia.org/wikipedia/commons/d/d1/Urgut_Sunday_market_bread_sellers.JPG"],
    imageCredit: "Photo: Betta27, “Urgut Sunday market bread sellers.JPG”, Public domain, Wikimedia Commons.",
    tags: ["food", "bazaar", "samarkand", "urgut"],
    seasonality: ["year-round"],
    accessDifficulty: "Городской рынок — расписание не проверено / Town market — schedule unverified",
    storySource: "WayZen prototype archive + public mentions of Urgut market; not a current schedule.",
  }),
  P({
    slug: "nuratau-villages",
    nameRu: "Гостевые дома в горах Нуратау",
    nameEn: "Nuratau Mountain Guesthouses",
    latitude: 40.566667, longitude: 65.683333,
    region: "Навоийская область", category: "local_life",
    kind: "Сельский быт", kindEn: "rural life",
    summaryRu: "Горные кишлаки Нуратау с традицией гостевых домов. Архив указывает район; конкретные дома нужно искать отдельно.",
    summaryEn: "Nuratau mountain villages with a guesthouse tradition. The archive marks the district; specific houses need separate research.",
    ru: [
      "Нуратау в открытых описаниях связывают с кишлаками вроде Сентоба и сельским приёмом гостей у подножия хребта. WayZen хранит районный ориентир, а не каталог домов.",
      "Наличие мест, питание и транспорт зависят от сезона и хозяев. Архив не проверял бронирование, цены или дорожные условия.",
      "Начните с карты региона и свежих местных контактов. Карточка не заменяет договорённость о ночлеге.",
    ],
    en: [
      "Public descriptions link Nuratau to villages such as Sentob and rural guest stays. WayZen keeps a district lead, not a guesthouse directory.",
      "Availability, meals, and transport depend on season and hosts. The archive has not verified booking, prices, or roads.",
      "Start with a regional map and fresh local contacts. The card does not replace arranging a stay.",
    ],
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Sentob_valley.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Nuratau_mountains_and_Aydar_lake.jpg/1280px-Nuratau_mountains_and_Aydar_lake.jpg",
    ],
    imageCredit: "Photos: Clemens Schmillen; Carpodacus — Wikimedia Commons (CC BY-SA 4.0).",
    tags: ["local-life", "guesthouse", "nuratau", "navoi"],
    seasonality: ["late spring", "summer", "early autumn"],
    accessDifficulty: "Горные кишлаки — дорога и размещение не проверены / Mountain villages — road and lodging unverified",
    storySource: "WayZen prototype archive + public descriptions of Nuratau village stays; not a booking list.",
  }),
  P({
    slug: "aydarkul-yurts",
    nameRu: "Юртовые стоянки у озера Айдаркуль",
    nameEn: "Aydarkul Lake Yurt Camps",
    latitude: 40.916667, longitude: 67.166667,
    region: "Навоийская область", category: "local_life",
    kind: "Юртовые стоянки", kindEn: "yurt camps",
    summaryRu: "Юртовые лагеря у Айдаркуля — ориентир степного ночлега. Конкретный лагерь и сезон нужно подтверждать.",
    summaryEn: "Yurt camps by Aydarkul — a steppe-stay lead. Confirm a specific camp and season separately.",
    ru: [
      "Айдаркуль в путевых текстах часто упоминают вместе с юртовыми стоянками на берегу степного водоёма. WayZen сохраняет ландшафтный ориентир, а не список операторов.",
      "Лагеря открываются по сезону и зависят от хозяев. Архив не проверял наличие мест, цены или безопасность купания.",
      "Сверьте район на карте и уточняйте размещение напрямую. Предварительная карточка не является бронью.",
    ],
    en: [
      "Travel writing often mentions Aydarkul with yurt camps on a steppe reservoir shore. WayZen keeps a landscape lead, not an operator list.",
      "Camps open by season and depend on hosts. The archive has not verified availability, prices, or swimming safety.",
      "Match the district on a map and confirm lodging directly. The preliminary card is not a reservation.",
    ],
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: ["https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Aydar_Lake.jpg/1280px-Aydar_Lake.jpg"],
    imageCredit: "Photo: DAVID HOLT, “Aydar Lake.jpg”, CC BY-SA 2.0, Wikimedia Commons.",
    tags: ["local-life", "yurt", "aydarkul", "navoi"],
    seasonality: ["late spring", "summer", "early autumn"],
    accessDifficulty: "Степной берег — лагеря не проверены / Steppe shore — camps unverified",
    storySource: "WayZen prototype archive + public mentions of Aydarkul yurt stays; not a camp directory.",
  }),
];

/** Compact definitions for additional Uzbekistan leads */
const more = [
  ["ayaz-kala", "Аяз-кала", "Ayaz-Kala", 42.0167, 61.0333, "Каракалпакстан", "heritage", "Крепость", "fortress", "Холмовые крепости Аяз-кала в Хорезме.", "The Ayaz-Kala hill forts of Khorezm.", ["heritage", "khorezm", "karakalpakstan"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/3/3a/Ayaz_Kala.jpg", "Photo: David Stanley, Ayaz Kala.jpg, CC BY 2.0, Wikimedia Commons."],
  ["janbas-kala", "Жанбас-кала", "Janbas-Kala", 41.9, 61.4, "Каракалпакстан", "heritage", "Крепость", "fortress", "Древняя крепость Жанбас-кала в Хорезме.", "Ancient Janbas-Kala fortress in Khorezm.", ["heritage", "khorezm"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/8/8a/Kyzyl_Kala.jpg", "Illustrative Khorezm fort imagery, Wikimedia Commons — verify on-site photo before reuse."],
  ["kyzyl-kala", "Кызыл-кала", "Kyzyl-Kala", 41.93, 60.78, "Каракалпакстан", "heritage", "Крепость", "fortress", "Крепость Кызыл-кала у комплекса Топрак-кала.", "Kyzyl-Kala fortress near Toprak-Kala.", ["heritage", "khorezm"], ["spring", "autumn", "winter"], "https://upload.wikimedia.org/wikipedia/commons/8/8a/Kyzyl_Kala.jpg", "Kyzyl-Kala related photo on Wikimedia Commons."],
  ["fayaz-tepa", "Фаяз-тепа", "Fayaz-Tepa", 37.2667, 67.1833, "Сурхандарьинская область", "heritage", "Буддийский комплекс", "Buddhist complex", "Буддийский комплекс у Термеза.", "Buddhist complex near Termez.", ["heritage", "buddhist", "termez"], ["autumn", "winter", "spring"], "https://upload.wikimedia.org/wikipedia/commons/4/4f/Fayaz_Tepa.jpg", "Photo: Fayaz Tepa.jpg on Wikimedia Commons — confirm license on file page."],
  ["kara-tepe", "Кара-тепе", "Kara-Tepe", 37.2833, 67.15, "Сурхандарьинская область", "heritage", "Буддийский комплекс", "Buddhist complex", "Пещерно-наземный буддийский комплекс у Термеза.", "Cave-and-surface Buddhist complex near Termez.", ["heritage", "buddhist", "termez"], ["autumn", "winter", "spring"], "https://upload.wikimedia.org/wikipedia/commons/2/2e/Termez_Archaeological_Museum.jpg", "Illustrative Termez museum context, Wikimedia Commons."],
  ["kampyr-tepa", "Кампыр-тепа", "Kampyr-Tepa", 37.4, 66.9833, "Сурхандарьинская область", "heritage", "Городище", "settlement site", "Античное городище на Амударье.", "Ancient settlement on the Amu Darya.", ["heritage", "archaeology", "amudarya"], ["autumn", "winter", "spring"], "https://upload.wikimedia.org/wikipedia/commons/0/0c/Oxus_River.jpg", "Illustrative Amu Darya landscape, Wikimedia Commons."],
  ["gissar-fortress", "Гиссарская крепость", "Hissar Fortress", 38.5139, 68.5833, "near Tajik border context / Сурхандарья research lead", "heritage", "Крепость", "fortress", "Ориентир крепости Гиссар в региональном контексте; уточняйте фактическую локацию визита в Узбекистане.", "Hissar fortress lead in regional context; confirm the actual visit location inside Uzbekistan.", ["heritage", "fortress"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/5/5e/Hissar_Fortress.jpg", "Photo related to Hissar Fortress on Wikimedia Commons — confirm geography before using as on-site evidence."],
];

// Fix gissar - that's in Tajikistan. Replace with Uzbekistan-only places.
const moreUz = [
  ["boysun", "Байсун", "Boysun", 38.2, 67.2, "Сурхандарьинская область", "local_life", "Культурный ландшафт", "cultural landscape", "Байсун — кишлачный край с живой этнокультурной традицией Сурхандарьи.", "Boysun — a village landscape with living ethnocultural traditions in Surkhandarya.", ["local-life", "unesco-related", "surkhandarya"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/9/9a/Boysun.jpg", "Boysun-related photo on Wikimedia Commons — confirm file page credit."],
  ["sangardak-waterfall", "Водопад Сангардак", "Sangardak Waterfall", 38.45, 67.55, "Сурхандарьинская область", "nature", "Водопад", "waterfall", "Горный водопад Сангардак в Сурхандарье.", "Sangardak mountain waterfall in Surkhandarya.", ["nature", "waterfall", "surkhandarya"], ["late spring", "summer"], "https://upload.wikimedia.org/wikipedia/commons/1/1f/Sangardak.jpg", "Sangardak-related image on Wikimedia Commons — verify file page."],
  ["khujaypok-waterfall", "Водопад Хужаипок", "Khujaypok Waterfall", 38.35, 67.4, "Сурхандарьинская область", "nature", "Водопад", "waterfall", "Водопад Хужаипок в Байсунском районе.", "Khujaypok waterfall in the Boysun district.", ["nature", "waterfall", "boysun"], ["late spring", "summer"], "https://upload.wikimedia.org/wikipedia/commons/d/d7/Langar_canion.jpg", "Illustrative Surkhandarya canyon/waterfall context, Wikimedia Commons."],
  ["zarautsoy", "Зараутсай", "Zarautsoy", 38.15, 67.05, "Сурхандарьинская область", "heritage", "Петроглифы", "petroglyphs", "Ущелье Зараутсай с наскальными изображениями.", "Zarautsoy gorge with rock art.", ["heritage", "petroglyphs", "surkhandarya"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/8/89/Oxes_in_Sarmysh.jpg", "Illustrative Uzbekistan rock-art context (Sarmysh photo), Wikimedia Commons — not a Zarautsoy panel photo."],
  ["nukus-savitsky", "Музей Савицкого в Нукусе", "Savitsky Museum Nukus", 42.46, 59.61, "Каракалпакстан", "heritage", "Музей", "museum", "Государственный музей искусств имени И.В. Савицкого в Нукусе.", "Savitsky State Museum of Art in Nukus.", ["heritage", "museum", "nukus", "karakalpakstan"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/6/6e/Nukus_museum.jpg", "Nukus museum-related photo on Wikimedia Commons — confirm file page."],
  ["sudochye-lake", "Озеро Судочье", "Sudochye Lake", 43.4, 58.5, "Каракалпакстан", "nature", "Озеро", "lake", "Озёрная система Судочье в дельте Амударьи — орнитологический ориентир.", "Sudochye lake system in the Amu Darya delta — a birding lead.", ["nature", "lake", "birds", "karakalpakstan"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/c/c4/Aydar_Lake.jpg", "Illustrative Uzbekistan lake landscape, Wikimedia Commons — not a verified Sudochye photo."],
  ["konigil-paper", "Бумага в Конигиле", "Konigil Paper Mill", 39.7, 67.05, "Самаркандская область", "crafts", "Ремесло", "craft workshop", "Мастерская традиционной бумаги у Самарканда (Конигиль).", "Traditional paper workshop near Samarkand (Konigil).", ["crafts", "paper", "samarkand"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/a/a8/Samarkand_paper.jpg", "Samarkand paper craft related image on Wikimedia Commons — confirm file page."],
  ["afrosiab", "Городище Афрасиаб", "Afrosiab", 39.67, 66.99, "Самаркандская область", "heritage", "Городище", "ancient city", "Древнее городище Афрасиаб и музей фресок у Самарканда.", "Ancient Afrosiab site and fresco museum at Samarkand.", ["heritage", "archaeology", "samarkand"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/2/2c/Afrasiab.jpg", "Afrosiab-related photo on Wikimedia Commons — confirm file page."],
  ["ulugh-beg-observatory", "Обсерватория Улугбека", "Ulugh Beg Observatory", 39.675, 67.0, "Самаркандская область", "heritage", "Обсерватория", "observatory", "Мемориальный комплекс обсерватории Улугбека в Самарканде.", "Ulugh Beg Observatory memorial complex in Samarkand.", ["heritage", "science", "samarkand"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/4/4a/Ulugh_Beg_Observatory.jpg", "Ulugh Beg Observatory photo on Wikimedia Commons — confirm file page."],
  ["shahrisabz-kok-gumbaz", "Кок-Гумбаз в Шахрисабзе", "Kok Gumbaz Shahrisabz", 39.057, 66.834, "Кашкадарьинская область", "heritage", "Мечеть", "mosque", "Мечеть Кок-Гумбаз — ориентир наследия Шахрисабза вне самого раскрученного дворца.", "Kok Gumbaz mosque — a Shahrisabz heritage lead beyond the most famous palace ruins.", ["heritage", "shahrisabz", "mosque"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/7/7d/Kok_Gumbaz_Mosque.jpg", "Kok Gumbaz related photo on Wikimedia Commons — confirm file page."],
  ["takhtakoracha-pass", "Перевал Тахтакорача", "Takhtakoracha Pass", 39.2, 66.95, "Самаркандская область", "nature", "Перевал", "mountain pass", "Горный перевал между Самаркандом и Шахрисабзом.", "Mountain pass between Samarkand and Shahrisabz.", ["nature", "mountains", "pass"], ["late spring", "summer", "early autumn"], "https://upload.wikimedia.org/wikipedia/commons/e/e5/Sentob_valley.jpg", "Illustrative Uzbekistan mountain valley, Wikimedia Commons."],
  ["zarafshan-reserve", "Зарафшанский заповедник", "Zarafshan Reserve", 39.6, 67.2, "Самаркандская область", "nature", "Заповедник", "nature reserve", "Пойменный Зарафшанский заповедник — тугаи и охраняемая природа.", "Zarafshan riparian reserve — tugai woodland and protected nature.", ["nature", "reserve", "samarkand"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/0/0c/Oxus_River.jpg", "Illustrative riparian landscape, Wikimedia Commons."],
  ["nanay-village", "Нанай", "Nanay", 41.72, 70.15, "Ташкентская область", "local_life", "Горный кишлак", "mountain village", "Горный кишлак Нанай в Ташкентской области.", "Nanay mountain village in Tashkent Region.", ["local-life", "mountains", "tashkent-region"], ["late spring", "summer", "early autumn"], "https://upload.wikimedia.org/wikipedia/commons/b/b2/Lake_Urungach_06.jpg", "Illustrative Tashkent Region mountain landscape, Wikimedia Commons."],
  ["burchmulla", "Бурчмулла", "Burchmulla", 41.6, 70.1, "Ташкентская область", "local_life", "Горный посёлок", "mountain settlement", "Бурчмулла — посёлок у горных направлений Чарвака/Пскема.", "Burchmulla — a settlement near Charvak/Pskem mountain routes.", ["local-life", "mountains", "tashkent-region"], ["late spring", "summer"], "https://upload.wikimedia.org/wikipedia/commons/b/b2/Lake_Urungach_06.jpg", "Illustrative Tashkent Region mountain landscape, Wikimedia Commons."],
  ["gulkam-canyon", "Ущелье Гулькам", "Gulkam Canyon", 41.55, 70.05, "Ташкентская область", "nature", "Ущелье", "canyon", "Ущелье Гулькам с водопадными участками в Ташкентских горах.", "Gulkam Canyon with waterfall sections in the Tashkent mountains.", ["nature", "canyon", "waterfall", "tashkent-region"], ["late spring", "summer"], "https://upload.wikimedia.org/wikipedia/commons/6/6a/Paltau_Waterfall.JPG", "Illustrative Tashkent Region waterfall context (Paltau), Wikimedia Commons."],
  ["charvak-reservoir", "Чарвакское водохранилище", "Charvak Reservoir", 41.63, 70.03, "Ташкентская область", "nature", "Водохранилище", "reservoir", "Чарвак — горное водохранилище и ориентир зоны отдыха; архив отмечает ландшафт, не пляжи.", "Charvak — a mountain reservoir and recreation-zone lead; the archive marks landscape, not beaches.", ["nature", "reservoir", "tashkent-region"], ["summer", "early autumn"], "https://upload.wikimedia.org/wikipedia/commons/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg", "Illustrative Uzbekistan mountain reservoir/park context, Wikimedia Commons."],
  ["pskem-valley", "Долина Пскема", "Pskem Valley", 41.85, 70.35, "Ташкентская область", "nature", "Горная долина", "mountain valley", "Долина реки Пскем — удалённый горный ориентир.", "Pskem River valley — a remote mountain lead.", ["nature", "mountains", "remote", "tashkent-region"], ["summer"], "https://upload.wikimedia.org/wikipedia/commons/b/b2/Lake_Urungach_06.jpg", "Illustrative Western Tian Shan lake/mountain context, Wikimedia Commons."],
  ["chimgan", "Чимган", "Chimgan", 41.5, 70.02, "Ташкентская область", "nature", "Горный район", "mountain area", "Чимган — популярный горный район; в архиве как ориентир троп и базы, без обещания сервиса.", "Chimgan — a popular mountain area; archive lead for trails and bases without promising services.", ["nature", "mountains", "tashkent-region"], ["late spring", "summer", "winter"], "https://upload.wikimedia.org/wikipedia/commons/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg", "Illustrative Uzbekistan mountains, Wikimedia Commons."],
  ["chust-knives", "Ножевой промысел в Чусте", "Chust Knives", 40.997, 71.237, "Наманганская область", "crafts", "Ремесло", "craft", "Чуст известен традицией ножей Ферганской долины.", "Chust is known for the Fergana Valley knife-making tradition.", ["crafts", "knives", "fergana", "namangan"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lagan2024.jpg", "Illustrative Fergana craft object context, Wikimedia Commons."],
  ["kokand-khudoyar", "Дворец Худояр-хана", "Khudoyar Khan Palace", 40.528, 70.942, "Ферганская область", "heritage", "Дворец", "palace", "Дворец Худояр-хана в Коканде — музейный ориентир Ферганы.", "Khudoyar Khan Palace in Kokand — a Fergana museum lead.", ["heritage", "palace", "kokand", "fergana"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/5/5d/Khudayar_Khan_Palace.jpg", "Khudoyar Khan Palace photo on Wikimedia Commons — confirm file page."],
  ["andijan-bazaar", "Базар в Андижане", "Andijan Bazaar", 40.783, 72.344, "Андижанская область", "food", "Базар", "bazaar", "Городской базар Андижана — ориентир еды и быта Ферганской долины.", "Andijan city bazaar — a Fergana Valley food-and-daily-life lead.", ["food", "bazaar", "andijan"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/d/d1/Urgut_Sunday_market_bread_sellers.JPG", "Illustrative Uzbekistan bazaar scene, Wikimedia Commons."],
  ["fergana-park", "Парк Алишера Навои в Фергане", "Alisher Navoi Park Fergana", 40.386, 71.786, "Ферганская область", "local_life", "Городской парк", "city park", "Городской парк Ферганы — спокойный локальный ориентир.", "Fergana city park — a quiet local lead.", ["local-life", "park", "fergana"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lagan2024.jpg", "Illustrative Fergana cultural context, Wikimedia Commons."],
  ["kuva-buddhist", "Буддийский комплекс у Кувы", "Kuva Buddhist Site", 40.52, 72.07, "Ферганская область", "heritage", "Археология", "archaeology", "Археологический буддийский ориентир у Кувы в Ферганской долине.", "Buddhist archaeological lead near Kuva in the Fergana Valley.", ["heritage", "buddhist", "fergana"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/4/4f/Fayaz_Tepa.jpg", "Illustrative Uzbekistan Buddhist archaeology context, Wikimedia Commons."],
  ["jizzakh-temir", "Темиркапка / Джизакский перевал", "Temirkapka Pass Area", 39.95, 68.0, "Джизакская область", "nature", "Перевал", "pass area", "Горные ворота у подходов к Заамину — ландшафтный ориентир.", "Mountain gates on approaches toward Zaamin — a landscape lead.", ["nature", "mountains", "jizzakh"], ["late spring", "summer", "early autumn"], "https://upload.wikimedia.org/wikipedia/commons/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg", "Zaamin / Jizzakh mountain context, Wikimedia Commons."],
  ["nurota-mosque", "Мечеть Нурота / святилище", "Nurata Shrine Complex", 40.565, 65.685, "Навоийская область", "heritage", "Святилище", "shrine", "Святое место и источник в Нуратe — культурный ориентир у Нуратау.", "Sacred site and spring in Nurata — a cultural lead by the Nuratau area.", ["heritage", "shrine", "nuratau", "navoi"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/e/e5/Sentob_valley.jpg", "Illustrative Nuratau region landscape, Wikimedia Commons."],
  ["sarmishsay-camp", "Турбаза у Сармышсая", "Sarmishsay Visitor Area", 40.32, 65.67, "Навоийская область", "local_life", "Турбаза", "visitor base", "Ориентир инфраструктуры у петроглифов Сармышсая; наличие базы нужно проверять.", "Infrastructure lead near Sarmishsay petroglyphs; confirm whether a base is operating.", ["local-life", "navoi", "petroglyphs"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/8/89/Oxes_in_Sarmysh.jpg", "Sarmishsay rock-art photo context, Wikimedia Commons."],
  ["khodjeyli-maslumkhan", "Мавзолей Мазлумхан-сулу", "Mazlumkhan Sulu Mausoleum", 42.4, 59.45, "Каракалпакстан", "heritage", "Мавзолей", "mausoleum", "Мавзолей в комплексе Миздахкан / Ходжейли.", "Mausoleum in the Mizdakhan / Khodjeyli complex.", ["heritage", "mausoleum", "karakalpakstan"], ["spring", "autumn", "winter"], "https://upload.wikimedia.org/wikipedia/commons/8/8e/Ancient_Complex_Mizdahkan%2C_Karakalpakstan.jpg", "Mizdakhan complex photo, Wikimedia Commons."],
  ["nukus-canal-walk", "Набережная Амударьи в Нукусе", "Nukus Amu Darya Embankment", 42.47, 59.6, "Каракалпакстан", "local_life", "Городская прогулка", "city walk", "Городская набережная / прогулочный ориентир Нукуса у водных каналов.", "Nukus riverside / canal walk lead.", ["local-life", "nukus", "city"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/0/0c/Oxus_River.jpg", "Illustrative Amu Darya context, Wikimedia Commons."],
  ["muynak-museum", "Музей в Муйнаке", "Moynaq Museum", 43.766, 59.021, "Каракалпакстан", "heritage", "Музей", "museum", "Краеведческий музей Муйнака рядом с историей Арала.", "Moynaq local museum beside Aral Sea history.", ["heritage", "museum", "moynaq", "aral-sea"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/c/c1/Moynaq%2C_Aral_Lake%2C_Ship_Wrecks%2C_Uzbekistan.jpg", "Moynaq / Aral context photo, Wikimedia Commons."],
  ["denau-market", "Базар в Денау", "Denau Bazaar", 38.267, 67.899, "Сурхандарьинская область", "food", "Базар", "bazaar", "Южный базар Денау — ориентир Сурхандарьи.", "Denau southern bazaar — a Surkhandarya lead.", ["food", "bazaar", "surkhandarya"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/d/d1/Urgut_Sunday_market_bread_sellers.JPG", "Illustrative Uzbekistan market, Wikimedia Commons."],
  ["termez-arch-museum", "Археологический музей Термеза", "Termez Archaeological Museum", 37.224, 67.278, "Сурхандарьинская область", "heritage", "Музей", "museum", "Археологический музей Термеза — ключ к буддийским и античным памятникам юга.", "Termez Archaeological Museum — a key to southern Buddhist and antique sites.", ["heritage", "museum", "termez"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/2/2e/Termez_Archaeological_Museum.jpg", "Termez Archaeological Museum photo on Wikimedia Commons — confirm file page."],
  ["jarkurgan-minaret", "Джаркурганский минарет", "Jarkurgan Minaret", 37.508, 67.416, "Сурхандарьинская область", "heritage", "Минарет", "minaret", "Минарет XII века у Джаркургана.", "12th-century minaret near Jarkurgan.", ["heritage", "minaret", "surkhandarya"], ["year-round"], "https://upload.wikimedia.org/wikipedia/commons/3/3e/Jarkurgan_Minaret.jpg", "Jarkurgan Minaret photo on Wikimedia Commons — confirm file page."],
  ["kyrk-kyz", "Кырк-кыз у Термеза", "Kyrk Kyz Termez", 37.27, 67.3, "Сурхандарьинская область", "heritage", "Городище", "fortified site", "Комплекс Кырк-кыз — загадочные руины у Термеза.", "Kyrk Kyz complex — enigmatic ruins near Termez.", ["heritage", "archaeology", "termez"], ["autumn", "winter", "spring"], "https://upload.wikimedia.org/wikipedia/commons/4/4f/Fayaz_Tepa.jpg", "Illustrative Termez archaeology context, Wikimedia Commons."],
  ["navoi-sarmish-road", "Степная дорога к Сармышсаю", "Steppe Road to Sarmishsay", 40.28, 65.55, "Навоийская область", "nature", "Степной ландшафт", "steppe landscape", "Степной подход к ущелью Сармышсай — ориентир дороги, не сервис.", "Steppe approach toward Sarmishsay gorge — a road lead, not a service stop.", ["nature", "steppe", "navoi"], ["spring", "autumn"], "https://upload.wikimedia.org/wikipedia/commons/e/e3/Karabaur.jpg", "Illustrative Uzbekistan steppe/plateau landscape, Wikimedia Commons."],
];

function storyFor(nameRu, nameEn, kindRu, kindEn, region, summaryRu) {
  return {
    ru: [
      `${nameRu} (${kindRu}) включено в расширенный предварительный архив WayZen по региону «${region}». ${summaryRu} Координаты помогают начать поиск на карте, но не подтверждают текущее состояние объекта.`,
      `Публичные описания и прототипный архив дают общий контекст типа «${kindRu.toLowerCase()}», без полевой проверки WayZen. Мы намеренно не указываем часы, цены, безопасность маршрута или «проверенный» статус.`,
      `Перед поездкой сверьте точку с актуальной картой и местными либо официальными источниками. Карточка остаётся preliminary — это зацепка для самостоятельного исследования, а не путеводитель.`,
    ],
    en: [
      `${nameEn} (${kindEn}) is part of WayZen’s expanded preliminary archive for ${region}. Coordinates help you start on a map, but they do not confirm the site’s present condition.`,
      `Public descriptions and the prototype archive provide general “${kindEn}” context without a WayZen field check. We intentionally omit hours, prices, route safety, or a verified status.`,
      `Before travel, match the pin to a current map and local or official sources. The card stays preliminary — a research lead, not a guidebook.`,
    ],
  };
}

for (const row of moreUz) {
  const [slug, nameRu, nameEn, latitude, longitude, region, category, kind, kindEn, summaryRu, summaryEn, tags, seasonality, img, credit] = row;
  const stories = storyFor(nameRu, nameEn, kind, kindEn, region, summaryRu);
  records.push(P({
    slug, nameRu, nameEn, latitude, longitude, region, category, kind, kindEn,
    summaryRu, summaryEn,
    ru: stories.ru, en: stories.en,
    practicalNotesRu: notesDefault.ru, practicalNotesEn: notesDefault.en,
    imageUrls: [img], imageCredit: credit, tags, seasonality,
    accessDifficulty: "Доступ и условия требуют местной проверки / Access and conditions need local confirmation",
    storySource: "Compiled for WayZen preliminary archive from prototype notes and commonly cited public geography; not field-verified. Image may be illustrative of the region.",
  }));
}

const out = join(__dirname, "../lib/db/src/seed-places-extra.mjs");
const payload = `/** Auto-built by scripts/build-seed-extra.mjs — all verification_status forced to preliminary in seed.mjs */\nexport const extraRecords = ${JSON.stringify(records, null, 2)};\n`;
writeFileSync(out, payload);
console.log(`Wrote ${records.length} extra records to ${out}`);
console.log("slugs:", records.map((r) => r.slug).join(", "));
