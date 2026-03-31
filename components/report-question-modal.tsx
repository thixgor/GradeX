'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ReportQuestionModalProps {
    questionId: string
    examId?: string // Se fornecido, usa o endpoint de prova ao invés do banco
    isOpen: boolean
    onClose: () => void
}

type ReportReason = 'erro_gabarito' | 'enunciado_confuso' | 'imagem_ruim' | 'conteudo_desatualizado' | 'outros'

export function ReportQuestionModal({ questionId, examId, isOpen, onClose }: ReportQuestionModalProps) {
    const [reason, setReason] = useState<ReportReason>('erro_gabarito')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reasons: { value: ReportReason; label: string }[] = [
        { value: 'erro_gabarito', label: 'Gabarito incorreto' },
        { value: 'enunciado_confuso', label: 'Enunciado confuso ou com erros de português' },
        { value: 'imagem_ruim', label: 'Imagem não carrega ou com baixa qualidade' },
        { value: 'conteudo_desatualizado', label: 'Conteúdo desatualizado' },
        { value: 'outros', label: 'Outros (descreva abaixo)' },
    ]

    async function handleSubmit() {
        if (reason === 'outros' && !description.trim()) {
            setError('Por favor, descreva o problema.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const url = examId
                ? `/api/exams/${examId}/report-question`
                : `/api/banco/questoes/${questionId}/report`

            const bodyPayload = examId
                ? { reason, description: description.trim(), questionId }
                : { reason, description: description.trim() }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao enviar relato')
            }

            setSuccess(true)
            setTimeout(() => {
                handleClose()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar relato')
        } finally {
            setLoading(false)
        }
    }

    function handleClose() {
        setSuccess(false)
        setReason('erro_gabarito')
        setDescription('')
        setError(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Relatar Problema
                    </DialogTitle>
                    <DialogDescription>
                        Encontrou algum erro nesta questão? Nos avise para corrigirmos.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium">Relato Enviado!</h3>
                        <p className="text-sm text-muted-foreground">
                            Obrigado por ajudar a melhorar nosso banco de questões.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
                            <div className="space-y-3">
                                {reasons.map((r) => (
                                    <div key={r.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={r.value} id={r.value} />
                                        <Label htmlFor={r.value} className="cursor-pointer font-normal">
                                            {r.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>

                        <div className="space-y-2">
                            <Label htmlFor="description" className={reason === 'outros' ? 'text-foreground' : 'text-muted-foreground'}>
                                Descrição {reason === 'outros' && <span className="text-red-500">*</span>}
                            </Label>
                            <Textarea
                                id="description"
                                placeholder={reason === 'outros' ? 'Descreva o problema encontrado...' : 'Opcional: Detalhes adicionais...'}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={500}
                                className="resize-none"
                                rows={4}
                            />
                            <p className="text-xs text-right text-muted-foreground">
                                {description.length}/500
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {!success && (
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Relato'
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
