'use client'

import { useState } from 'react'
import { Heart, Send, Calendar, DollarSign, User, Tag, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DoacaoFormProps {
  open: boolean
  onClose: () => void
}

export function DoacaoForm({ open, onClose }: DoacaoFormProps) {
  const [form, setForm] = useState({
    nomeCompleto: '',
    apelido: '',
    valor: '',
    mensagem: '',
    dataDoacao: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nomeCompleto.trim() || !form.apelido.trim() || !form.valor || !form.dataDoacao) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (isNaN(Number(form.valor)) || Number(form.valor) <= 0) {
      setError('Insira um valor válido em R$.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/doacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao enviar. Tente novamente.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    onClose()
    setTimeout(() => {
      setSuccess(false)
      setError('')
      setForm({
        nomeCompleto: '',
        apelido: '',
        valor: '',
        mensagem: '',
        dataDoacao: new Date().toISOString().split('T')[0],
      })
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {!success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                Registrar minha doação
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados para entrar no ranking de doadores. Sua doação será verificada e aprovada em breve.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Nome completo */}
              <div className="space-y-1.5">
                <Label htmlFor="nomeCompleto" className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Nome completo da conta <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={handleChange}
                  placeholder="Nome como consta na sua conta bancária"
                  required
                  disabled={loading}
                />
              </div>

              {/* Apelido */}
              <div className="space-y-1.5">
                <Label htmlFor="apelido" className="flex items-center gap-1.5 text-sm">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Apelido público <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="apelido"
                  name="apelido"
                  value={form.apelido}
                  onChange={handleChange}
                  placeholder="Como você quer aparecer no ranking"
                  required
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground">Este nome aparecerá publicamente no ranking.</p>
              </div>

              {/* Valor */}
              <div className="space-y-1.5">
                <Label htmlFor="valor" className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Valor doado <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.valor}
                    onChange={handleChange}
                    placeholder="0,00"
                    required
                    disabled={loading}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <Label htmlFor="dataDoacao" className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data da doação <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="dataDoacao"
                  name="dataDoacao"
                  type="date"
                  value={form.dataDoacao}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loading}
                />
              </div>

              {/* Mensagem */}
              <div className="space-y-1.5">
                <Label htmlFor="mensagem" className="flex items-center gap-1.5 text-sm">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Mensagem <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  value={form.mensagem}
                  onChange={handleChange}
                  placeholder="Deixe um recado para a comunidade..."
                  rows={3}
                  disabled={loading}
                  className="resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loading} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Enviar
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Tela de sucesso com animação de batimento cardíaco */
          <div className="py-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="doacao-heart-confirm text-6xl leading-none">❤️</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Muito obrigado, {form.apelido}! 🩺</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                Sua doação foi registrada e está em análise. Após aprovação,
                você aparecerá no ranking de doadores.
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-3">
                Você está investindo em vidas. ❤️
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-2 mx-auto w-fit">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Análise em até 48h
            </div>
            <Button onClick={handleClose} className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
