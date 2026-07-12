import type { ExploreData } from '@/app/api/explore/[category]/route'

const IMG = {
  kpop0001: '/mock-images/kpop0001.png',
  kpop0003: '/mock-images/kpop0003.png',
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

const KPOP: ExploreData = {
  category: 'k-pop',
  sections: [
    {
      id: 'agencies',
      items: [
        { place_id: 'kp-1',  name_ko: 'HYBE 사옥',              name_en: 'HYBE Headquarters',        primary_image_url: IMG.kpop0007,     display_region: '용산구', quality_score: 96, is_trending: true  },
        { place_id: 'kp-2',  name_ko: 'SM타운 코엑스 아티움',    name_en: 'SM Town Coex Artium',       primary_image_url: IMG.kpop0004,     display_region: '강남구', quality_score: 92, is_trending: true  },
        { place_id: 'kp-3',  name_ko: 'JYP 엔터테인먼트',        name_en: 'JYP Entertainment',         primary_image_url: IMG.kpop0003,     display_region: '마포구', quality_score: 88, is_trending: false },
        { place_id: 'kp-4',  name_ko: 'YG 엔터테인먼트',         name_en: 'YG Entertainment',          primary_image_url: IMG.kpop0003,     display_region: '마포구', quality_score: 86, is_trending: false },
        { place_id: 'kp-5',  name_ko: '케이팝스퀘어 (강남)',      name_en: 'K-Pop Square Gangnam',      primary_image_url: IMG.kpop0005,     display_region: '강남구', quality_score: 90, is_trending: true  },
      ],
    },
    {
      id: 'concerts',
      items: [
        { place_id: 'kp-6',  name_ko: '잠실 올림픽 주경기장',    name_en: 'Jamsil Olympic Stadium',    primary_image_url: IMG.bts_concert,  display_region: '송파구', quality_score: 94, is_trending: true  },
        { place_id: 'kp-7',  name_ko: 'KSPO 돔 (체조경기장)',    name_en: 'KSPO Dome',                 primary_image_url: IMG.kpop0009,     display_region: '송파구', quality_score: 92, is_trending: false },
        { place_id: 'kp-8',  name_ko: '고척 스카이돔',           name_en: 'Gocheok Sky Dome',          primary_image_url: IMG.kpop0001,     display_region: '구로구', quality_score: 90, is_trending: false },
        { place_id: 'kp-9',  name_ko: '인스파이어 아레나',        name_en: 'Inspire Arena Incheon',     primary_image_url: IMG.bts_concert,  display_region: '인천',   quality_score: 96, is_trending: true  },
        { place_id: 'kp-10', name_ko: '부산 아시아드 주경기장',   name_en: 'Busan Asiad Main Stadium',  primary_image_url: IMG.kpop0001,     display_region: '부산',   quality_score: 88, is_trending: false },
      ],
    },
    {
      id: 'merchandise',
      items: [
        { place_id: 'kp-11', name_ko: '위버스 샵 성수',          name_en: 'Weverse Shop Seongsu',      primary_image_url: IMG.kpop0005,     display_region: '성동구', quality_score: 94, is_trending: true  },
        { place_id: 'kp-12', name_ko: '라이즈마켓 홍대',         name_en: 'Rise Market Hongdae',       primary_image_url: IMG.kpop0005,     display_region: '마포구', quality_score: 90, is_trending: true  },
        { place_id: 'kp-13', name_ko: '스타필드 수원 팝업',      name_en: 'Starfield Suwon Fan Pop',   primary_image_url: IMG.kpop0004,     display_region: '수원',   quality_score: 86, is_trending: false },
        { place_id: 'kp-14', name_ko: '타워레코드 명동',         name_en: 'Tower Records Myeongdong',  primary_image_url: IMG.kpop0005,     display_region: '중구',   quality_score: 88, is_trending: false },
      ],
    },
    {
      id: 'tours',
      items: [
        { place_id: 'kp-19', name_ko: 'Real K-Pop Dance 홍대',   name_en: 'Real K-Pop Dance Hongdae',  primary_image_url: IMG.dance_students, display_region: '마포구', quality_score: 96, is_trending: true  },
        { place_id: 'kp-20', name_ko: '1MILLION Dance Studio',   name_en: '1MILLION Dance Studio',     primary_image_url: IMG.kpop0006,     display_region: '서초구', quality_score: 98, is_trending: true  },
        { place_id: 'kp-21', name_ko: 'We-flex Dance Studio',    name_en: 'We-flex Dance — J-Hope Pick', primary_image_url: IMG.dance_students, display_region: '마포구', quality_score: 96, is_trending: true  },
        { place_id: 'kp-22', name_ko: '청담 Lulu 헤어&메이크업', name_en: 'Cheongdam Lulu Hair & Makeup', primary_image_url: IMG.beauty_clinic, display_region: '강남구', quality_score: 98, is_trending: true  },
        { place_id: 'kp-24', name_ko: 'K-팝 아이돌 메이크업&포토슛', name_en: 'K-Pop Idol Makeup & Photoshoot', primary_image_url: IMG.kpop0008, display_region: '강남구', quality_score: 96, is_trending: true  },
      ],
    },
  ],
}

const KDRAMA: ExploreData = {
  category: 'k-drama',
  sections: [
    {
      id: 'filming',
      items: [
        { place_id: 'kd-1',  name_ko: '경복궁 (야간관람)',        name_en: 'Gyeongbokgung Palace Night',     primary_image_url: IMG.gyeongbok,    display_region: '종로구', quality_score: 98, is_trending: true  },
        { place_id: 'kd-2',  name_ko: '더 현대 서울',             name_en: 'The Hyundai Seoul',              primary_image_url: IMG.kpop0009,     display_region: '영등포구', quality_score: 96, is_trending: true  },
        { place_id: 'kd-4',  name_ko: '전주 한옥마을',            name_en: 'Jeonju Hanok Village',           primary_image_url: IMG.palace_spring, display_region: '전주',   quality_score: 98, is_trending: true  },
        { place_id: 'kd-5',  name_ko: '담양 메타세쿼이아 길',     name_en: 'Damyang Metasequoia Road',       primary_image_url: IMG.cherry,       display_region: '담양',   quality_score: 96, is_trending: false },
        { place_id: 'kd-6',  name_ko: '춘천 남이섬',              name_en: 'Nami Island, Chuncheon',         primary_image_url: IMG.cherry,       display_region: '춘천',   quality_score: 94, is_trending: true  },
        { place_id: 'kd-7',  name_ko: '수원 화성 행궁동',         name_en: 'Hwaseong Haenggung-dong',        primary_image_url: IMG.palace_spring, display_region: '수원',   quality_score: 96, is_trending: true  },
      ],
    },
    {
      id: 'tours',
      items: [
        { place_id: 'kd-9',  name_ko: '사랑의 불시착 파주 DMZ',   name_en: 'CLOY Paju DMZ Tour',             primary_image_url: IMG.palace_spring, display_region: '파주',   quality_score: 94, is_trending: true  },
        { place_id: 'kd-10', name_ko: '이태원 클라쓰 거리',       name_en: 'Itaewon Class Street Walk',      primary_image_url: IMG.film_street,  display_region: '용산구', quality_score: 90, is_trending: false },
        { place_id: 'kd-11', name_ko: '갯마을 차차차 촬영지',     name_en: 'Hometown Cha-Cha-Cha Village',   primary_image_url: IMG.cherry,       display_region: '포항',   quality_score: 96, is_trending: true  },
        { place_id: 'kd-26', name_ko: '몽테드 카페 (러블리 러너)', name_en: 'Mongted Café — Lovely Runner',   primary_image_url: IMG.film_street,  display_region: '수원',   quality_score: 94, is_trending: true  },
      ],
    },
    {
      id: 'historical',
      items: [
        { place_id: 'kd-13', name_ko: 'MBC 드라미아',             name_en: 'MBC Dramia',                     primary_image_url: IMG.palace_spring, display_region: '용인',   quality_score: 90, is_trending: false },
        { place_id: 'kd-14', name_ko: '안동 하회마을',            name_en: 'Andong Hahoe Village',           primary_image_url: IMG.culture001,   display_region: '안동',   quality_score: 98, is_trending: true  },
        { place_id: 'kd-15', name_ko: '경주 양동마을',            name_en: 'Yangdong Folk Village',          primary_image_url: IMG.palace_spring, display_region: '경주',   quality_score: 96, is_trending: true  },
        { place_id: 'kd-16', name_ko: '충정중앙고등학교',         name_en: 'Choong Ang High School',         primary_image_url: IMG.film_street,  display_region: '중구',   quality_score: 90, is_trending: true  },
      ],
    },
    {
      id: 'ostCafes',
      items: [
        { place_id: 'kd-17', name_ko: '응답하라 1988 세트 카페',  name_en: 'Reply 1988 Set Café',            primary_image_url: IMG.film_street,  display_region: '도봉구', quality_score: 92, is_trending: true  },
        { place_id: 'kd-20', name_ko: '갑을식당 (이태원 클라쓰)', name_en: 'Itaewon Class Gabeul',           primary_image_url: IMG.kbbq,         display_region: '용산구', quality_score: 94, is_trending: true  },
        { place_id: 'kd-22', name_ko: '카페 지노 (파주, 도깨비)', name_en: 'Café ZINO Paju — Goblin',        primary_image_url: IMG.film_street,  display_region: '파주',   quality_score: 96, is_trending: true  },
        { place_id: 'kd-25', name_ko: 'DDP (동대문디자인플라자)', name_en: 'Dongdaemun Design Plaza (DDP)',  primary_image_url: IMG.gyeongbok,    display_region: '중구',   quality_score: 96, is_trending: true  },
      ],
    },
  ],
}

const KBEAUTY: ExploreData = {
  category: 'k-beauty',
  sections: [
    {
      id: 'skincare',
      items: [
        { place_id: 'kb-1',  name_ko: '설화수 플래그십 강남',      name_en: 'Sulwhasoo Flagship Gangnam',     primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 94, is_trending: true  },
        { place_id: 'kb-2',  name_ko: '아모레퍼시픽 본사 뮤지엄',  name_en: 'AmorePacific Museum HQ',         primary_image_url: IMG.beauty_clinic,   display_region: '용산구', quality_score: 96, is_trending: true  },
        { place_id: 'kb-3',  name_ko: '이니스프리 제주하우스',      name_en: 'Innisfree Jeju House',           primary_image_url: IMG.skincare_clinic, display_region: '제주',   quality_score: 94, is_trending: true  },
        { place_id: 'kb-5',  name_ko: '올리브영 명동 타운',        name_en: 'Olive Young Myeongdong Town',    primary_image_url: IMG.beauty_clinic,   display_region: '중구',   quality_score: 92, is_trending: true  },
        { place_id: 'kb-6',  name_ko: 'CNP 차앤박 피부과',        name_en: 'CNP Cha & Park Dermatology',    primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 98, is_trending: true  },
      ],
    },
    {
      id: 'makeup',
      items: [
        { place_id: 'kb-11', name_ko: '롬앤 성수 팝업',            name_en: 'rom&nd Seongsu Pop-Up',          primary_image_url: IMG.beauty_clinic,   display_region: '성동구', quality_score: 92, is_trending: true  },
        { place_id: 'kb-12', name_ko: '에뛰드하우스 명동',         name_en: 'Etude House Myeongdong',         primary_image_url: IMG.skincare_clinic, display_region: '중구',   quality_score: 88, is_trending: false },
        { place_id: 'kb-14', name_ko: '젠틀몬스터 청담',           name_en: 'Gentle Monster Cheongdam',       primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 98, is_trending: true  },
        { place_id: 'kb-15', name_ko: '탬버린즈 성수',             name_en: 'Tamburins Seongsu',              primary_image_url: IMG.skincare_clinic, display_region: '성동구', quality_score: 96, is_trending: true  },
      ],
    },
    {
      id: 'spa',
      items: [
        { place_id: 'kb-16', name_ko: '청담 아모리스 스파',        name_en: 'Cheongdam Amoris Spa',           primary_image_url: IMG.skincare_clinic, display_region: '강남구', quality_score: 96, is_trending: true  },
        { place_id: 'kb-17', name_ko: '신라호텔 스파',             name_en: 'Shilla Hotel Spa',               primary_image_url: IMG.beauty_clinic,   display_region: '중구',   quality_score: 98, is_trending: false },
        { place_id: 'kb-18', name_ko: '제주 해녀 체험 스파',       name_en: 'Jeju Haenyeo Experience Spa',    primary_image_url: IMG.skincare_clinic, display_region: '제주',   quality_score: 94, is_trending: true  },
        { place_id: 'kb-19', name_ko: '드래곤힐 스파 용산',        name_en: 'Dragon Hill Spa & Resort',       primary_image_url: IMG.beauty_clinic,   display_region: '용산구', quality_score: 92, is_trending: true  },
      ],
    },
    {
      id: 'salon',
      items: [
        { place_id: 'kb-21', name_ko: '이철헤어커커 강남',         name_en: 'Lee Cheol Hair Cutter Gangnam',  primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 94, is_trending: false },
        { place_id: 'kb-22', name_ko: '준오헤어 홍대',             name_en: 'Juno Hair Hongdae',              primary_image_url: IMG.skincare_clinic, display_region: '마포구', quality_score: 90, is_trending: false },
        { place_id: 'kb-23', name_ko: '제니하우스 청담',           name_en: 'Jenny House Cheongdam',          primary_image_url: IMG.beauty_clinic,   display_region: '강남구', quality_score: 98, is_trending: true  },
        { place_id: 'kb-24', name_ko: '인사동 한복 뷰티 스튜디오', name_en: 'Insadong Hanbok Beauty Studio',  primary_image_url: IMG.dance_students,  display_region: '종로구', quality_score: 96, is_trending: true  },
      ],
    },
  ],
}

const KCULTURE: ExploreData = {
  category: 'k-culture',
  sections: [
    {
      id: 'food',
      items: [
        { place_id: 'kc-1',  name_ko: '광장시장',                 name_en: 'Gwangjang Market',               primary_image_url: IMG.kbbq,         display_region: '종로구', quality_score: 96, is_trending: true  },
        { place_id: 'kc-2',  name_ko: '전주 한정식 거리',          name_en: 'Jeonju Hanjeongsik Street',      primary_image_url: IMG.pork_soup,    display_region: '전주',   quality_score: 98, is_trending: true  },
        { place_id: 'kc-3',  name_ko: '부산 자갈치 시장',          name_en: 'Jagalchi Market Busan',          primary_image_url: IMG.kbbq,         display_region: '부산',   quality_score: 96, is_trending: true  },
        { place_id: 'kc-4',  name_ko: '대구 안지랑 곱창골목',      name_en: 'Daegu Anjijang Gopchang Alley',  primary_image_url: IMG.kbbq,         display_region: '대구',   quality_score: 92, is_trending: true  },
        { place_id: 'kc-5',  name_ko: '속초 아바이 순대 거리',     name_en: 'Sokcho Abai Sundae Street',      primary_image_url: IMG.pork_soup,    display_region: '속초',   quality_score: 94, is_trending: false },
        { place_id: 'kc-6',  name_ko: '통영 중앙시장',             name_en: 'Tongyeong Central Market',       primary_image_url: IMG.kbbq,         display_region: '통영',   quality_score: 96, is_trending: true  },
      ],
    },
    {
      id: 'traditional',
      items: [
        { place_id: 'kc-m1', name_ko: '남대문 시장',              name_en: 'Namdaemun Market',               primary_image_url: IMG.kbbq,         display_region: '중구',   quality_score: 94, is_trending: false },
        { place_id: 'kc-m2', name_ko: '동대문 종합시장',           name_en: 'Dongdaemun Wholesale Market',    primary_image_url: IMG.film_street,  display_region: '중구',   quality_score: 90, is_trending: false },
        { place_id: 'kc-m3', name_ko: '수원 팔달문 시장',          name_en: 'Suwon Paldalmun Market',         primary_image_url: IMG.kbbq,         display_region: '수원',   quality_score: 92, is_trending: false },
        { place_id: 'kc-m4', name_ko: '통인시장',                  name_en: 'Tongin Market',                  primary_image_url: IMG.pork_soup,    display_region: '종로구', quality_score: 94, is_trending: false },
      ],
    },
    {
      id: 'festivals',
      items: [
        { place_id: 'kc-11', name_ko: '수원화성',                  name_en: 'Hwaseong Fortress, Suwon',       primary_image_url: IMG.gyeongbok,    display_region: '수원',   quality_score: 98, is_trending: true  },
        { place_id: 'kc-12', name_ko: '창덕궁',                    name_en: 'Changdeokgung Palace',           primary_image_url: IMG.palace_spring, display_region: '종로구', quality_score: 98, is_trending: true  },
        { place_id: 'kc-13', name_ko: '불국사',                    name_en: 'Bulguksa Temple, Gyeongju',      primary_image_url: IMG.culture001,   display_region: '경주',   quality_score: 98, is_trending: false },
        { place_id: 'kc-14', name_ko: '해인사 (팔만대장경)',        name_en: 'Haeinsa Temple (Tripitaka)',     primary_image_url: IMG.culture001,   display_region: '합천',   quality_score: 96, is_trending: false },
        { place_id: 'kc-15', name_ko: '안동 하회마을',             name_en: 'Andong Hahoe Village',           primary_image_url: IMG.palace_spring, display_region: '안동',   quality_score: 98, is_trending: true  },
      ],
    },
    {
      id: 'crafts',
      items: [
        { place_id: 'kc-7',  name_ko: '서울 김치 아카데미',        name_en: 'Seoul Kimchi Academy Myeongdong', primary_image_url: IMG.kbbq,         display_region: '중구',   quality_score: 96, is_trending: true  },
        { place_id: 'kc-9',  name_ko: '쿡코리안 망원',             name_en: 'cooKorean Mangwon',              primary_image_url: IMG.pork_soup,    display_region: '마포구', quality_score: 98, is_trending: true  },
        { place_id: 'kc-11b', name_ko: '이천 도예 공방 체험',      name_en: 'Icheon Pottery Workshop',        primary_image_url: IMG.culture001,   display_region: '이천',   quality_score: 94, is_trending: false },
        { place_id: 'kc-16', name_ko: '인사동 한복 체험',          name_en: 'Insadong Hanbok Experience',     primary_image_url: IMG.dance_students, display_region: '종로구', quality_score: 94, is_trending: true  },
        { place_id: 'kc-17', name_ko: '경복궁 야간 관람',          name_en: 'Gyeongbokgung Night Tour',       primary_image_url: IMG.gyeongbok,    display_region: '종로구', quality_score: 98, is_trending: true  },
      ],
    },
  ],
}

export const EXPLORE_MOCK: Record<string, ExploreData> = {
  'k-pop':     KPOP,
  'k-drama':   KDRAMA,
  'k-beauty':  KBEAUTY,
  'k-culture': KCULTURE,
}
