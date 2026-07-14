import { NextRequest, NextResponse } from 'next/server'
import { mockCoordsFor } from '@/lib/mock-geo'

export interface ExplorePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  quality_score: number
  is_trending: boolean
  is_partner?: boolean
  partner_url?: string | null
  /** Chip-filter facets — hub-specific. */
  agency?: string
  district?: string
  region?: string
  /** ISO date (YYYY-MM-DD) for D-Day countdown on event/merch/festival items. */
  event_date?: string
  /** SC-36 (KD_04/KB_04) — one featured item renders as a wide card above the row. */
  is_featured?: boolean
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
}

export interface ExploreSection {
  id: string
  items: ExplorePoi[]
}

export interface ExploreHeroSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  cta_label: string
  cta_href: string
  image_url: string | null
}

export interface ExplorePackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
  is_partner: true
}

export interface ExploreData {
  category: string
  sections: ExploreSection[]
  hero?: ExploreHeroSlide[]
  packages?: ExplorePackage[]
}

const IMG = {
  kpop0001: '/mock-images/kpop0001.png',
  kpop0004: '/mock-images/kpop0004.png',
  kpop0005: '/mock-images/kpop0005.png',
  kpop0006: '/mock-images/kpop0006.png',
  kpop0007: '/mock-images/kpop0007.png',
  kpop0008: '/mock-images/kpop0008.png',
  kpop0009: '/mock-images/kpop0009.png',
  bts_concert: '/mock-images/bts_concert.png',
  gyeongbok: '/mock-images/gyeongbok.png',
  palace_spring: '/mock-images/palace_spring.png',
  cherry: '/mock-images/cherry.png',
  culture001: '/mock-images/culture001.png',
  film_street: '/mock-images/film_street.png',
  beauty_clinic: '/mock-images/beauty_clinic.png',
  skincare_clinic: '/mock-images/skincare_clinic.png',
  dance_students: '/mock-images/dance_students.png',
  kbbq: '/mock-images/kbbq.png',
  pork_soup: '/mock-images/pork_soup.png',
}

// Future-dated events so D-Day badges stay positive regardless of run date.
const soon = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Coords are added at request time (mockCoordsFor) — the literal below predates
// quick-add-to-plan and was never geocoded per-item.
type MockExplorePoi = Omit<ExplorePoi, 'coords_lat' | 'coords_lng'>
type MockExploreData = Omit<ExploreData, 'sections'> & {
  sections: { id: string; items: MockExplorePoi[] }[]
}

const MOCK: Record<string, MockExploreData> = {
  'k-pop': {
    category: 'k-pop',
    hero: [
      { id: 'kp-h1', badge: 'CONCERTS', title: 'Live in Seoul',      subtitle: 'Arena tours and comeback stages this season.', cta_label: 'See concerts', cta_href: '/search?q=k-pop', image_url: IMG.bts_concert },
      { id: 'kp-h2', badge: 'AGENCY',   title: 'Behind the Music',    subtitle: 'Tour HYBE, SM, JYP and YG landmarks.',        cta_label: 'Explore agencies', cta_href: '/search?q=k-pop', image_url: IMG.kpop0007 },
      { id: 'kp-h3', badge: 'FANDOM',   title: 'Merch & Pop-Ups',     subtitle: 'Limited drops and fan events across the city.', cta_label: 'Find merch', cta_href: '/search?q=k-pop', image_url: IMG.kpop0005 },
    ],
    sections: [
      {
        id: 'concerts',
        items: [
          { poi_id: 'kp-6',  name_ko: '잠실 올림픽 주경기장',    name_en: 'Jamsil Olympic Stadium',    primary_image_url: IMG.bts_concert,  display_region: '송파구', quality_score: 94, is_trending: true  },
          { poi_id: 'kp-7',  name_ko: 'KSPO 돔 (체조경기장)',    name_en: 'KSPO Dome',                 primary_image_url: IMG.kpop0009,     display_region: '송파구', quality_score: 92, is_trending: false },
          { poi_id: 'kp-8',  name_ko: '고척 스카이돔',           name_en: 'Gocheok Sky Dome',          primary_image_url: IMG.kpop0001,     display_region: '구로구', quality_score: 90, is_trending: false },
          { poi_id: 'kp-9',  name_ko: '인스파이어 아레나',        name_en: 'Inspire Arena Incheon',     primary_image_url: IMG.bts_concert,  display_region: '인천',   quality_score: 96, is_trending: true  },
        ],
      },
      {
        id: 'tours',
        items: [
          { poi_id: 'kp-19', name_ko: 'Real K-Pop Dance 홍대',   name_en: 'Real K-Pop Dance Hongdae',  primary_image_url: IMG.dance_students, display_region: '마포구', quality_score: 96, is_trending: true  },
          { poi_id: 'kp-20', name_ko: '1MILLION Dance Studio',   name_en: '1MILLION Dance Studio',     primary_image_url: IMG.kpop0006,     display_region: '서초구', quality_score: 98, is_trending: true  },
          { poi_id: 'kp-24', name_ko: 'K-팝 아이돌 메이크업&포토슛', name_en: 'K-Pop Idol Makeup & Photoshoot', primary_image_url: IMG.kpop0008, display_region: '강남구', quality_score: 96, is_trending: true  },
        ],
      },
      {
        id: 'agencies',
        items: [
          { poi_id: 'kp-1',  name_ko: 'HYBE 사옥',            name_en: 'HYBE Headquarters',   primary_image_url: IMG.kpop0007, display_region: '용산구', quality_score: 96, is_trending: true,  agency: 'HYBE' },
          { poi_id: 'kp-2',  name_ko: 'SM타운 코엑스 아티움',  name_en: 'SM Town Coex Artium',  primary_image_url: IMG.kpop0004, display_region: '강남구', quality_score: 92, is_trending: true,  agency: 'SM'   },
          { poi_id: 'kp-3',  name_ko: 'JYP 엔터테인먼트',      name_en: 'JYP Entertainment',    primary_image_url: IMG.kpop0005, display_region: '강동구', quality_score: 88, is_trending: false, agency: 'JYP'  },
          { poi_id: 'kp-4',  name_ko: 'YG 엔터테인먼트',       name_en: 'YG Entertainment',     primary_image_url: IMG.kpop0005, display_region: '마포구', quality_score: 86, is_trending: false, agency: 'YG'   },
          { poi_id: 'kp-2b', name_ko: 'SM 커뮤니케이션 센터',  name_en: 'SM Communication Center', primary_image_url: IMG.kpop0004, display_region: '성동구', quality_score: 85, is_trending: false, agency: 'SM' },
        ],
      },
      {
        id: 'merchandise',
        items: [
          { poi_id: 'kp-11', name_ko: '위버스 샵 성수',      name_en: 'Weverse Shop Seongsu',    primary_image_url: IMG.kpop0005, display_region: '성동구', quality_score: 94, is_trending: true,  event_date: soon(3)  },
          { poi_id: 'kp-12', name_ko: '라이즈마켓 홍대',     name_en: 'Rise Market Hongdae',     primary_image_url: IMG.kpop0005, display_region: '마포구', quality_score: 90, is_trending: true,  event_date: soon(10) },
          { poi_id: 'kp-13', name_ko: '스타필드 수원 팝업',  name_en: 'Starfield Suwon Fan Pop', primary_image_url: IMG.kpop0004, display_region: '수원',   quality_score: 86, is_trending: false },
        ],
      },
    ],
    packages: [
      { id: 'kp-pkg-1', title: 'K-Pop Insider: HYBE + Agency Day', partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.kpop0007, is_partner: true },
      { id: 'kp-pkg-2', title: 'Idol Dance Class + Photoshoot',    partner_name: 'Trazy', partner_url: 'https://www.trazy.com/',  cover_image_url: IMG.kpop0008, is_partner: true },
      { id: 'kp-pkg-3', title: 'Seoul Concert Night Tour',         partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.bts_concert, is_partner: true },
    ],
  },
  'k-drama': {
    category: 'k-drama',
    hero: [
      { id: 'kd-h1', badge: 'FILMING', title: 'Where Scenes Live',   subtitle: 'Palaces, streets and shores from your favourites.', cta_label: 'See locations', cta_href: '/search?q=k-drama', image_url: IMG.gyeongbok },
      { id: 'kd-h2', badge: 'TOURS',   title: 'Drama Trails',         subtitle: 'Follow the routes your characters walked.',         cta_label: 'Browse tours', cta_href: '/search?q=k-drama', image_url: IMG.palace_spring },
      { id: 'kd-h3', badge: 'CAFES',   title: 'OST Cafés',            subtitle: 'Sit where the soundtrack was born.',                cta_label: 'Find cafés', cta_href: '/search?q=k-drama', image_url: IMG.film_street },
    ],
    sections: [
      {
        id: 'filming',
        items: [
          { poi_id: 'kd-1',  name_ko: '경복궁 (야간관람)',    name_en: 'Gyeongbokgung Palace Night',   primary_image_url: IMG.gyeongbok,    display_region: '종로구', quality_score: 98, is_trending: true  },
          { poi_id: 'kd-4',  name_ko: '전주 한옥마을',        name_en: 'Jeonju Hanok Village',         primary_image_url: IMG.palace_spring, display_region: '전주',   quality_score: 98, is_trending: true  },
          { poi_id: 'kd-6',  name_ko: '춘천 남이섬',          name_en: 'Nami Island, Chuncheon',       primary_image_url: IMG.cherry,       display_region: '춘천',   quality_score: 94, is_trending: true  },
          { poi_id: 'kd-7',  name_ko: '수원 화성 행궁동',     name_en: 'Hwaseong Haenggung-dong',      primary_image_url: IMG.palace_spring, display_region: '수원',   quality_score: 96, is_trending: true  },
        ],
      },
      {
        id: 'tours',
        items: [
          { poi_id: 'kd-9',  name_ko: '사랑의 불시착 파주 DMZ', name_en: 'CLOY Paju DMZ Tour',           primary_image_url: IMG.palace_spring, display_region: '파주',   quality_score: 94, is_trending: true,  is_featured: true },
          { poi_id: 'kd-11', name_ko: '갯마을 차차차 촬영지',   name_en: 'Hometown Cha-Cha-Cha Village', primary_image_url: IMG.cherry,       display_region: '포항',   quality_score: 96, is_trending: true  },
          { poi_id: 'kd-26', name_ko: '몽테드 카페 (러블리 러너)', name_en: 'Mongted Café — Lovely Runner', primary_image_url: IMG.film_street,  display_region: '수원',   quality_score: 94, is_trending: true  },
        ],
      },
      {
        id: 'historical',
        items: [
          { poi_id: 'kd-13', name_ko: 'MBC 드라미아',      name_en: 'MBC Dramia',             primary_image_url: IMG.palace_spring, display_region: '용인', quality_score: 90, is_trending: false },
          { poi_id: 'kd-14', name_ko: '안동 하회마을',     name_en: 'Andong Hahoe Village',   primary_image_url: IMG.culture001,   display_region: '안동', quality_score: 98, is_trending: true  },
          { poi_id: 'kd-15', name_ko: '경주 양동마을',     name_en: 'Yangdong Folk Village',  primary_image_url: IMG.palace_spring, display_region: '경주', quality_score: 96, is_trending: true  },
        ],
      },
      {
        id: 'ostCafes',
        items: [
          { poi_id: 'kd-17', name_ko: '응답하라 1988 세트 카페', name_en: 'Reply 1988 Set Café',    primary_image_url: IMG.film_street, display_region: '도봉구', quality_score: 92, is_trending: true  },
          { poi_id: 'kd-22', name_ko: '카페 지노 (파주, 도깨비)', name_en: 'Café ZINO Paju — Goblin', primary_image_url: IMG.film_street, display_region: '파주',   quality_score: 96, is_trending: true  },
          { poi_id: 'kd-25', name_ko: 'DDP (동대문디자인플라자)', name_en: 'Dongdaemun Design Plaza', primary_image_url: IMG.gyeongbok,   display_region: '중구',   quality_score: 96, is_trending: true  },
        ],
      },
    ],
    packages: [
      { id: 'kd-pkg-1', title: 'Palace & Drama Film Set Day',   partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.gyeongbok,    is_partner: true },
      { id: 'kd-pkg-2', title: 'Nami Island + Petite France',   partner_name: 'Trazy', partner_url: 'https://www.trazy.com/',  cover_image_url: IMG.cherry,       is_partner: true },
      { id: 'kd-pkg-3', title: 'Jeonju Hanok Drama Trail',      partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.palace_spring, is_partner: true },
    ],
  },
  'k-beauty': {
    category: 'k-beauty',
    hero: [
      { id: 'kb-h1', badge: 'SKINCARE', title: 'Glass Skin Routine', subtitle: 'Flagship stores and clinics loved by locals.', cta_label: 'Shop skincare', cta_href: '/search?q=k-beauty', image_url: IMG.skincare_clinic },
      { id: 'kb-h2', badge: 'MAKEUP',   title: 'Color Your Look',     subtitle: 'Cult brands and pop-ups across Seoul.',         cta_label: 'Browse makeup', cta_href: '/search?q=k-beauty', image_url: IMG.beauty_clinic },
      { id: 'kb-h3', badge: 'SPA',      title: 'Rest & Reset',        subtitle: 'Hanbang spas and jjimjilbang escapes.',          cta_label: 'Find a spa', cta_href: '/search?q=k-beauty', image_url: IMG.skincare_clinic },
    ],
    sections: [
      {
        id: 'skincare',
        items: [
          { poi_id: 'kb-1', name_ko: '설화수 플래그십 강남',      name_en: 'Sulwhasoo Flagship Gangnam', primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 94, is_trending: true,  district: 'Gangnam'    },
          { poi_id: 'kb-3', name_ko: '이니스프리 홍대 하우스',    name_en: 'Innisfree Hongdae House',    primary_image_url: IMG.skincare_clinic, display_region: '마포구', quality_score: 94, is_trending: true,  district: 'Hongdae'    },
          { poi_id: 'kb-5', name_ko: '올리브영 명동 타운',        name_en: 'Olive Young Myeongdong Town', primary_image_url: IMG.beauty_clinic,  display_region: '중구',   quality_score: 92, is_trending: true,  district: 'Myeongdong' },
          { poi_id: 'kb-6', name_ko: 'CNP 차앤박 압구정',        name_en: 'CNP Cha & Park Apgujeong',   primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 98, is_trending: true,  district: 'Apgujeong'  },
        ],
      },
      {
        id: 'makeup',
        items: [
          { poi_id: 'kb-11', name_ko: '롬앤 명동 팝업',    name_en: 'rom&nd Myeongdong Pop-Up',  primary_image_url: IMG.beauty_clinic,   display_region: '중구',   quality_score: 92, is_trending: true,  district: 'Myeongdong', is_featured: true },
          { poi_id: 'kb-14', name_ko: '젠틀몬스터 압구정',  name_en: 'Gentle Monster Apgujeong',  primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 98, is_trending: true,  district: 'Apgujeong'  },
          { poi_id: 'kb-15', name_ko: '탬버린즈 홍대',      name_en: 'Tamburins Hongdae',         primary_image_url: IMG.skincare_clinic, display_region: '마포구', quality_score: 96, is_trending: true,  district: 'Hongdae'    },
        ],
      },
      {
        id: 'spa',
        items: [
          { poi_id: 'kb-16', name_ko: '청담 아모리스 스파',   name_en: 'Cheongdam Amoris Spa', primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 96, is_trending: true,  district: 'Gangnam'    },
          { poi_id: 'kb-17', name_ko: '명동 힐링 스파',       name_en: 'Myeongdong Healing Spa', primary_image_url: IMG.beauty_clinic, display_region: '중구',   quality_score: 90, is_trending: false, district: 'Myeongdong' },
          { poi_id: 'kb-19', name_ko: '압구정 데이 스파',     name_en: 'Apgujeong Day Spa',    primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 92, is_trending: true,  district: 'Apgujeong'  },
        ],
      },
      {
        id: 'salon',
        items: [
          { poi_id: 'kb-21', name_ko: '이철헤어커커 압구정',  name_en: 'Lee Cheol Hair Apgujeong', primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 94, is_trending: false, district: 'Apgujeong'  },
          { poi_id: 'kb-22', name_ko: '준오헤어 홍대',        name_en: 'Juno Hair Hongdae',        primary_image_url: IMG.skincare_clinic, display_region: '마포구', quality_score: 90, is_trending: false, district: 'Hongdae'    },
          { poi_id: 'kb-23', name_ko: '제니하우스 강남',      name_en: 'Jenny House Gangnam',      primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 98, is_trending: true,  district: 'Gangnam'    },
        ],
      },
    ],
    packages: [
      { id: 'kb-pkg-1', title: 'K-Beauty Flagship Crawl',      partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.skincare_clinic, is_partner: true },
      { id: 'kb-pkg-2', title: 'Hanbang Spa Half-Day',         partner_name: 'Trazy', partner_url: 'https://www.trazy.com/',  cover_image_url: IMG.beauty_clinic,   is_partner: true },
      { id: 'kb-pkg-3', title: 'Personal Color + Makeup Class', partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.beauty_clinic,   is_partner: true },
    ],
  },
  'k-culture': {
    category: 'k-culture',
    hero: [
      { id: 'kc-h1', badge: 'HERITAGE', title: 'Living Tradition', subtitle: 'Palaces, hanok villages and temples.',        cta_label: 'Explore heritage', cta_href: '/search?q=k-culture', image_url: IMG.gyeongbok },
      { id: 'kc-h2', badge: 'FOOD',     title: 'Taste of Korea',    subtitle: 'Markets and street food across the country.', cta_label: 'Find food', cta_href: '/search?q=k-culture', image_url: IMG.kbbq },
      { id: 'kc-h3', badge: 'FESTIVAL', title: 'Seasonal Festivals', subtitle: 'Lanterns, masks and mud — all year round.',  cta_label: 'See festivals', cta_href: '/search?q=k-culture', image_url: IMG.culture001 },
    ],
    sections: [
      {
        id: 'traditional',
        items: [
          { poi_id: 'kc-12', name_ko: '창덕궁',          name_en: 'Changdeokgung Palace',        primary_image_url: IMG.palace_spring, display_region: '종로구', quality_score: 98, is_trending: true,  region: 'Seoul'    },
          { poi_id: 'kc-13', name_ko: '불국사',          name_en: 'Bulguksa Temple, Gyeongju',   primary_image_url: IMG.culture001,   display_region: '경주',   quality_score: 98, is_trending: false, region: 'Gyeongju' },
          { poi_id: 'kc-15', name_ko: '안동 하회마을',   name_en: 'Andong Hahoe Village',        primary_image_url: IMG.palace_spring, display_region: '안동',   quality_score: 98, is_trending: true,  region: 'Andong'   },
          { poi_id: 'kc-15b', name_ko: '전주 경기전',    name_en: 'Jeonju Gyeonggijeon Shrine',  primary_image_url: IMG.culture001,   display_region: '전주',   quality_score: 94, is_trending: false, region: 'Jeonju'   },
        ],
      },
      {
        id: 'food',
        items: [
          { poi_id: 'kc-1', name_ko: '광장시장',            name_en: 'Gwangjang Market',           primary_image_url: IMG.kbbq,      display_region: '종로구', quality_score: 96, is_trending: true,  region: 'Seoul'  },
          { poi_id: 'kc-2', name_ko: '전주 한정식 거리',    name_en: 'Jeonju Hanjeongsik Street',  primary_image_url: IMG.pork_soup, display_region: '전주',   quality_score: 98, is_trending: true,  region: 'Jeonju' },
          { poi_id: 'kc-6', name_ko: '경주 황리단길',       name_en: 'Gyeongju Hwangnidan-gil',    primary_image_url: IMG.kbbq,      display_region: '경주',   quality_score: 96, is_trending: true,  region: 'Gyeongju' },
        ],
      },
      {
        id: 'festivals',
        items: [
          { poi_id: 'kc-10', name_ko: '서울 등불 축제',        name_en: 'Seoul Lantern Festival',   primary_image_url: IMG.culture001,   display_region: '서울', quality_score: 92, is_trending: true,  region: 'Seoul',   event_date: soon(20) },
          { poi_id: 'kc-11', name_ko: '경주 신라문화제',       name_en: 'Gyeongju Silla Festival',  primary_image_url: IMG.palace_spring, display_region: '경주', quality_score: 90, is_trending: false, region: 'Gyeongju', event_date: soon(45) },
          { poi_id: 'kc-12f', name_ko: '안동 국제탈춤페스티벌', name_en: 'Andong Mask Dance Festival', primary_image_url: IMG.culture001, display_region: '안동', quality_score: 89, is_trending: false, region: 'Andong', event_date: soon(7) },
        ],
      },
      {
        id: 'crafts',
        items: [
          { poi_id: 'kc-30', name_ko: '국립민속박물관',     name_en: 'National Folk Museum',     primary_image_url: IMG.culture001,   display_region: '종로구', quality_score: 90, is_trending: false, region: 'Seoul'  },
          { poi_id: 'kc-11b', name_ko: '경주 도예 공방 체험', name_en: 'Gyeongju Pottery Workshop', primary_image_url: IMG.culture001,  display_region: '경주',   quality_score: 94, is_trending: false, region: 'Gyeongju' },
          { poi_id: 'kc-32', name_ko: '전주 전통문화연수원', name_en: 'Jeonju Traditional Center', primary_image_url: IMG.palace_spring, display_region: '전주',   quality_score: 85, is_trending: true,  region: 'Jeonju' },
        ],
      },
    ],
    packages: [
      { id: 'kc-pkg-1', title: 'Hanbok Palace Photo Day',    partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.gyeongbok,   is_partner: true },
      { id: 'kc-pkg-2', title: 'Jeonju Hanok Food Trail',    partner_name: 'Trazy', partner_url: 'https://www.trazy.com/',  cover_image_url: IMG.pork_soup,   is_partner: true },
      { id: 'kc-pkg-3', title: 'Gyeongju Heritage Day Trip',  partner_name: 'Klook', partner_url: 'https://www.klook.com/', cover_image_url: IMG.culture001,  is_partner: true },
    ],
  },
}

/** Facet key per category — the single query param that hub's chips drive. */
const FACET_BY_CATEGORY: Record<string, keyof ExplorePoi | undefined> = {
  'k-pop': 'agency',
  'k-beauty': 'district',
  'k-culture': 'region',
  'k-drama': undefined,
}

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  const rawBase = MOCK[params.category]
  if (!rawBase) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Quick-add-to-plan needs coords — mock POIs never carried them before.
  const base: ExploreData = {
    ...rawBase,
    sections: rawBase.sections.map(s => ({
      ...s,
      items: s.items.map(it => {
        const { lat, lng } = mockCoordsFor(it.poi_id, it.display_region, it.district)
        return { ...it, coords_lat: lat, coords_lng: lng }
      }),
    })),
  }

  const facet = FACET_BY_CATEGORY[params.category]
  const filterValue = facet ? req.nextUrl.searchParams.get(facet) : null

  // Derive Trending Now from the UNFILTERED sections — the trending row (KP/KB/KC_02)
  // sits above the chip-scoped section and must not collapse under a filter.
  const seen = new Set<string>()
  const trendingItems: ExplorePoi[] = []
  for (const s of base.sections) {
    for (const it of s.items) {
      if (it.is_trending && !seen.has(it.poi_id)) {
        seen.add(it.poi_id)
        trendingItems.push(it)
      }
    }
  }
  const trendingSection: ExploreSection = { id: 'trending', items: trendingItems.slice(0, 8) }

  // Apply chip filter only to sections whose items carry the facet (the chip is
  // spec-scoped to those sections). Untagged sections pass through unchanged.
  let sections = base.sections
  if (facet && filterValue) {
    sections = base.sections.map((s) => {
      const anyTagged = s.items.some((it) => it[facet] !== undefined)
      if (!anyTagged) return s
      return { ...s, items: s.items.filter((it) => it[facet] === filterValue) }
    })
  }

  const data: ExploreData = {
    category: base.category,
    hero: base.hero,
    packages: base.packages,
    sections: [trendingSection, ...sections],
  }
  return NextResponse.json(data)
}
