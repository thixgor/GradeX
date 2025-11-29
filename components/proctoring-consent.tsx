'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Mic, Monitor, Shield, AlertTriangle } from 'lucide-react'
import { ScreenCaptureMode } from '@/lib/types'

interface ProctoringConsentProps {
  examTitle: string
  camera: boolean
  audio: boolean
  screen: boolean
  screenMode?: ScreenCaptureMode
  onAccept: () => Promise<void>
  onReject: () => void
}

export function ProctoringConsent({
  examTitle,
  camera,
  audio,
  screen,
  screenMode,
  onAccept,
  onReject,
}: ProctoringConsentProps) {
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function handleAccept() {
    if (!accepted) {
      alert('Você deve aceitar os termos para continuar')
      return
    }

    setLoading(true)
    try {
      await onAccept()
    } catch (error) {
      console.error('Erro ao aceitar termo:', error)
      alert('Erro ao configurar monitoramento. Verifique as permissões do navegador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">Termo de Consentimento - Sistema de Monitoramento</CardTitle>
          </div>
          <CardDescription>
            Prova: <strong>{examTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introdução */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Esta prova utiliza um sistema de monitoramento para garantir a integridade do processo avaliativo.
              Ao continuar, você concorda com as condições descritas abaixo.
            </p>
          </div>

          {/* O que será monitorado */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              📹 O que será monitorado durante a prova:
            </h3>
            <div className="space-y-3 pl-2">
              {camera && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Camera className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Câmera</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua câmera será ativada e exibida no canto superior esquerdo da tela durante toda a prova.
                      O vídeo será transmitido em tempo real para o administrador.
                    </p>
                  </div>
                </div>
              )}

              {audio && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Mic className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Áudio</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seu áudio será capturado e transmitido em tempo real para o administrador durante toda a prova.
                    </p>
                  </div>
                </div>
              )}

              {screen && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Monitor className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Transmissão de Tela</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {screenMode === 'window'
                        ? 'Você deverá compartilhar a janela do navegador onde a prova está aberta.'
                        : 'Você deverá compartilhar sua tela inteira.'}
                      {' '}O compartilhamento será transmitido em tempo real para o administrador.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Avisos Importantes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              ⚠️ Avisos Importantes:
            </h3>
            <div className="space-y-2 pl-2">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-900 dark:text-yellow-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Permissões do Navegador:</strong> Você precisará autorizar o acesso à câmera, áudio e/ou tela
                    quando solicitado pelo navegador. Sem essas permissões, a prova não poderá ser iniciada.
                  </span>
                </p>
              </div>

              {camera && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-900 dark:text-red-100 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Detecção Automática de Bloqueio:</strong> Se sua câmera ficar preta, bloqueada ou
                      desconectada por mais de 2 minutos e 30 segundos, a prova será automaticamente submetida
                      com as respostas marcadas até aquele momento.
                    </span>
                  </p>
                </div>
              )}

              <div className="p-3 bg-muted rounded">
                <p className="text-sm flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <span>
                    <strong>Privacidade:</strong> Os dados coletados serão utilizados exclusivamente para fins de
                    monitoramento desta prova e não serão compartilhados com terceiros.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de aceitação */}
          <div className="border-t pt-4">
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input"
              />
              <label htmlFor="acceptTerms" className="flex-1 cursor-pointer text-sm">
                Li e aceito os termos do sistema de monitoramento. Compreendo que minha{' '}
                {[
                  camera && 'câmera',
                  audio && 'áudio',
                  screen && 'tela'
                ].filter(Boolean).join(', ')}{' '}
                será(ão) monitorado(s) durante toda a prova e que o descumprimento das regras pode resultar
                na submissão automática da avaliação.
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end border-t pt-4">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={loading}
            >
              Não Aceito
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!accepted || loading}
              className="min-w-32"
            >
              {loading ? 'Configurando...' : 'Aceito e Continuar'}
            </Button>
          </div>

          {/* Nota técnica */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>
              <strong>Nota técnica:</strong> Este sistema funciona melhor nos navegadores Chrome, Edge ou Firefox.
              Certifique-se de estar em um ambiente adequado para realizar a prova.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
