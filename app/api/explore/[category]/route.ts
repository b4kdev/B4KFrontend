import { NextRequest, NextResponse } from 'next/server'

export interface ExplorePoi {
  place_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  quality_score: number
  is_trending: boolean
  is_partner?: boolean
  partner_url?: string | null
}

export interface ExploreSection {
  id: string
  items: ExplorePoi[]
}

export interface ExploreData {
  category: string
  sections: ExploreSection[]
}

const MOCK: Record<string, ExploreData> = {
  'k-pop': {
    category: 'k-pop',
    sections: [
      {
        id: 'concerts',
        items: [
          { place_id: 'kp-001', name_ko: 'KSPO돔', name_en: 'KSPO Dome', primary_image_url: null, display_region: '서울', quality_score: 92, is_trending: true },
          { place_id: 'kp-002', name_ko: '올림픽공원 체조경기장', name_en: 'Olympic Gymnastics Arena', primary_image_url: null, display_region: '서울', quality_score: 89, is_trending: false },
          { place_id: 'kp-003', name_ko: '잠실 종합운동장', name_en: 'Jamsil Stadium', primary_image_url: null, display_region: '서울', quality_score: 87, is_trending: false },
        ],
      },
      {
        id: 'tours',
        items: [
          { place_id: 'kp-010', name_ko: 'SM타운 코엑스 아티움', name_en: 'SM Town COEX Artium', primary_image_url: null, display_region: '서울', quality_score: 88, is_trending: true },
          { place_id: 'kp-011', name_ko: 'HYBE 인사이트', name_en: 'HYBE Insight', primary_image_url: null, display_region: '서울', quality_score: 91, is_trending: true },
          { place_id: 'kp-012', name_ko: 'JYP 엔터테인먼트', name_en: 'JYP Entertainment', primary_image_url: null, display_region: '서울', quality_score: 79, is_trending: false },
        ],
      },
      {
        id: 'agencies',
        items: [
          { place_id: 'kp-020', name_ko: 'SM 엔터테인먼트', name_en: 'SM Entertainment', primary_image_url: null, display_region: '서울', quality_score: 85, is_trending: false },
          { place_id: 'kp-021', name_ko: 'HYBE 본사', name_en: 'HYBE Corporation', primary_image_url: null, display_region: '서울', quality_score: 88, is_trending: true },
          { place_id: 'kp-022', name_ko: 'YG 엔터테인먼트', name_en: 'YG Entertainment', primary_image_url: null, display_region: '서울', quality_score: 83, is_trending: false },
        ],
      },
      {
        id: 'merchandise',
        items: [
          { place_id: 'kp-030', name_ko: 'K-Star Road', name_en: 'K-Star Road', primary_image_url: null, display_region: '서울', quality_score: 84, is_trending: true },
          { place_id: 'kp-031', name_ko: '뮤직케이 강남', name_en: 'Music Korea Gangnam', primary_image_url: null, display_region: '서울', quality_score: 80, is_trending: false },
        ],
      },
    ],
  },
  'k-drama': {
    category: 'k-drama',
    sections: [
      {
        id: 'filming',
        items: [
          { place_id: 'kd-001', name_ko: '남이섬', name_en: 'Nami Island', primary_image_url: null, display_region: '강원', quality_score: 96, is_trending: true },
          { place_id: 'kd-002', name_ko: '북촌한옥마을', name_en: 'Bukchon Hanok Village', primary_image_url: null, display_region: '서울', quality_score: 93, is_trending: true },
          { place_id: 'kd-003', name_ko: '경복궁', name_en: 'Gyeongbokgung Palace', primary_image_url: null, display_region: '서울', quality_score: 97, is_trending: false },
        ],
      },
      {
        id: 'tours',
        items: [
          { place_id: 'kd-010', name_ko: '사랑의 불시착 투어', name_en: 'CLOY Drama Tour', primary_image_url: null, display_region: '강원', quality_score: 88, is_trending: true },
          { place_id: 'kd-011', name_ko: '킹덤 촬영지 투어', name_en: 'Kingdom Filming Tour', primary_image_url: null, display_region: '경기', quality_score: 85, is_trending: false },
        ],
      },
      {
        id: 'historical',
        items: [
          { place_id: 'kd-020', name_ko: '창덕궁', name_en: 'Changdeokgung Palace', primary_image_url: null, display_region: '서울', quality_score: 95, is_trending: false },
          { place_id: 'kd-021', name_ko: '수원 화성', name_en: 'Hwaseong Fortress', primary_image_url: null, display_region: '수원', quality_score: 92, is_trending: false },
          { place_id: 'kd-022', name_ko: '경주 불국사', name_en: 'Bulguksa Temple', primary_image_url: null, display_region: '경주', quality_score: 96, is_trending: false },
        ],
      },
      {
        id: 'ostCafes',
        items: [
          { place_id: 'kd-030', name_ko: '도깨비 카페 인사동', name_en: 'Goblin Café Insadong', primary_image_url: null, display_region: '서울', quality_score: 81, is_trending: true },
          { place_id: 'kd-031', name_ko: '이태원 클라스 거리', name_en: 'Itaewon Class Street', primary_image_url: null, display_region: '서울', quality_score: 79, is_trending: false },
        ],
      },
    ],
  },
  'k-beauty': {
    category: 'k-beauty',
    sections: [
      {
        id: 'skincare',
        items: [
          { place_id: 'kb-001', name_ko: '명동 올리브영', name_en: 'Myeongdong Olive Young', primary_image_url: null, display_region: '서울', quality_score: 90, is_trending: true },
          { place_id: 'kb-002', name_ko: 'COSRX 강남', name_en: 'COSRX Gangnam', primary_image_url: null, display_region: '서울', quality_score: 88, is_trending: true },
          { place_id: 'kb-003', name_ko: '이니스프리 제주 하우스', name_en: 'Innisfree Jeju House', primary_image_url: null, display_region: '제주', quality_score: 87, is_trending: false },
        ],
      },
      {
        id: 'makeup',
        items: [
          { place_id: 'kb-010', name_ko: '3CE 스타일난다', name_en: '3CE Style Nanda', primary_image_url: null, display_region: '서울', quality_score: 86, is_trending: true },
          { place_id: 'kb-011', name_ko: '롬앤 명동', name_en: 'rom&nd Myeongdong', primary_image_url: null, display_region: '서울', quality_score: 84, is_trending: false },
          { place_id: 'kb-012', name_ko: '클리오 강남', name_en: 'CLIO Gangnam', primary_image_url: null, display_region: '서울', quality_score: 82, is_trending: false },
        ],
      },
      {
        id: 'spa',
        items: [
          { place_id: 'kb-020', name_ko: '강남 청담 에스테틱', name_en: 'Cheongdam Skin Clinic', primary_image_url: null, display_region: '서울', quality_score: 91, is_trending: true },
          { place_id: 'kb-021', name_ko: '제주 한방 스파', name_en: 'Jeju Hanbang Spa', primary_image_url: null, display_region: '제주', quality_score: 89, is_trending: false },
        ],
      },
      {
        id: 'salon',
        items: [
          { place_id: 'kb-030', name_ko: '압구정 로데오 살롱', name_en: 'Apgujeong Rodeo Salon', primary_image_url: null, display_region: '서울', quality_score: 83, is_trending: false },
          { place_id: 'kb-031', name_ko: '홍대 헤어 스트리트', name_en: 'Hongdae Hair Street', primary_image_url: null, display_region: '서울', quality_score: 80, is_trending: true },
        ],
      },
    ],
  },
  'k-culture': {
    category: 'k-culture',
    sections: [
      {
        id: 'cuisine',
        items: [
          { place_id: 'kc-001', name_ko: '광장시장', name_en: 'Gwangjang Market', primary_image_url: null, display_region: '서울', quality_score: 96, is_trending: true },
          { place_id: 'kc-002', name_ko: '전주 한옥마을 음식거리', name_en: 'Jeonju Hanok Food Street', primary_image_url: null, display_region: '전주', quality_score: 94, is_trending: true },
          { place_id: 'kc-003', name_ko: '통인시장', name_en: 'Tongin Market', primary_image_url: null, display_region: '서울', quality_score: 88, is_trending: false },
        ],
      },
      {
        id: 'markets',
        items: [
          { place_id: 'kc-010', name_ko: '남대문시장', name_en: 'Namdaemun Market', primary_image_url: null, display_region: '서울', quality_score: 91, is_trending: false },
          { place_id: 'kc-011', name_ko: '동대문 디자인 플라자', name_en: 'Dongdaemun Design Plaza', primary_image_url: null, display_region: '서울', quality_score: 89, is_trending: true },
          { place_id: 'kc-012', name_ko: '부산 국제시장', name_en: 'Busan Gukje Market', primary_image_url: null, display_region: '부산', quality_score: 87, is_trending: false },
        ],
      },
      {
        id: 'historic',
        items: [
          { place_id: 'kc-020', name_ko: '해인사', name_en: 'Haeinsa Temple', primary_image_url: null, display_region: '합천', quality_score: 97, is_trending: false },
          { place_id: 'kc-021', name_ko: '안동 하회마을', name_en: 'Hahoe Folk Village', primary_image_url: null, display_region: '안동', quality_score: 95, is_trending: false },
          { place_id: 'kc-022', name_ko: '경주 불국사', name_en: 'Bulguksa Temple', primary_image_url: null, display_region: '경주', quality_score: 96, is_trending: false },
        ],
      },
      {
        id: 'experiences',
        items: [
          { place_id: 'kc-030', name_ko: '국립민속박물관', name_en: 'National Folk Museum', primary_image_url: null, display_region: '서울', quality_score: 90, is_trending: false },
          { place_id: 'kc-031', name_ko: '한국민속촌', name_en: 'Korean Folk Village', primary_image_url: null, display_region: '용인', quality_score: 88, is_trending: true },
          { place_id: 'kc-032', name_ko: '전주 전통문화연수원', name_en: 'Jeonju Traditional Center', primary_image_url: null, display_region: '전주', quality_score: 85, is_trending: false },
        ],
      },
    ],
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const data = MOCK[params.category]
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
