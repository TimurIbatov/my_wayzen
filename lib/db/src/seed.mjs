import pg from "pg";
import { extraRecords } from "./seed-places-extra.mjs";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const archiveSource =
  "Supplied WayZen prototype archive; place details are preliminary and not independently verified.";
const defaultNotesRu =
  "В архивной записи нет проверенных часов, цен, сведений о доступности или безопасности маршрута. Перед поездкой уточните точное место и текущие условия у официальных и местных источников.";
const defaultNotesEn =
  "The archive record does not provide verified hours, prices, accessibility, or route-safety details. Confirm the exact place and current conditions with official and local sources before traveling.";
const defaultAccess =
  "Не оценена — данные требуют проверки / Not assessed — verification needed";

function templateStory(nameRu, nameEn, kindRu, kindEn) {
  return {
    ru: `${nameRu} включено в ранний архив WayZen как направление типа «${kindRu}». Название и координаты перенесены из прототипа; они сами по себе не подтверждают историю места, его нынешнее состояние или возможность посещения.\n\nДля этой карточки важнее всего сначала проверить саму точку: сопоставить координаты с актуальной картой и найти местный или официальный источник, который подтверждает, что именно имеется в виду. Не считайте описание подтверждённым путеводителем.`,
    en: `${nameEn} appears in the early WayZen archive as a ${kindEn.toLowerCase()} lead. Its name and coordinates were carried over from the prototype; they do not establish the site's history, present condition, or visitor access.\n\nThe first useful step is to verify the pin itself against a current map and find an official or local source that confirms what the record refers to. Treat this as a research lead, not a verified guide.`,
  };
}

/**
 * Places with handWritten: true must include storyRu/storyEn (2–4 paragraphs),
 * practical notes, 1–3 image URLs, tags, seasonality, and accessDifficulty.
 * verificationStatus stays preliminary unless a real editorial review happens.
 */
const records = [
  {
    handWritten: true,
    slug: "urunqach-jade-lake",
    nameRu: "Урунгачские озёра",
    nameEn: "The Urungach Lakes",
    latitude: 41.643889,
    longitude: 70.163611,
    region: "Ташкентская область",
    category: "nature",
    kind: "Горные озёра",
    kindEn: "mountain lakes",
    summaryRu:
      "Горные озёра в Ташкентской области из раннего архива WayZen. Точка ориентировочная; доступ и сезонность нужно проверять отдельно.",
    summaryEn:
      "Mountain lakes in Tashkent Region from the early WayZen archive. The pin is approximate; access and seasonality need independent checks.",
    storyRu:
      "Урунгачские озёра часто упоминают как высокогорные водоёмы к северо-востоку от Ташкента — спокойную альтернативу более людным направлениям Чимгана. В архиве WayZen запись сохранена как ориентир: координаты помогают начать поиск, но не описывают тропу, перепад высот или текущее состояние берега.\n\nПубличные описания обычно связывают озёра с горным рельефом Западного Тянь-Шаня и сезонной водой, которая заметно меняется от года к году. Эти общие сведения не заменяют местную проверку: после дождей, схода снега или закрытия дорог картина может быть иной.\n\nWayZen не подтверждает маршрут подхода, безопасность склонов, наличие указателей или правила посещения. Используйте карточку как зацепку для самостоятельной сверки с актуальными картами и местными источниками — и не планируйте день только по архивной точке.",
    storyEn:
      "The Urungach Lakes are often described as highland waters northeast of Tashkent — a quieter lead than more crowded Chimgan-area routes. WayZen keeps the record as a research pin: coordinates help you start looking, but they do not describe the trail, elevation gain, or the present shoreline.\n\nPublic descriptions usually place the lakes in the Western Tian Shan and note that water levels change with the seasons. That general picture is not a substitute for local confirmation: after rain, snowmelt, or road closures the approach may look different.\n\nWayZen does not verify approach routes, slope safety, wayfinding, or visitor rules. Treat the card as a lead for your own map and local-source checks — not as a day plan built only on an archive pin.",
    practicalNotesRu:
      "Архивная точка ориентировочная. Перед выездом сверьте координаты с актуальной картой, уточните состояние подъездных дорог и наличие местных ограничений. Часы работы, цены, сложность тропы и безопасность склонов в WayZen не подтверждены.",
    practicalNotesEn:
      "The archive pin is approximate. Before travel, match coordinates to a current map and confirm road access and any local restrictions. Opening hours, prices, trail difficulty, and slope safety are not verified in WayZen.",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b2/Lake_Urungach_06.jpg",
    ],
    imageCredit:
      "Photo: UK92, “Lake Urungach 06.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Lake_Urungach_06.jpg).",
    tags: ["nature", "lakes", "mountains", "tashkent-region"],
    seasonality: ["late spring", "summer", "early autumn"],
    accessDifficulty:
      "Горный подход — условия и подъезд требуют местной проверки / Mountain approach — access needs local confirmation",
    storySource:
      "Story notes compiled from the WayZen prototype archive plus commonly cited public descriptions of the Urungach lakes area; not an on-site verification.",
  },
  {
    handWritten: true,
    slug: "zaamin-national-park",
    nameRu: "Зааминский национальный парк",
    nameEn: "Zaamin National Park",
    latitude: 39.966667,
    longitude: 68.4,
    region: "Джизакская область",
    category: "nature",
    kind: "Национальный парк",
    kindEn: "national park",
    summaryRu:
      "Охраняемая горно-лесная территория в Джизакской области. Архивная запись помогает найти направление, но не заменяет официальные правила парка.",
    summaryEn:
      "A protected mountain-forest area in Jizzakh Region. The archive record helps locate the lead, but it does not replace official park rules.",
    storyRu:
      "Зааминский национальный парк фигурирует в открытых описаниях как охраняемый массив Туркестанского хребта с можжевеловыми лесами и высокогорными лугами. Архив WayZen хранит точку как отправную координату, а не как готовый маршрут по парку.\n\nНациональный статус обычно означает, что для посещения действуют правила охраны природы — зоны, ограничения на транспорт и сезонные особенности. Конкретные входы, тропы, билеты и часы WayZen не подтверждает: их нужно искать в официальных или местных источниках на дату поездки.\n\nКарточка полезна, если вы хотите понять регион на карте и начать самостоятельную подготовку. Не считайте архивную запись подтверждением доступности конкретной тропы или инфраструктуры внутри парка.",
    storyEn:
      "Zaamin National Park appears in public descriptions as a protected stretch of the Turkestan Range with juniper woodland and high meadows. WayZen stores a starting coordinate, not a ready-made itinerary through the park.\n\nNational-park status usually means conservation rules apply — zones, vehicle limits, and seasonal constraints. WayZen does not confirm trailheads, tickets, or opening hours; those must be checked with official or local sources for your travel dates.\n\nUse the card to place the area on a map and begin your own preparation. Do not treat the archive pin as proof that a specific trail or facility inside the park is open.",
    practicalNotesRu:
      "Уточните актуальные правила национального парка, точки входа и ограничения перед поездкой. В архиве нет проверенных часов, цен, схем троп или сведений о безопасности маршрутов.",
    practicalNotesEn:
      "Confirm current national-park rules, entry points, and restrictions before travel. The archive has no verified hours, prices, trail maps, or route-safety details.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg/1280px-Zaamin_National_Park%2C_Uzbekistan.jpg",
    ],
    imageCredit:
      "Photo: Mirzozominiy, “Zaamin National Park, Uzbekistan.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Zaamin_National_Park,_Uzbekistan.jpg).",
    tags: ["nature", "national-park", "mountains", "jizzakh"],
    seasonality: ["late spring", "summer", "early autumn"],
    accessDifficulty:
      "Охраняемая территория — вход и правила требуют официальной проверки / Protected area — entry rules need official confirmation",
    storySource:
      "Story notes drawn from the WayZen prototype archive and commonly cited public descriptions of Zaamin National Park; not an official park brief.",
  },
  {
    handWritten: true,
    slug: "ustyurt-plateau",
    nameRu: "Плато Устюрт",
    nameEn: "Ustyurt Plateau",
    latitude: 43.3,
    longitude: 55.5,
    region: "Каракалпакстан",
    category: "nature",
    kind: "Плато",
    kindEn: "plateau",
    summaryRu:
      "Обширный пустынно-степной ландшафт между Каспием и Аральским регионом. Архивная точка — лишь грубый ориентир масштаба плато.",
    summaryEn:
      "A vast desert-steppe landscape between the Caspian and Aral regions. The archive pin is only a coarse plateau-scale marker.",
    storyRu:
      "Устюрт — обширное плато, которое в географических описаниях связывают с плоскогорьями, обрывами-чинками и крайне разреженной инфраструктурой. Одна координата в WayZen не обозначает «вход» и не описывает конкретный маршрут по плато.\n\nВ открытых источниках Устюрт часто упоминают как пространство, где расстояния велики, а населённые пункты редки. Это общий контекст, а не инструкция: WayZen не проверял дороги, топливо, связь, погодные окна или разрешения на передвижение.\n\nЕсли вас интересует регион, начните с сверки масштаба на карте и поиска свежих местных сведений. Архивная карточка намеренно остаётся предварительной — без обещаний доступности или безопасности.",
    storyEn:
      "Ustyurt is a vast plateau that geographic descriptions associate with tablelands, chink escarpments, and very sparse infrastructure. A single WayZen coordinate is not an entrance and does not describe a concrete route across the plateau.\n\nPublic sources often frame Ustyurt as a landscape of long distances and few settlements. That is context, not a travel brief: WayZen has not verified roads, fuel, connectivity, weather windows, or travel permissions.\n\nIf the region interests you, start by checking scale on a current map and seeking fresh local information. The archive card stays deliberately preliminary — with no promise of access or safety.",
    practicalNotesRu:
      "Точка задаёт лишь район плато. Перед любой поездкой нужны актуальные карты, местные консультации и проверка логистики. Часы, цены, маршруты и безопасность в архиве не подтверждены.",
    practicalNotesEn:
      "The pin only marks a plateau district. Any trip needs current maps, local advice, and logistics checks. Hours, prices, routes, and safety are not verified in the archive.",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e3/Karabaur.jpg",
    ],
    imageCredit:
      "Photo: Rustam Murzakhanov, “Karabaur.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Karabaur.jpg).",
    tags: ["nature", "plateau", "desert", "karakalpakstan", "remote"],
    seasonality: ["spring", "autumn"],
    accessDifficulty:
      "Удалённый ландшафт — логистика и доступ не проверены / Remote landscape — logistics and access unverified",
    storySource:
      "Story notes based on the WayZen prototype archive and general public geography of the Ustyurt Plateau; not field-verified.",
  },
  {
    handWritten: true,
    slug: "paltau-waterfall",
    nameRu: "Водопад Пальтау",
    nameEn: "Paltau Waterfall",
    latitude: 41.583333,
    longitude: 70.083333,
    region: "Ташкентская область",
    category: "nature",
    kind: "Водопад",
    kindEn: "waterfall",
    summaryRu:
      "Водопад в горной части Ташкентской области. Архив даёт ориентир; состояние потока и подход нужно проверять на месте.",
    summaryEn:
      "A waterfall in the mountain part of Tashkent Region. The archive gives a lead; stream conditions and approach need on-the-ground checks.",
    storyRu:
      "Пальтау в публичных заметках путешественников обычно описывают как водопад в ущелье недалеко от популярных горных направлений Ташкентской области. WayZen сохраняет название и координаты как архивный ориентир, а не как описание тропы.\n\nГорные водопады зависят от сезона и погоды: после таяния снега поток может быть сильнее, в засушливые периоды — скромнее. Эти общие наблюдения не подтверждают, что конкретный подход открыт или безопасен в день вашей поездки.\n\nНе опирайтесь на архив для оценки скользких камней, переправ или указателей. Сверьте точку с актуальной картой и местными источниками, прежде чем планировать выход.",
    storyEn:
      "Public traveler notes usually describe Paltau as a waterfall in a gorge near popular mountain routes of Tashkent Region. WayZen keeps the name and coordinates as an archive lead, not as a trail description.\n\nMountain waterfalls change with season and weather: stronger after snowmelt, quieter in dry spells. Those general patterns do not confirm that a specific approach is open or safe on your travel day.\n\nDo not rely on the archive to judge wet rock, crossings, or wayfinding. Match the pin to a current map and local sources before planning a visit.",
    practicalNotesRu:
      "Подтвердите точное расположение водопада и состояние подхода. В записи нет проверенных данных о парковке, часах, ценах, сложности тропы или безопасности.",
    practicalNotesEn:
      "Confirm the waterfall’s exact location and approach conditions. The record has no verified parking, hours, prices, trail difficulty, or safety details.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Paltau_Waterfall.JPG/1280px-Paltau_Waterfall.JPG",
    ],
    imageCredit:
      "Photo: German Stimban, “Paltau Waterfall.JPG”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Paltau_Waterfall.JPG).",
    tags: ["nature", "waterfall", "mountains", "tashkent-region"],
    seasonality: ["late spring", "summer", "early autumn"],
    accessDifficulty:
      "Горный подход к водопаду — тропа не проверена / Mountain waterfall approach — trail unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public mentions of Paltau Waterfall; not an on-site assessment.",
  },
  {
    handWritten: true,
    slug: "moynaq-ship-graveyard",
    nameRu: "Кладбище кораблей в Муйнаке",
    nameEn: "Moynaq Ship Graveyard",
    latitude: 43.768333,
    longitude: 59.021389,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Индустриальное наследие",
    kindEn: "industrial heritage",
    summaryRu:
      "Корабли на бывшем дне Аральского моря у Муйнака — памятник экологической и промышленной истории региона. Доступ и экспозиции требуют местной проверки.",
    summaryEn:
      "Ships on the former Aral Sea bed near Moynaq — a marker of the region’s ecological and industrial history. Access and exhibits need local confirmation.",
    storyRu:
      "Кладбище кораблей у Муйнака — одно из самых узнаваемых свидетельств отступления Аральского моря: суда, когда-то стоявшие у причала, оказались на суше. Архив WayZen фиксирует место как точку наследия, связанную с этой историей, но не описывает музейные экспозиции или текущую организацию визита.\n\nВ открытых источниках Муйнак связывают с портовым прошлым и экологическими последствиями для региона. Эти факты помогают понять, почему место важно, но не заменяют проверку того, что именно доступно посетителю сегодня — мемориал, музей, ограждения, дороги.\n\nWayZen не указывает часы, цены билетов или правила поведения на площадке. Относитесь к карточке как к историческому ориентиру и уточняйте детали у местных и официальных источников перед поездкой.",
    storyEn:
      "The ship graveyard near Moynaq is one of the most recognizable markers of the Aral Sea’s retreat: vessels that once sat at a port now rest on dry ground. WayZen records the site as a heritage lead tied to that history, without describing current museum exhibits or visit logistics.\n\nPublic sources link Moynaq to its port past and to ecological consequences for the region. That context explains why the place matters, but it does not confirm what a visitor can access today — memorial grounds, museum spaces, fencing, or roads.\n\nWayZen does not list hours, ticket prices, or on-site rules. Treat the card as a historical lead and confirm details with local and official sources before travel.",
    practicalNotesRu:
      "Уточните актуальное состояние площадки, подъезд и работу местного музея/мемориала. Часы, цены и правила посещения в архиве не подтверждены.",
    practicalNotesEn:
      "Confirm the site’s current condition, road access, and any local museum or memorial operations. Hours, prices, and visitor rules are not verified in the archive.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Moynaq%2C_Aral_Lake%2C_Ship_Wrecks%2C_Uzbekistan.jpg/1280px-Moynaq%2C_Aral_Lake%2C_Ship_Wrecks%2C_Uzbekistan.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Moynaq_Aral-Sea_Ships.jpg/1280px-Moynaq_Aral-Sea_Ships.jpg",
    ],
    imageCredit:
      "Photos: THORSTEN, “Moynaq, Aral Lake, Ship Wrecks, Uzbekistan.jpg”, CC BY-SA 4.0; Sebastian Kluger, “Moynaq Aral-Sea Ships.jpg”, CC BY-SA 3.0; Wikimedia Commons.",
    tags: ["heritage", "aral-sea", "industrial", "karakalpakstan", "moynaq"],
    seasonality: ["spring", "autumn", "winter"],
    accessDifficulty:
      "Открытая площадка у города — организация визита не проверена / Open site near town — visit logistics unverified",
    storySource:
      "Story notes from the WayZen prototype archive and widely documented public history of Moynaq and the Aral Sea retreat; not a current site audit.",
  },
  {
    handWritten: true,
    slug: "sarmysh-say-gorge",
    nameRu: "Ущелье Сармыш-сай",
    nameEn: "Sarmysh-Say Gorge",
    latitude: 40.316667,
    longitude: 65.666667,
    region: "Навоийская область",
    category: "heritage",
    kind: "Петроглифы и ландшафт",
    kindEn: "petroglyphs and landscape",
    summaryRu:
      "Ущелье с наскальными изображениями в Навоийской области. Архив помогает найти район; охрана объектов и доступ требуют проверки.",
    summaryEn:
      "A gorge with rock art in Navoi Region. The archive helps locate the area; site protection and access need confirmation.",
    storyRu:
      "Сармыш-сай известен в открытых описаниях как ущелье с большим числом петроглифов — изображениями животных, людей и сцен, высеченными на скалах. WayZen хранит точку как культурно-ландшафтный ориентир, а не как каталог отдельных камней.\n\nПетроглифы обычно относят к объектам, которые легко повредить. Даже если район посещают, правила поведения, ограждения и режим доступа могут меняться. Архив не подтверждает, открыта ли площадка, есть ли сопровождение или как добраться до конкретных панелей.\n\nИспользуйте карточку, чтобы начать исследование региона на карте. Перед поездкой найдите актуальный местный или официальный источник о сохранности и посещении — и не опирайтесь на предварительную запись как на разрешение.",
    storyEn:
      "Sarmysh-Say is widely described as a gorge with many petroglyphs — animals, people, and scenes cut into rock. WayZen keeps a cultural-landscape pin, not a catalogue of individual panels.\n\nRock art is fragile. Even where visitors are welcomed, rules, fencing, and access arrangements can change. The archive does not confirm whether the site is open, whether guides are required, or how to reach specific panels.\n\nUse the card to begin locating the area on a map. Before travel, find a current local or official source on conservation and visiting — and do not treat this preliminary record as permission.",
    practicalNotesRu:
      "Уточните режим посещения и требования к охране петроглифов. Координаты ориентировочные; тропы, часы и цены в WayZen не подтверждены.",
    practicalNotesEn:
      "Confirm visiting arrangements and rock-art protection requirements. Coordinates are approximate; trails, hours, and prices are not verified in WayZen.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Oxes_in_Sarmysh.jpg/1280px-Oxes_in_Sarmysh.jpg",
    ],
    imageCredit:
      "Photo: Carpodacus, “Oxes in Sarmysh.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Oxes_in_Sarmysh.jpg).",
    tags: ["heritage", "petroglyphs", "gorge", "navoi"],
    seasonality: ["spring", "autumn"],
    accessDifficulty:
      "Культурный ландшафт — доступ и охрана не проверены / Cultural landscape — access and protection rules unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public descriptions of Sarmysh-Say petroglyphs; not a conservation assessment.",
  },
  {
    handWritten: true,
    slug: "mizdakhan-necropolis",
    nameRu: "Некрополь Миздахкан",
    nameEn: "Mizdakhan Necropolis",
    latitude: 42.397222,
    longitude: 59.445,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Некрополь",
    kindEn: "necropolis",
    summaryRu:
      "Древний некрополь у Ходжейли в Каракалпакстане. Архивная точка предварительная; правила посещения священного места нужно уточнять.",
    summaryEn:
      "An ancient necropolis near Khodjeyli in Karakalpakstan. The archive pin is preliminary; rules for visiting a sacred place need confirmation.",
    storyRu:
      "Миздахкан в публичных описаниях предстаёт как многослойный некрополь и архитектурный комплекс на холмах у Ходжейли — место долгой истории захоронений и святынь. WayZen сохраняет координаты как ориентир наследия, не претендуя на археологическую полноту.\n\nПосетители часто отмечают сочетание руин, мазаров и живой практики памяти. Это общий культурный контекст: он не подтверждает часы работы, плату за вход или то, какие зоны открыты в конкретный день.\n\nОтноситесь к месту с уважением и проверяйте актуальные правила у местных источников. Архивная карточка WayZen намеренно помечена как предварительная и не является разрешением на посещение.",
    storyEn:
      "Public descriptions present Mizdakhan as a layered necropolis and architectural complex on hills near Khodjeyli — a long history of burial grounds and shrines. WayZen stores coordinates as a heritage lead, not as a full archaeological account.\n\nVisitors often note a mix of ruins, mazars, and living remembrance. That cultural context does not confirm opening hours, entry fees, or which zones are open on a given day.\n\nApproach the place respectfully and confirm current rules with local sources. WayZen’s archive card remains preliminary and is not a visiting permit.",
    practicalNotesRu:
      "Уточните локальные правила посещения некрополя и подъезд от Ходжейли. Часы, цены и доступность отдельных зон в архиве не подтверждены.",
    practicalNotesEn:
      "Confirm local visiting rules for the necropolis and access from Khodjeyli. Hours, prices, and zone access are not verified in the archive.",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Ancient_Complex_Mizdahkan%2C_Karakalpakstan.jpg",
    ],
    imageCredit:
      "Photo: damda.uz, “Ancient Complex Mizdahkan, Karakalpakstan.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Ancient_Complex_Mizdahkan,_Karakalpakstan.jpg).",
    tags: ["heritage", "necropolis", "karakalpakstan", "khodjeyli"],
    seasonality: ["spring", "autumn", "winter"],
    accessDifficulty:
      "Священный / культурный комплекс — правила посещения не проверены / Sacred cultural complex — visiting rules unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public descriptions of Mizdakhan; not an on-site review.",
  },
  {
    handWritten: true,
    slug: "chilpik-kala",
    nameRu: "Кала Чилпык",
    nameEn: "Chilpik Kala",
    latitude: 42.166667,
    longitude: 60.366667,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Археологический памятник",
    kindEn: "archaeological site",
    summaryRu:
      "Круглое городище-зиккурат на холме в Каракалпакстане. Архив даёт ориентир; археологический контекст и доступ требуют сверки.",
    summaryEn:
      "A round hilltop fortress site in Karakalpakstan. The archive provides a lead; archaeological context and access need confirmation.",
    storyRu:
      "Чилпык (Чилпик) в открытых описаниях часто представляют как круглое укрепление на изолированном холме — силуэт, который хорошо читается с дороги в сторону Нукуса и окрестностей. WayZen хранит точку как археологический ориентир из раннего архива.\n\nВ популярных и справочных текстах Чилпык связывают с древним Хорезмом и обрядовыми или оборонительными интерпретациями. Эти интерпретации полезны как фон, но не являются полевой верификацией WayZen: состояние склонов, тропы подъёма и режим охраны могут отличаться от ожиданий.\n\nНе планируйте визит только по координатам архива. Сверьте место с актуальной картой и местными сведениями о доступе — и помните, что статус записи остаётся предварительным.",
    storyEn:
      "Public descriptions often present Chilpik as a round fortification on an isolated hill — a silhouette readable from roads toward Nukus and nearby areas. WayZen keeps the pin as an archaeological lead from the early archive.\n\nPopular and reference texts link Chilpik to ancient Khorezm and to ritual or defensive interpretations. That background is useful context, not a WayZen field check: slope conditions, ascent paths, and protection rules may differ from expectations.\n\nDo not plan a visit from archive coordinates alone. Match the place to a current map and local access information — and remember the record remains preliminary.",
    practicalNotesRu:
      "Подтвердите подъезд к холму и возможность подъёма. В архиве нет проверенных данных о тропах, ограждениях, часах или безопасности склона.",
    practicalNotesEn:
      "Confirm road access to the hill and whether ascent is currently allowed. The archive has no verified trail, fencing, hours, or slope-safety details.",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ce/Chilpiq_qal%27a1.jpg",
    ],
    imageCredit:
      "Photo: Umid Khakimov, “Chilpiq qal'a1.jpg”, CC BY-SA 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Chilpiq_qal%27a1.jpg).",
    tags: ["heritage", "archaeology", "khorezm", "karakalpakstan"],
    seasonality: ["spring", "autumn", "winter"],
    accessDifficulty:
      "Холм с руинами — подъём и охрана не проверены / Hilltop ruins — ascent and protection rules unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public descriptions of Chilpik Kala; not an archaeological survey.",
  },
  {
    handWritten: true,
    slug: "toprak-kala",
    nameRu: "Топрак-кала",
    nameEn: "Toprak-Kala",
    latitude: 41.933333,
    longitude: 60.816667,
    region: "Каракалпакстан",
    category: "heritage",
    kind: "Археологический памятник",
    kindEn: "archaeological site",
    summaryRu:
      "Древний городской комплекс Хорезма в Каракалпакстане. Архивная история опирается на публичные археологические описания; доступ не подтверждён.",
    summaryEn:
      "An ancient Khorezm urban complex in Karakalpakstan. The archive story draws on public archaeological descriptions; access is not verified.",
    storyRu:
      "Топрак-кала начинается с прямоугольного плана, но археологическое описание раскрывает целый город: поселение, высокий дворец и северный комплекс. В заявке Узбекистана для Предварительного списка Всемирного наследия ЮНЕСКО комплекс датирован I–VI веками нашей эры. Согласно этой заявке, главная улица шла от южных ворот к цитадели в северо-западной части, а боковые улицы делили жилую застройку на кварталы. Даже без реконструкции перед глазами читается городская логика — движение от входа к центру власти.\n\nВо дворце археологи обнаружили помещения с остатками архива; стены залов были украшены росписями и рельефами. Эти детали собраны из археологических описаний, а не из легенды. Источник — заявка Узбекистана, опубликованная в Предварительном списке ЮНЕСКО; такой статус не означает включения в Список всемирного наследия.\n\nТочка WayZen и сведения о нынешнем состоянии объекта и доступе остаются предварительными. Не считайте архивную карточку подтверждённым путеводителем или разрешением на посещение.",
    storyEn:
      "Toprak-Kala begins as a rectangle on a map, but its archaeological description reveals a whole urban complex: a settlement, a high palace, and a northern complex. Uzbekistan's submission to UNESCO's World Heritage Tentative List dates the complex to the 1st–6th centuries CE. In that submission, a main street runs from the southern gate toward a citadel in the northwest, while side streets divide the residential area into blocks. Even without a reconstruction, the plan suggests a city organized around movement from its entrance toward a political center.\n\nArchaeologists found rooms containing remains of a palace archive, and the halls were decorated with paintings and reliefs. These details come from archaeological descriptions, not a local legend. The source is Uzbekistan's submission published on UNESCO's Tentative List; tentative status does not mean inscription on the World Heritage List.\n\nWayZen's pin and information about present condition or access remain preliminary. Do not treat the archive card as a verified guidebook or visiting permit.",
    practicalNotesRu:
      "Сверьте координаты с актуальной картой и уточните режим доступа к археологическому объекту. Часы, цены, тропы и безопасность на площадке в WayZen не подтверждены.",
    practicalNotesEn:
      "Match coordinates to a current map and confirm access arrangements for the archaeological site. Hours, prices, paths, and on-site safety are not verified in WayZen.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Toprak_Kala_%28Khorezm%2C_Uzbekistan%29_banner.jpg/1280px-Toprak_Kala_%28Khorezm%2C_Uzbekistan%29_banner.jpg",
    ],
    imageCredit:
      "Photo: dalbera (derivative banner), “Toprak Kala (Khorezm, Uzbekistan) banner.jpg”, CC BY 2.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Toprak_Kala_(Khorezm,_Uzbekistan)_banner.jpg).",
    tags: ["heritage", "archaeology", "khorezm", "unesco-tentative", "karakalpakstan"],
    seasonality: ["spring", "autumn", "winter"],
    accessDifficulty:
      "Археологический объект — доступ и охрана не проверены / Archaeological site — access and protection rules unverified",
    storySource:
      "Story sources: UNESCO World Heritage Centre, “Ancient towns and fortresses of the Aral Sea region”, Tentative List submission (2025; not an inscribed property), https://whc.unesco.org/en/tentativelists/6903; Encyclopaedia Iranica, “Chorasmia I. Archaeology and Pre-Islamic History”, https://www.iranicaonline.org/articles/chorasmia-i.",
  },
  {
    handWritten: true,
    slug: "rishtan-ceramics",
    nameRu: "Центр керамики в Риштане",
    nameEn: "Rishtan Ceramic Center",
    latitude: 40.356944,
    longitude: 71.284722,
    region: "Ферганская область",
    category: "crafts",
    kind: "Керамика",
    kindEn: "ceramics",
    summaryRu:
      "Риштан известен керамической традицией Ферганской долины. Архив указывает город как ориентир ремесла; мастерские и часы нужно уточнять отдельно.",
    summaryEn:
      "Rishtan is known for the Fergana Valley ceramics tradition. The archive marks the town as a craft lead; workshops and hours need separate checks.",
    storyRu:
      "Риштан в открытых источниках связывают с долгой традицией глазурованной керамики Ферганской долины — сине-бирюзовыми узорами и семейными мастерскими. WayZen сохраняет точку как ремесленный ориентир, а не как каталог конкретных студий.\n\nГородская запись не означает, что конкретная мастерская открыта для посетителей, проводит демонстрации или принимает заказы. Эти детали меняются и должны проверяться напрямую у мастеров или местных гидов.\n\nАрхив намеренно не указывает цены, часы и «лучший» адрес. Используйте карточку, чтобы начать исследование ремесленного центра, и подтверждайте визиты самостоятельно.",
    storyEn:
      "Public sources link Rishtan to a long glazed-ceramics tradition of the Fergana Valley — blue-turquoise patterns and family workshops. WayZen keeps a craft lead, not a directory of specific studios.\n\nA town-level pin does not mean a particular workshop is open to visitors, runs demonstrations, or takes orders. Those details change and must be checked directly with makers or local guides.\n\nThe archive deliberately lists no prices, hours, or “best” address. Use the card to begin researching the craft center, and confirm visits yourself.",
    practicalNotesRu:
      "Найдите актуальные контакты мастерских перед визитом. Часы работы, цены изделий и возможность наблюдения за процессом в WayZen не подтверждены.",
    practicalNotesEn:
      "Find current workshop contacts before visiting. Opening hours, product prices, and whether process viewing is allowed are not verified in WayZen.",
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lagan2024.jpg",
    ],
    imageCredit:
      "Photo: UzbekistanWikiEditor, “Lagan2024.jpg”, CC BY 4.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Lagan2024.jpg).",
    tags: ["crafts", "ceramics", "fergana", "rishtan"],
    seasonality: ["year-round"],
    accessDifficulty:
      "Городской ремесленный центр — конкретные мастерские не проверены / Town craft center — individual workshops unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public descriptions of Rishtan ceramics; not a workshop directory.",
  },
  {
    handWritten: true,
    slug: "margilan-silk",
    nameRu: "Шёлковая фабрика «Ёдгорлик»",
    nameEn: "Yodgorlik Silk Factory",
    latitude: 40.466667,
    longitude: 71.716667,
    region: "Ферганская область",
    category: "crafts",
    kind: "Шёлковое ремесло",
    kindEn: "silk craft",
    summaryRu:
      "Маргилан ассоциируется с шёлковым производством; «Ёдгорлик» — известный ориентир. Режим экскурсий и доступ нужно подтверждать заранее.",
    summaryEn:
      "Margilan is associated with silk production; Yodgorlik is a well-known lead. Tour schedules and access need advance confirmation.",
    storyRu:
      "Маргилан в публичных описаниях Ферганской долины часто называют центром шёлкового ремесла, а фабрику «Ёдгорлик» — местом, где посетителям иногда показывают этапы работы с шёлком. WayZen хранит название как архивный ориентир ремесла, не как подтверждённое расписание экскурсий.\n\nДаже известные производственные площадки меняют часы, правила фотосъёмки и формат визитов. Архив не проверял, открыта ли фабрика для гостей в конкретный день и какие зоны доступны.\n\nИспользуйте карточку, чтобы начать подготовку в Маргилане, и уточняйте визит напрямую. Цены, часы и «обязательные» остановки тура в WayZen не указаны намеренно.",
    storyEn:
      "Public descriptions of the Fergana Valley often call Margilan a silk-craft center and mention the Yodgorlik factory as a place where visitors sometimes see stages of silk work. WayZen keeps the name as an archive craft lead, not as a confirmed tour timetable.\n\nEven well-known production sites change hours, photography rules, and visit formats. The archive has not verified whether the factory welcomes guests on a given day or which areas are open.\n\nUse the card to begin preparing a Margilan visit, and confirm directly. Prices, hours, and “must-see” tour stops are intentionally not listed in WayZen.",
    practicalNotesRu:
      "Перед визитом подтвердите возможность экскурсии или приёма посетителей. Часы, цены и доступные зоны производства в архиве не подтверждены.",
    practicalNotesEn:
      "Confirm whether visitor tours or access are available before going. Hours, prices, and open production areas are not verified in the archive.",
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Yodgorlik_Silk_Factory%2C_Margilan_%28496248%29.jpg/1280px-Yodgorlik_Silk_Factory%2C_Margilan_%28496248%29.jpg",
    ],
    imageCredit:
      "Photo: upyernoz, “Yodgorlik Silk Factory, Margilan (496248).jpg”, CC BY 2.0, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Yodgorlik_Silk_Factory,_Margilan_(496248).jpg).",
    tags: ["crafts", "silk", "fergana", "margilan"],
    seasonality: ["year-round"],
    accessDifficulty:
      "Производственная площадка — режим посещений не проверен / Production site — visitor access unverified",
    storySource:
      "Story notes from the WayZen prototype archive and commonly cited public mentions of Yodgorlik Silk Factory; not a current tour schedule.",
  },

  // Former template places + ~34 new leads live in seed-places-extra.mjs (all hand-written, preliminary).
  ...extraRecords,
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

const updateSet = columns
  .filter((column) => column !== "slug")
  .map((column) => `${column} = EXCLUDED.${column}`)
  .concat(["updated_at = NOW()"])
  .join(", ");

function buildRow(record) {
  const handWritten = Boolean(record.handWritten);
  if (handWritten) {
    for (const key of [
      "storyRu",
      "storyEn",
      "practicalNotesRu",
      "practicalNotesEn",
      "imageUrls",
      "tags",
      "seasonality",
      "accessDifficulty",
    ]) {
      if (
        record[key] == null ||
        (Array.isArray(record[key]) && record[key].length === 0)
      ) {
        throw new Error(`Hand-written place "${record.slug}" is missing ${key}.`);
      }
    }
    if (record.imageUrls.length > 3) {
      throw new Error(`Hand-written place "${record.slug}" has more than 3 images.`);
    }
    const paragraphsRu = record.storyRu.split(/\n\n+/).filter(Boolean);
    const paragraphsEn = record.storyEn.split(/\n\n+/).filter(Boolean);
    if (paragraphsRu.length < 2 || paragraphsRu.length > 4) {
      throw new Error(`Hand-written place "${record.slug}" storyRu must be 2–4 paragraphs.`);
    }
    if (paragraphsEn.length < 2 || paragraphsEn.length > 4) {
      throw new Error(`Hand-written place "${record.slug}" storyEn must be 2–4 paragraphs.`);
    }
  }

  const narrative =
    record.storyRu && record.storyEn
      ? { ru: record.storyRu, en: record.storyEn }
      : templateStory(record.nameRu, record.nameEn, record.kind, record.kindEn);

  const source = [
    archiveSource,
    record.imageCredit || "No catalog photo source has been attached yet.",
    record.storySource || "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    record.slug,
    record.nameRu,
    record.nameEn,
    record.nameUz ?? null,
    record.latitude,
    record.longitude,
    record.region,
    record.category,
    record.kind,
    record.summaryRu ??
      `Предварительная архивная точка в ${record.region}. Точное положение, доступ и текущие условия требуют отдельной проверки.`,
    record.summaryEn ??
      `A preliminary archive lead in ${record.region}. Exact location, access, and current conditions need independent confirmation.`,
    narrative.ru,
    narrative.en,
    record.practicalNotesRu ?? defaultNotesRu,
    record.practicalNotesEn ?? defaultNotesEn,
    record.imageUrls ?? [],
    record.tags ?? [record.category],
    record.seasonality ?? [],
    record.accessDifficulty ?? defaultAccess,
    "preliminary",
    source,
  ];
}

try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed WayZen places.");
  }

  const handWrittenCount = records.filter((record) => record.handWritten).length;
  if (records.length < 50) {
    throw new Error(`Expected at least 50 archive places, found ${records.length}.`);
  }
  if (handWrittenCount < 40) {
    throw new Error(`Expected at least 40 hand-written places, found ${handWrittenCount}.`);
  }
  const slugs = records.map((record) => record.slug);
  const dup = slugs.find((slug, index) => slugs.indexOf(slug) !== index);
  if (dup) throw new Error(`Duplicate seed slug: ${dup}`);

  await pool.query("BEGIN");
  for (const record of records) {
    const values = buildRow(record);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await pool.query(
      `INSERT INTO wayzen_places (${columns.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT (slug) DO UPDATE SET ${updateSet}`,
      values,
    );
  }
  await pool.query("COMMIT");
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE verification_status = 'preliminary')::int AS preliminary FROM wayzen_places",
  );
  console.log(
    `Seeded ${records.length} WayZen archive places (${handWrittenCount} hand-written stories). DB now has ${rows[0].n} rows (${rows[0].preliminary} preliminary).`,
  );
} catch (error) {
  await pool.query("ROLLBACK");
  console.error("WayZen place seed failed.", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
