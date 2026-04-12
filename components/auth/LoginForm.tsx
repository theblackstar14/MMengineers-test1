'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const GOLD = '#C9940E'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : 'Error al iniciar sesión. Intenta nuevamente.'
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Email */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '2.2px', color: '#777777', textTransform: 'uppercase', marginBottom: '9px', fontWeight: 600 }}>
          Usuario / Correo Electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="nombre@mmhighmetrik.com"
          required
          disabled={loading}
          autoComplete="username"
          style={{
            width: '100%',
            backgroundColor: '#222222',
            border: '1px solid #2e2e2e',
            borderRadius: '7px',
            padding: '13px 15px',
            fontSize: '13.5px',
            color: '#ffffff',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.backgroundColor = '#252525' }}
          onBlur={e => { e.target.style.borderColor = '#2e2e2e'; e.target.style.backgroundColor = '#222222' }}
        />
      </div>

      {/* Contraseña */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '10px', letterSpacing: '2.2px', color: '#777777', textTransform: 'uppercase', marginBottom: '9px', fontWeight: 600 }}>
          Contraseña
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            disabled={loading}
            autoComplete="current-password"
            style={{
              width: '100%',
              backgroundColor: '#222222',
              border: '1px solid #2e2e2e',
              borderRadius: '7px',
              padding: '13px 42px 13px 15px',
              fontSize: '13.5px',
              color: '#ffffff',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.backgroundColor = '#252525' }}
            onBlur={e => { e.target.style.borderColor = '#2e2e2e'; e.target.style.backgroundColor = '#222222' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a4a', padding: 0,
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember / forgot row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#999999', cursor: 'pointer', userSelect: 'none', fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: GOLD, cursor: 'pointer' }}
          />
          Recordar sesión
        </label>
        <button
          type="button"
          style={{ fontSize: '13px', color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '7px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !email || !password}
        style={{
          width: '100%',
          backgroundColor: loading || !email || !password ? '#8a6500' : GOLD,
          color: '#0e0e0e',
          border: 'none',
          borderRadius: '7px',
          padding: '15px',
          fontSize: '12.5px',
          fontWeight: 800,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verificando...
          </>
        ) : (
          'Ingresar al Sistema'
        )}
      </button>
    </form>
  )
}
