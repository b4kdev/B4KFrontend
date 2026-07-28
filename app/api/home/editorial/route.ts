import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

// Interim content seed — cross-checked against B4K_POI_DB_IMPORT_CLEANED_1500.xlsx.
// save_count 0 (no real engagement data), primary_image_url null - image host TBD, see DEC-55.
const SEED: HomeTrendingPoi[] = [
  { poi_id: 'KD016-014', name_ko: '경복궁', name_en: 'Gyeongbokgung Palace', display_region: 'Jongno-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: '/images/home/editorial/KD016-014_gyeongbokgung-palace.webp', coords_lat: 37.57761328825821, coords_lng: 126.9768978683218 },
  { poi_id: 'KP-008', name_ko: 'WORLD K POP CENTER', name_en: 'World K-Pop Center — HYBE Insight', display_region: 'Yongsan-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: '/images/home/editorial/KP-008_world-kpop-center-hybe-insight.webp', coords_lat: 37.55486756994441, coords_lng: 126.9687440242792 },
  { poi_id: 'KD014-005', name_ko: '익선동 한옥거리', name_en: 'Ikseon-dong Hanok Street', display_region: 'Jongno-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: '/images/home/editorial/KD014-005_ikseon-dong-hanok-street.webp', coords_lat: 37.5734371942191, coords_lng: 126.989775723896 },
  { poi_id: 'KB-NEW-065', name_ko: '올리브영 명동타운', name_en: 'Olive Young Myeongdong Town', display_region: 'Jung-gu, Seoul', display_domain: 'k-beauty', save_count: 0, primary_image_url: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp', coords_lat: 37.56398256073924, coords_lng: 126.9851873129621 },
  { poi_id: 'KD001-019', name_ko: '동대문디자인플라자', name_en: 'Dongdaemun Design Plaza (DDP)', display_region: 'Jung-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: '/images/home/editorial/KD001-019_ddp.webp', coords_lat: 37.5671843130818, coords_lng: 127.009911013917 },
  { poi_id: 'KC-SEO-091', name_ko: '대림미술관', name_en: 'Daelim Museum', display_region: 'Jongno-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: '/images/home/editorial/KC-SEO-091_daelim-museum.webp', coords_lat: 37.5775449688657, coords_lng: 126.973362441296 },
  { poi_id: 'KP-0888', name_ko: '스타필드 코엑스몰', name_en: 'Starfield COEX Mall', display_region: 'Gangnam-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: '/images/home/editorial/KP-0888_starfield-coex-mall.webp', coords_lat: 37.51292301614309, coords_lng: 127.058132428277 },
]

// category param: 'k-pop' | 'k-drama' | 'k-beauty' | 'k-culture' | undefined (all)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const items = category ? SEED.filter(p => p.display_domain === category) : SEED
  return NextResponse.json(items)
}
