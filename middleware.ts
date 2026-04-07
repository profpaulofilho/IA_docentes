import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Rotas públicas
  const publicRoutes = ['/', '/login', '/auth/callback', '/mqct']

  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
