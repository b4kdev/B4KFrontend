'use client'

import { useEffect, useState } from 'react'
import type { MapBounds } from '@/hooks/useMapPois'

/**
 * The area name over the map's place list ("Jongno-gu, Seoul"): the district and city at the map
 * center, from the Naver reverse geocoder (the maps script's geocoder submodule). Zoomed out past a
 * city the line names the city only, and past a province nothing. Korean pages keep the Korean
 * names; other languages get the Revised Romanization of the district and the English city name.
 * Null while unknown, outside Korea or when the geocoder is not there; the list then shows no name.
 */
export type AreaName = { city: string; district: string | null }

// First-level divisions as the geocoder names them, with their short Korean and English names.
const CITY: Record<string, [string, string]> = {
  서울특별시: ['서울', 'Seoul'],
  부산광역시: ['부산', 'Busan'],
  대구광역시: ['대구', 'Daegu'],
  인천광역시: ['인천', 'Incheon'],
  광주광역시: ['광주', 'Gwangju'],
  대전광역시: ['대전', 'Daejeon'],
  울산광역시: ['울산', 'Ulsan'],
  세종특별자치시: ['세종', 'Sejong'],
  경기도: ['경기', 'Gyeonggi'],
  강원특별자치도: ['강원', 'Gangwon'],
  강원도: ['강원', 'Gangwon'],
  충청북도: ['충북', 'Chungbuk'],
  충청남도: ['충남', 'Chungnam'],
  전북특별자치도: ['전북', 'Jeonbuk'],
  전라북도: ['전북', 'Jeonbuk'],
  전라남도: ['전남', 'Jeonnam'],
  경상북도: ['경북', 'Gyeongbuk'],
  경상남도: ['경남', 'Gyeongnam'],
  제주특별자치도: ['제주', 'Jeju'],
}

const INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const VOWEL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
// Final consonants by their sound before a pause: k, n, t, l, m, p, ng.
const FINAL = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']
// What a final carries onto a following vowel: '-' none (ㅇ stays), '' dropped (ㅎ).
const CARRY = ['-', 'g', 'kk', 'g', 'n', 'n', 'n', 'd', 'r', 'g', 'm', 'b', 's', 't', 'p', 'h', 'm', 'b', 's', 's', 'ss', '-', 'j', 'ch', 'k', 't', 'p', '']

/** Revised Romanization of a Korean place name, with the sound changes official names use. */
export function romanize(name: string): string {
  const parts = name.match(/^(.+?)(구|시|군)$/)
  const [stem, suffix] = parts ? [parts[1], parts[2]] : [name, '']
  const syl = Array.from(stem, (c) => c.charCodeAt(0) - 0xac00)
  if (syl.some((n) => n < 0 || n > 11171)) return name
  const ini = syl.map((n) => INITIAL[Math.floor(n / 588)])
  const vow = syl.map((n) => VOWEL[Math.floor((n % 588) / 28)])
  const fin = syl.map((n) => FINAL[n % 28])
  syl.forEach((n, k) => {
    if (k === syl.length - 1) return
    const f = n % 28
    const next = Math.floor(syl[k + 1] / 588)
    if (next === 11 && CARRY[f] !== '-') {
      // A final moves onto a following vowel: 관악 Gwanak, 안양 Anyang keeps its ng.
      ini[k + 1] = CARRY[f]
      fin[k] = ''
    } else if (next === 5) {
      // ㄹ after a final: 신라 Silla, 종로 Jongno, 독립 Dongnip.
      if (fin[k] === 'n' || fin[k] === 'l') { fin[k] = 'l'; ini[k + 1] = 'l' }
      else if (fin[k]) {
        ini[k + 1] = 'n'
        fin[k] = ({ k: 'ng', t: 'n', p: 'm' } as Record<string, string>)[fin[k]] ?? fin[k]
      }
    } else if (next === 2 || next === 6) {
      // Before ㄴ or ㅁ: 백마 Baengma; ㄹ + ㄴ reads ll.
      if (fin[k] === 'l' && next === 2) ini[k + 1] = 'l'
      else fin[k] = ({ k: 'ng', t: 'n', p: 'm' } as Record<string, string>)[fin[k]] ?? fin[k]
    }
  })
  const out = syl.map((_, k) => ini[k] + vow[k] + fin[k]).join('')
  const word = out.charAt(0).toUpperCase() + out.slice(1)
  return suffix ? `${word}-${({ 구: 'gu', 시: 'si', 군: 'gun' } as Record<string, string>)[suffix]}` : word
}

/** A region as the place data names it (서울, 경기): the Korean short name on Korean pages, the
 * English name elsewhere. */
export function regionName(short: string, locale: string): string {
  if (locale === 'ko') return short
  return Object.values(CITY).find(([ko]) => ko === short)?.[1] ?? romanize(short)
}

/** A district as the place data names it (강남구): Korean on Korean pages, else Revised Romanization. */
export const districtName = (name: string, locale: string) => (locale === 'ko' ? name : romanize(name))

type Geo = { area1: string; area2: string }
const cache = new Map<string, Geo | null>()

function lookup(lat: number, lng: number): Promise<Geo | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null)
  const S = typeof window !== 'undefined' ? window.naver?.maps?.Service : undefined
  if (!S?.reverseGeocode) return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      S.reverseGeocode({ coords: new window.naver.maps.LatLng(lat, lng), orders: S.OrderType.ADM_CODE }, (status: number, res: { v2?: { results?: { region?: { area1?: { name?: string }; area2?: { name?: string } } }[] } }) => {
        const region = status === S.Status.OK ? res?.v2?.results?.[0]?.region : null
        const geo = region?.area1?.name ? { area1: region.area1.name, area2: region.area2?.name ?? '' } : null
        cache.set(key, geo)
        resolve(geo)
      })
    } catch {
      resolve(null)
    }
  })
}

/** `centerAt`: where the visible map's center sits, as a share of the map height from the top (a
 * phone sheet over the lower half puts it at a quarter). */
export function useAreaName(bounds: MapBounds | null, zoom: number, locale: string, centerAt = 0.5): AreaName | null {
  const [geo, setGeo] = useState<Geo | null>(null)
  const lat = bounds ? bounds.maxLat - (bounds.maxLat - bounds.minLat) * centerAt : null
  const lng = bounds ? (bounds.minLng + bounds.maxLng) / 2 : null
  const wide = zoom < 9
  useEffect(() => {
    if (lat === null || lng === null || wide) return setGeo(null)
    let live = true
    lookup(lat, lng).then((g) => live && setGeo(g))
    return () => { live = false }
  }, [lat, lng, wide])
  if (!geo || wide) return null
  const city = CITY[geo.area1]
  if (!city) return null
  const ko = locale === 'ko'
  // A district only once the map shows a part of a city; the district of a whole province is noise.
  const district = zoom >= 12 && geo.area2 ? (ko ? geo.area2.split(' ')[0] : romanize(geo.area2.split(' ')[0])) : null
  return { city: ko ? city[0] : city[1], district }
}
