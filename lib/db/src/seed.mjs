import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const archiveSource =
  "Supplied WayZen prototype archive; place details are preliminary and not independently verified.";
const notesRu =
  "В архивной записи нет проверенных часов, цен, сведений о доступности или безопасности маршрута. Перед поездкой уточните точное место и текущие условия у официальных и местных источников.";
const notesEn =
  "The archive record does not provide verified hours, prices, accessibility, or route-safety details. Confirm the exact place and current conditions with official and local sources before traveling.";

function story(nameRu, nameEn, kindRu, kindEn) {
  return {
    ru: `${nameRu} включено в ранний архив WayZen как направление типа «${kindRu}». Название и координаты перенесены из прототипа; они сами по себе не подтверждают историю места, его нынешнее состояние или возможность посещения.\n\nДля этой карточки важнее всего сначала проверить саму точку: сопоставить координаты с актуальной картой и найти местный или официальный источник, который подтверждает, что именно имеется в виду. Не считайте описание подтверждённым путеводителем.`,
    en: `${nameEn} appears in the early WayZen archive as a ${kindEn.toLowerCase()} lead. Its name and coordinates were carried over from the prototype; they do not establish the site's history, present condition, or visitor access.\n\nThe first useful step is to verify the pin itself against a current map and find an official or local source that confirms what the record refers to. Treat this as a research lead, not a verified guide.`,
  };
}

const records = [
  {
    slug: "urunqach-jade-lake",
    nameRu: "Урунгачские озёра",
    nameEn: "The Urungach Lakes",
    latitude: 41.643889,
    longitude: 70.163611,
    region: "Ташкентская область",
    category: "nature",
    kind: "Горные озёра",
    kindEn: "mountain lakes",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b2/Lake_Urungach_06.jpg",
    ],
    imageCredit:
      "Photo: UK92, “Lake Urungach 06.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Lake_Urungach_06.jpg).",
  },
  {
    slug: "zaamin-national-park",
    nameRu: "Зааминский национальный парк",
    nameEn: "Zaamin National Park",
    latitude: 39.966667,
    longitude: 68.4,
    region: "Джизакская область",
    category: "nature",
    kind: "Национальный парк",
    kindEn: "national park",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg/1280px-Zaamin_National_Park%2C_Uzbekistan.jpg",
    ],
    imageCredit:
      "Photo: Mirzozominiy, “Zaamin National Park, Uzbekistan.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Zaamin_National_Park,_Uzbekistan.jpg).",
  },
  {
    slug: "ustyurt-plateau",
    nameRu: "Плато Устюрт",
    nameEn: "Ustyurt Plateau",
    latitude: 43.3,
    longitude: 55.5,
    region: "Каракалпакстан",
    category: "nature",
    kind: "Плато",
    kindEn: "plateau",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e3/Karabaur.jpg",
    ],
    imageCredit:
      "Photo: Rustam Murzakhanov, “Karabaur.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Karabaur.jpg).",
  },
  {
    slug: "kitab-geological-reserve",
    nameRu: "Китабский геологический заповедник",
    nameEn: "Kitab Geological Reserve",
    latitude: 39.133333,
    longitude: 66.883333,
    region: "Кашкадарьинская область",
    category: "nature",
    kind: "Геологический заповедник",
    kindEn: "geological reserve",
    imageUrls: [],
    imageCredit: "",
  },
  {
    slug: "paltau-waterfall",
    nameRu: "Водопад Пальтау",
    nameEn: "Paltau Waterfall",
    latitude: 41.583333,
    longitude: 70.083333,
    region: "Ташкентская область",
    category: "nature",
    kind: "Водопад",
    kindEn: "waterfall",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Paltau_Waterfall.JPG/1280px-Paltau_Waterfall.JPG",
    ],
    imageCredit:
      "Photo: German Stimban, “Paltau Waterfall.JPG”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Paltau_Waterfall.JPG).",
  },
  {
    slug: "moynaq-ship-graveyard",
    nameRu: "Кладбище кораблей в Муйнаке",
    nameEn: "Moynaq Ship Graveyard",
    latitude: 43.768333,
    longitude: 59.021389,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Индустриальное наследие",
    kindEn: "industrial heritage",
    imageUrls: [],
    imageCredit: "",
  },
  {
    slug: "sarmysh-say-gorge",
    nameRu: "Ущелье Сармыш-сай",
    nameEn: "Sarmysh-Say Gorge",
    latitude: 40.316667,
    longitude: 65.666667,
    region: "Навоийская область",
    category: "heritage",
    kind: "Петроглифы и ландшафт",
    kindEn: "petroglyphs and landscape",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Oxes_in_Sarmysh.jpg/1280px-Oxes_in_Sarmysh.jpg",
    ],
    imageCredit:
      "Photo: Carpodacus, “Oxes in Sarmysh.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Oxes_in_Sarmysh.jpg).",
  },
  {
    slug: "langar-canyon",
    nameRu: "Каньон Лангар и мавзолей Лангар-ота",
    nameEn: "Langar Canyon and Langar-ota Mausoleum",
    latitude: 38.966667,
    longitude: 66.233333,
    region: "Кашкадарьинская область",
    category: "heritage",
    kind: "Каньон и мавзолей",
    kindEn: "canyon and mausoleum",
    imageUrls: [],
    imageCredit: "",
  },
  {
    slug: "mizdakhan-necropolis",
    nameRu: "Некрополь Миздахкан",
    nameEn: "Mizdakhan Necropolis",
    latitude: 42.397222,
    longitude: 59.445,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Некрополь",
    kindEn: "necropolis",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Ancient_Complex_Mizdahkan%2C_Karakalpakstan.jpg",
    ],
    imageCredit:
      "Photo: damda.uz, “Ancient Complex Mizdahkan, Karakalpakstan.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Ancient_Complex_Mizdahkan,_Karakalpakstan.jpg).",
  },
  {
    slug: "chilpik-kala",
    nameRu: "Кала Чилпык",
    nameEn: "Chilpik Kala",
    latitude: 42.166667,
    longitude: 60.366667,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Археологический памятник",
    kindEn: "archaeological site",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ce/Chilpiq_qal%27a1.jpg",
    ],
    imageCredit:
      "Photo: Umid Khakimov, “Chilpiq qal'a1.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Chilpiq_qal%27a1.jpg).",
  },
  {
    slug: "toprak-kala",
    nameRu: "Топрак-кала",
    nameEn: "Toprak-Kala",
    latitude: 41.933333,
    longitude: 60.816667,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Археологический памятник",
    kindEn: "archaeological site",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Toprak_Kala_%28Khorezm%2C_Uzbekistan%29_banner.jpg/1280px-Toprak_Kala_%28Khorezm%2C_Uzbekistan%29_banner.jpg",
    ],
    imageCredit:
      "Photo: dalbera (derivative banner), “Toprak Kala (Khorezm, Uzbekistan) banner.jpg”, CC BY 2.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Toprak_Kala_(Khorezm,_Uzbekistan)_banner.jpg).",
    storyRu:
      "Топрак-кала начинается с прямоугольного плана, но археологическое описание раскрывает целый город: поселение, высокий дворец и северный комплекс. В заявке Узбекистана для Предварительного списка Всемирного наследия ЮНЕСКО комплекс датирован I–VI веками нашей эры. Согласно этой заявке, главная улица шла от южных ворот к цитадели в северо-западной части, а боковые улицы делили жилую застройку на кварталы. Даже без реконструкции перед глазами читается городская логика — движение от входа к центру власти.\n\nВо дворце археологи обнаружили помещения с остатками архива; стены залов были украшены росписями и рельефами. Эти детали собраны из археологических описаний, а не из легенды. Источник — заявка Узбекистана, опубликованная в Предварительном списке ЮНЕСКО; такой статус не означает включения в Список всемирного наследия. Точка WayZen и сведения о её нынешнем состоянии и доступе остаются предварительными.",
    storyEn:
      "Toprak-Kala begins as a rectangle on a map, but its archaeological description reveals a whole urban complex: a settlement, a high palace, and a northern complex. Uzbekistan's submission to UNESCO's World Heritage Tentative List dates the complex to the 1st–6th centuries CE. In that submission, a main street runs from the southern gate toward a citadel in the northwest, while side streets divide the residential area into blocks. Even without a reconstruction, the plan suggests a city organized around movement from its entrance toward a political center.\n\nArchaeologists found rooms containing remains of a palace archive, and the halls were decorated with paintings and reliefs. These details come from archaeological descriptions, not a local legend. The source is Uzbekistan's submission published on UNESCO's Tentative List; tentative status does not mean inscription on the World Heritage List. WayZen's pin and information about present condition or access remain preliminary.",
    storySource:
      "Story sources: UNESCO World Heritage Centre, “Ancient towns and fortresses of the Aral Sea region”, Tentative List submission (2025; not an inscribed property), https://whc.unesco.org/en/tentativelists/6903; Encyclopaedia Iranica, “Chorasmia I. Archaeology and Pre-Islamic History”, https://www.iranicaonline.org/articles/chorasmia-i.",
  },
  {
    slug: "rishtan-ceramics",
    nameRu: "Центр керамики в Риштане",
    nameEn: "Rishtan Ceramic Center",
    latitude: 40.356944,
    longitude: 71.284722,
    region: "Ферганская область",
    category: "crafts",
    kind: "Керамика",
    kindEn: "ceramics",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lagan2024.jpg",
    ],
    imageCredit:
      "Photo: UzbekistanWikiEditor, “Lagan2024.jpg”, CC BY 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Lagan2024.jpg).",
  },
  {
    slug: "margilan-silk",
    nameRu: "Шёлковая фабрика «Ёдгорлик»",
    nameEn: "Yodgorlik Silk Factory",
    latitude: 40.466667,
    longitude: 71.716667,
    region: "Ферганская область",
    category: "crafts",
    kind: "Шёлковое ремесло",
    kindEn: "silk craft",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Yodgorlik_Silk_Factory%2C_Margilan_%28496248%29.jpg/1280px-Yodgorlik_Silk_Factory%2C_Margilan_%28496248%29.jpg",
    ],
    imageCredit:
      "Photo: upyernoz, “Yodgorlik Silk Factory, Margilan (496248).jpg”, CC BY 2.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Yodgorlik_Silk_Factory,_Margilan_(496248).jpg).",
  },
  {
    slug: "urgut-bazaar",
    nameRu: "Базар Ургута",
    nameEn: "Urgut Bazaar",
    latitude: 39.402222,
    longitude: 67.243056,
    region: "Самаркандская область",
    category: "food",
    kind: "Базар",
    kindEn: "bazaar",
    imageUrls: [],
    imageCredit: "",
  },
  {
    slug: "nuratau-villages",
    nameRu: "Гостевые дома в горах Нуратау",
    nameEn: "Nuratau Mountain Guesthouses",
    latitude: 40.566667,
    longitude: 65.683333,
    region: "Навоийская область",
    category: "local_life",
    kind: "Сельский быт",
    kindEn: "rural life",
    imageUrls: [],
    imageCredit: "",
  },
  {
    slug: "aydarkul-yurts",
    nameRu: "Юртовые стоянки у озера Айдаркуль",
    nameEn: "Aydarkul Lake Yurt Camps",
    latitude: 40.916667,
    longitude: 67.166667,
    region: "Навоийская область",
    category: "local_life",
    kind: "Юртовые стоянки",
    kindEn: "yurt camps",
    imageUrls: [],
    imageCredit: "",
  },
];

const columns = [
  "slug",
  "name_ru",
  "name_en",
  "name_uz",
  "latitude",
  "longitude",
  "region",
  "category",
  "kind",
  "summary_ru",
  "summary_en",
  "story_ru",
  "story_en",
  "practical_notes_ru",
  "practical_notes_en",
  "image_urls",
  "tags",
  "seasonality",
  "access_difficulty",
  "verification_status",
  "source",
];

try {
  await pool.query("BEGIN");
  for (const record of records) {
    const narrative = record.storyRu && record.storyEn
      ? { ru: record.storyRu, en: record.storyEn }
      : story(record.nameRu, record.nameEn, record.kind, record.kindEn);
    const source = [
      archiveSource,
      record.imageCredit || "No catalog photo source has been attached yet.",
      record.storySource || "",
    ].filter(Boolean).join(" ");
    const values = [
      record.slug,
      record.nameRu,
      record.nameEn,
      null,
      record.latitude,
      record.longitude,
      record.region,
      record.category,
      record.kind,
      `Предварительная архивная точка в ${record.region}. Точное положение, доступ и текущие условия требуют отдельной проверки.`,
      `A preliminary archive lead in ${record.region}. Exact location, access, and current conditions need independent confirmation.`,
      narrative.ru,
      narrative.en,
      notesRu,
      notesEn,
      record.imageUrls,
      [record.category],
      [],
      "Не оценена — данные требуют проверки / Not assessed — verification needed",
      "preliminary",
      source,
    ];
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await pool.query(
      `INSERT INTO wayzen_places (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT (slug) DO NOTHING`,
      values,
    );
  }
  await pool.query("COMMIT");
  console.log(`Seeded ${records.length} preliminary WayZen archive places.`);
} catch (error) {
  await pool.query("ROLLBACK");
  console.error("WayZen place seed failed.", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
