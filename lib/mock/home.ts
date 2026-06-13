import type { HomeTopPlan, HomeSeasonalPoi, HomeData } from '@/app/api/home/route'

const TOP_PLANS: HomeTopPlan[] = [
  {
    id: 'it-1',
    title: "ATEEZ's Gyeongju Guide",
    author_name: '@ateez_crew',
    likes_count: 6200,
    saves_count: 7100,
    cover_image_url: '/mock-images/kpop0001.png',
  },
  {
    id: 'it-2',
    title: "Lee Do-hyun's Gunsan — The Glory Route",
    author_name: '@glorytrail_kr',
    likes_count: 4900,
    saves_count: 5800,
    cover_image_url: '/mock-images/palace_spring.png',
  },
  {
    id: 'it-3',
    title: 'Idol for a Day — Dance, Hair & Photoshoot',
    author_name: '@kpopday_seoul',
    likes_count: 3600,
    saves_count: 4100,
    cover_image_url: '/mock-images/dance_students.png',
  },
  {
    id: 'it-4',
    title: 'Gyeongju Heritage Full Course',
    author_name: '@gyeongju_guide',
    likes_count: 4300,
    saves_count: 5100,
    cover_image_url: '/mock-images/culture001.png',
  },
  {
    id: 'it-5',
    title: 'Euljiro Retro Half-Day Walk',
    author_name: '@euljiro_lover',
    likes_count: 1900,
    saves_count: 2400,
    cover_image_url: '/mock-images/film_street.png',
  },
  {
    id: 'it-6',
    title: 'Busan: Haeundae, Gwangalli & Jagalchi',
    author_name: '@busan_local',
    likes_count: 3800,
    saves_count: 4600,
    cover_image_url: '/mock-images/cherry.png',
  },
]

const SEASONAL_POIS: HomeSeasonalPoi[] = [
  {
    place_id: 'sp-1',
    name_ko: '잠실 올림픽 주경기장',
    name_en: 'Jamsil Olympic Stadium',
    display_region: '송파구, 서울',
    category: 'K-Pop',
    primary_image_url: '/mock-images/bts_concert.png',
  },
  {
    place_id: 'sp-2',
    name_ko: '담양 메타세쿼이아 길',
    name_en: 'Damyang Metasequoia Road',
    display_region: '담양, 전남',
    category: 'K-Drama',
    primary_image_url: '/mock-images/cherry.png',
  },
  {
    place_id: 'sp-3',
    name_ko: '광장시장',
    name_en: 'Gwangjang Market',
    display_region: '종로구, 서울',
    category: 'K-Culture',
    primary_image_url: '/mock-images/kbbq.png',
  },
  {
    place_id: 'sp-4',
    name_ko: 'CNP 차앤박 피부과',
    name_en: 'CNP Cha & Park Dermatology',
    display_region: '강남구, 서울',
    category: 'K-Beauty',
    primary_image_url: '/mock-images/skincare_clinic.png',
  },
  {
    place_id: 'sp-5',
    name_ko: '창덕궁 후원',
    name_en: 'Changdeokgung Secret Garden',
    display_region: '종로구, 서울',
    category: 'K-Culture',
    primary_image_url: '/mock-images/gyeongbok.png',
  },
  {
    place_id: 'sp-6',
    name_ko: '1MILLION Dance Studio',
    name_en: '1MILLION Dance Studio',
    display_region: '서초구, 서울',
    category: 'K-Pop',
    primary_image_url: '/mock-images/kpop0006.png',
  },
]

export const HOME_MOCK: HomeData = {
  topPlans: TOP_PLANS,
  seasonalPois: SEASONAL_POIS,
}
