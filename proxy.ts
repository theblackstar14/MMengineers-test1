import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/login']

// Rutas por rol
const ROLE_ROUTES: Record<string, string[]> = {
  contador: ['/dashboard', '/finanzas'],
  residente_obra: ['/dashboard', '/proyectos', '/finanzas/valorizaciones'],
  administrador: ['/dashboard', '/proyectos', '/licitaciones', '/finanzas', '/reportes'],
  gerente_general: [], // acceso total
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Refrescar sesión (importante para SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Si no autenticado y ruta no pública → login
  if (!user && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Si autenticado y va a /login → dashboard
  if (user && PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Verificar permisos por rol (si hay usuario)
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = profile?.rol as string

    if (rol && rol !== 'gerente_general') {
      const allowed = ROLE_ROUTES[rol] || []
      const hasAccess = allowed.some(route => pathname.startsWith(route))
      if (!hasAccess && pathname !== '/dashboard') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
