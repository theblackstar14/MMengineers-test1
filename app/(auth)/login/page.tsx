import { LoginForm } from '@/components/auth/LoginForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — MMHIGHMETRIK ERP',
}

const GOLD = '#C9940E'

export default function LoginPage() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0e0e0e', color: '#ffffff', fontFamily: "Inter, 'Segoe UI', Arial, sans-serif" }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between relative overflow-hidden"
        style={{ padding: '40px 52px', borderRight: `2px solid ${GOLD}` }}
      >
        {/* Decorative circles */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-90px', right: '40px',
            width: '310px', height: '310px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, #1c1c1c 0%, #111111 70%, transparent 100%)',
            opacity: 0.9,
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-110px', left: '-70px',
            width: '340px', height: '340px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, #1c1c1c 0%, #111111 70%, transparent 100%)',
            opacity: 0.9,
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center z-10" style={{ gap: '13px' }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px', height: '48px',
              backgroundColor: GOLD,
              borderRadius: '9px',
              fontWeight: 900,
              fontSize: '15px',
              color: '#0e0e0e',
              letterSpacing: '1px',
            }}
          >
            MM
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#ffffff', letterSpacing: '0.6px', marginBottom: '3px' }}>
              HIGHMETRIK
            </span>
            <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 500 }}>
              Engineers S.A.C
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <div style={{ width: '38px', height: '3px', backgroundColor: GOLD, marginBottom: '20px' }} />
          <p style={{ fontSize: '10.5px', letterSpacing: '3.5px', color: '#888888', textTransform: 'uppercase', marginBottom: '18px', fontWeight: 500 }}>
            Sistema de Gestión Empresarial
          </p>
          <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.05, color: '#ffffff', marginBottom: '22px', letterSpacing: '-0.5px' }}>
            ERP<br />Integrado
          </h1>
          <p style={{ fontSize: '14.5px', color: '#777777', lineHeight: 1.7, maxWidth: '370px', fontWeight: 400 }}>
            Gestión de proyectos de construcción, licitaciones
            y recursos en una sola plataforma centralizada.
          </p>
        </div>

        {/* Pills */}
        <div className="relative z-10 flex flex-wrap" style={{ gap: '10px' }}>
          {['Proyectos', 'Licitaciones', 'Finanzas', 'Reportes'].map(m => (
            <span
              key={m}
              style={{
                padding: '7px 20px',
                border: '1px solid #333333',
                borderRadius: '999px',
                fontSize: '12.5px',
                color: '#bbbbbb',
                background: 'transparent',
                fontWeight: 500,
                letterSpacing: '0.2px',
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex flex-col items-center justify-center relative"
        style={{ width: '490px', minWidth: '490px', padding: '40px 44px', backgroundColor: '#0e0e0e' }}
      >
        {/* Login card */}
        <div
          className="w-full"
          style={{
            maxWidth: '420px',
            backgroundColor: '#181818',
            borderRadius: '14px',
            padding: '40px 40px 34px',
            borderTop: `2.5px solid ${GOLD}`,
          }}
        >
          <h2 style={{ fontSize: '27px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            Iniciar Sesión
          </h2>
          <p style={{ fontSize: '13px', color: '#777777', marginBottom: '34px', lineHeight: 1.5, fontWeight: 400 }}>
            Ingresa tus credenciales para acceder al sistema
          </p>

          <LoginForm />

          <hr style={{ border: 'none', borderTop: '1px solid #272727', margin: '28px 0 20px' }} />

          <div className="text-center">
            <p style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: 1.9, letterSpacing: '0.3px', fontWeight: 400 }}>
              Acceso exclusivo para personal autorizado
            </p>
            <p style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: 1.9, letterSpacing: '0.3px', fontWeight: 400 }}>
              MMHIGHMETRIK ENGINEERS S.A.C © 2025
            </p>
          </div>
        </div>

        {/* Version */}
        <span style={{ position: 'absolute', bottom: '22px', fontSize: '11px', color: '#444444', letterSpacing: '0.4px' }}>
          v1.0.0 <span style={{ color: GOLD, margin: '0 4px' }}>|</span> Sistema ERP – Módulo de Acceso
        </span>
      </div>

      {/* Mobile logo (shown when left panel hidden) */}
      <style>{`
        @media (max-width: 1023px) {
          /* right panel becomes full width */
        }
      `}</style>
    </div>
  )
}
