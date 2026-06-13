import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const isActive = req.cookies.get('x-b4k-mock')?.value === '1'
  const res = NextResponse.json({ mock: !isActive })
  if (isActive) {
    res.cookies.delete('x-b4k-mock')
  } else {
    res.cookies.set('x-b4k-mock', '1', { path: '/', httpOnly: false, sameSite: 'lax' })
  }
  return res
}
