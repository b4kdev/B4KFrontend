import type { ItineraryDetail } from '@/app/api/plans/[id]/route'

// SC-35 (S-DEGJDE) — lives outside app/api/plans/[id]/route.ts because Next's
// route-handler type checker rejects any named export from a route.ts file
// that isn't GET/POST/etc. or a recognized config key. /meta/route.ts imports
// this to look up the author without duplicating mock data.
export const MOCK: Record<string, ItineraryDetail> = {
  'it-demo': {
    id: 'it-demo',
    title: 'Seoul Heritage Walk',
    is_partner: false,
    is_published: true,
    share_url: null,
    like_count: 47,
    save_count: 23,
    total_duration_min: 270,
    distance_m: 8200,
    author: {
      id: 'u1',
      name_preferred: 'Seoul Explorer',
      name_en: 'Seoul Explorer',
      name_ko: null,
      avatar_url: null,
    },
    stops: [
      {
        stop_order: 1, day: null, duration_min: 90, transport_mode: 'public',
        notes: 'Start early to avoid crowds. Free entry on last Wednesday of the month.',
        poi: { place_id: 'p1', name_preferred: null, name_en: 'Gyeongbokgung Palace', name_ko: '경복궁', primary_image_url: null, display_domain: 'Palaces', coords_lat: 37.5796, coords_lng: 126.9770 },
      },
      {
        stop_order: 2, day: null, duration_min: 60, transport_mode: 'public',
        notes: 'The Secret Garden tour is highly recommended.',
        poi: { place_id: 'p2', name_preferred: null, name_en: 'Changdeokgung', name_ko: '창덕궁', primary_image_url: null, display_domain: 'Palaces', coords_lat: 37.5793, coords_lng: 126.9910 },
      },
      {
        stop_order: 3, day: null, duration_min: 45, transport_mode: 'public',
        notes: null,
        poi: { place_id: 'p5', name_preferred: null, name_en: 'Bukchon Hanok Village', name_ko: '북촌 한옥마을', primary_image_url: null, display_domain: 'Cultural', coords_lat: 37.5826, coords_lng: 126.9852 },
      },
      {
        stop_order: 4, day: null, duration_min: 30, transport_mode: 'public',
        notes: 'Great stop for a quick lunch.',
        poi: { place_id: 'p4', name_preferred: null, name_en: 'Ikseon-dong Café', name_ko: '익선동 카페', primary_image_url: null, display_domain: 'Cafes', coords_lat: 37.5748, coords_lng: 126.9891 },
      },
      {
        stop_order: 5, day: null, duration_min: 45, transport_mode: 'public',
        notes: null,
        poi: { place_id: 'p3', name_preferred: null, name_en: 'Jogyesa Temple', name_ko: '조계사', primary_image_url: null, display_domain: 'Temples', coords_lat: 37.5742, coords_lng: 126.9814 },
      },
    ],
    // Leg 4→5 intentionally absent — exercises "Calculating route…" placeholder (TMAP cache miss)
    legs: [
      { from_stop_order: 1, to_stop_order: 2, estimated_duration_s: 900, distance_m: 1600, transport_mode: 'public' },
      { from_stop_order: 2, to_stop_order: 3, estimated_duration_s: 600, distance_m: 900, transport_mode: 'walk' },
      { from_stop_order: 3, to_stop_order: 4, estimated_duration_s: 720, distance_m: 1100, transport_mode: 'public' },
    ],
    related: [
      { id: 'it-partner', title: 'Premium Seoul Experience', like_count: 124, save_count: 67, stop_count: 4, thumbnail_url: null },
      { id: 'it-r2', title: 'Han River Sunset', like_count: 22, save_count: 12, stop_count: 3, thumbnail_url: null },
      { id: 'it-r3', title: 'Dongdaemun Night Walk', like_count: 15, save_count: 8, stop_count: 5, thumbnail_url: null },
    ],
    viewer: { is_liked: false, is_saved: false },
  },

  'it-partner': {
    id: 'it-partner',
    title: 'Premium Seoul Experience',
    is_partner: true,
    is_published: true,
    share_url: null,
    like_count: 124,
    save_count: 67,
    total_duration_min: 420,
    distance_m: 12000,
    author: {
      id: 'u2',
      name_preferred: 'B4K Official',
      name_en: 'B4K Official',
      name_ko: null,
      avatar_url: null,
    },
    stops: [
      {
        stop_order: 1, day: 1, duration_min: 120, transport_mode: 'car',
        notes: null,
        poi: { place_id: 'p1', name_preferred: null, name_en: 'Gyeongbokgung Palace', name_ko: '경복궁', primary_image_url: null, display_domain: 'Palaces', coords_lat: 37.5796, coords_lng: 126.9770 },
      },
      {
        stop_order: 2, day: 1, duration_min: 90, transport_mode: 'car',
        notes: null,
        poi: { place_id: 'p6', name_preferred: null, name_en: 'Myeongdong Food Street', name_ko: '명동 먹자골목', primary_image_url: null, display_domain: 'Restaurants', coords_lat: 37.5636, coords_lng: 126.9831 },
      },
      {
        stop_order: 3, day: 2, duration_min: 120, transport_mode: 'car',
        notes: null,
        poi: { place_id: 'p8', name_preferred: null, name_en: 'DDP Dongdaemun', name_ko: '동대문 DDP', primary_image_url: null, display_domain: 'Shopping', coords_lat: 37.5664, coords_lng: 127.0095 },
      },
      {
        stop_order: 4, day: 2, duration_min: 90, transport_mode: 'car',
        notes: null,
        poi: { place_id: 'p9', name_preferred: null, name_en: 'National Museum of Korea', name_ko: '국립중앙박물관', primary_image_url: null, display_domain: 'Museums', coords_lat: 37.5236, coords_lng: 126.9803 },
      },
    ],
    legs: [
      { from_stop_order: 1, to_stop_order: 2, estimated_duration_s: 1200, distance_m: 5200, transport_mode: 'car' },
      { from_stop_order: 2, to_stop_order: 3, estimated_duration_s: 1500, distance_m: 6100, transport_mode: 'car' },
      { from_stop_order: 3, to_stop_order: 4, estimated_duration_s: 1800, distance_m: 7400, transport_mode: 'car' },
    ],
    related: [
      { id: 'it-demo', title: 'Seoul Heritage Walk', like_count: 47, save_count: 23, stop_count: 5, thumbnail_url: null },
      { id: 'it-r2', title: 'Han River Sunset', like_count: 22, save_count: 12, stop_count: 3, thumbnail_url: null },
      { id: 'it-r3', title: 'Dongdaemun Night Walk', like_count: 15, save_count: 8, stop_count: 5, thumbnail_url: null },
    ],
    viewer: { is_liked: true, is_saved: false },
  },
}
