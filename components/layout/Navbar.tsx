'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useTransition, useRef, useEffect, useLayoutEffect } from 'react'
import type { Profile } from '@/lib/types/database'
import {
  LayoutDashboard, FolderKanban, Gavel, Wallet,
  BarChart3, Bot, ChevronDown, LogOut, User, Settings
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/proyectos',    label: 'Proyectos',    icon: FolderKanban },
  { href: '/licitaciones', label: 'Licitaciones', icon: Gavel },
  { href: '/finanzas',     label: 'Finanzas',     icon: Wallet },
  { href: '/reportes',     label: 'Reportes',     icon: BarChart3 },
  { href: '/asistente',    label: 'Asistente IA', icon: Bot },
]

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sliding pill refs
  const navRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const [pillReady, setPillReady] = useState(false)

  const activeIndex = NAV_LINKS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(href + '/')
  )

  useLayoutEffect(() => {
    const el = linkRefs.current[activeIndex]
    const container = navRef.current
    if (!el || !container) return
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setPillStyle({
      left: elRect.left - containerRect.left,
      width: elRect.width,
      opacity: 1,
    })
    setPillReady(true)
  }, [activeIndex, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 border-b"
      style={{ backgroundColor: '#0D1320', borderColor: '#1E293B' }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded flex items-center justify-center bg-yellow-500 shrink-0">
          <span className="text-xs font-black text-gray-900">MM</span>
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-white tracking-wide">HIGHMETRIK ENGINEERS</div>
          <div className="text-[10px] text-gray-500 leading-none">ERP Sistema</div>
        </div>
      </Link>

      {/* Links de navegación */}
      <div ref={navRef} className="relative flex items-center gap-1">
        {/* Sliding pill */}
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="absolute top-0 h-full rounded-md"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              opacity: pillStyle.opacity,
              backgroundColor: 'rgba(234,179,8,0.10)',
              transition: pillReady
                ? 'left 200ms cubic-bezier(0.4,0,0.2,1), width 200ms cubic-bezier(0.4,0,0.2,1), opacity 150ms'
                : 'opacity 150ms',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {NAV_LINKS.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const loading = isPending && pendingHref === href
          return (
            <Link
              key={href}
              href={href}
              ref={el => { linkRefs.current[i] = el }}
              onClick={() => {
                if (!active) {
                  setPendingHref(href)
                  startTransition(() => { setPendingHref(null) })
                }
              }}
              className={cn(
                'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150',
                active
                  ? 'text-yellow-400'
                  : loading
                    ? 'text-yellow-400/50'
                    : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon
                size={14}
                className={loading ? 'animate-spin' : ''}
                style={loading ? { animationDuration: '1s' } : {}}
              />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Avatar + menú */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">{initials}</span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-white leading-none">
              {profile.nombre} {profile.apellido.split(' ')[0]}
            </div>
            <div className="text-xs text-gray-500 leading-none mt-0.5 capitalize">
              {profile.rol.replace('_', ' ')}
            </div>
          </div>
          <ChevronDown size={14} className="text-gray-500" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-52 rounded-lg border py-1 shadow-xl z-50"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: '#1E293B' }}>
              <div className="text-sm font-medium text-white">
                {profile.nombre} {profile.apellido}
              </div>
              <div className="text-xs text-gray-500">{profile.email}</div>
            </div>
            <Link
              href="/perfil"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User size={14} />
              Mi perfil
            </Link>
            {profile.rol === 'gerente_general' && (
              <Link
                href="/configuracion"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings size={14} />
                Configuración
              </Link>
            )}
            <div className="border-t mt-1 pt-1" style={{ borderColor: '#1E293B' }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
