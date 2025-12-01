'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'

interface RegistrationBlockedModalProps {
  message: string
  onClose: () => void
}

function RegistrationBlockedModal({ message, onClose }: RegistrationBlockedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl bg-black/30"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md backdrop-blur-xl bg-white/15 dark:bg-white/8 border-white/20 dark:border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-500/20 dark:bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Cadastro Bloqueado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-foreground/80">
            {message}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Voltar ao Login
            </Button>
            <Button 
              variant="outline"
              className="w-full bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm"
              asChild
            >
              <Link href="/">Ir para Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'blocked') {
          setBlockedMessage(data.message)
          setShowBlockedModal(true)
          return
        }
        setError(data.error || 'Erro ao criar conta')
        return
      }

      router.push('/')
    } catch (err) {
      setError('Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/auth/login')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">DomineAqui</h1>
          <div className="w-10" />
        </div>

        {/* Main Card */}
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/15 dark:bg-white/8 border-white/20 dark:border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Criar Conta</CardTitle>
            <CardDescription>
              Junte-se a DomineAqui e comece a estudar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="flex gap-3 p-3 bg-red-500/20 dark:bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm focus:bg-white/30 dark:focus:bg-white/15"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm focus:bg-white/30 dark:focus:bg-white/15"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm focus:bg-white/30 dark:focus:bg-white/15"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm focus:bg-white/30 dark:focus:bg-white/15"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem conta? </span>
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-semibold"
              >
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Blocked Modal */}
      {showBlockedModal && (
        <RegistrationBlockedModal
          message={blockedMessage}
          onClose={() => {
            setShowBlockedModal(false)
            router.push('/auth/login')
          }}
        />
      )}
    </>
  )
}
