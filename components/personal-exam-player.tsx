'use client'

// Este componente agora apenas redireciona para a página de execução de prova geral
// mas com indicação de que é uma prova pessoal
// A lógica de feedback diferenciado será implementada na página de execução

import { useEffect } from 'react'
import { Exam } from '@/lib/types'

interface PersonalExamPlayerProps {
  exam: Exam
  onSubmit?: (answers: Record<string, string>) => void
}

export function PersonalExamPlayer({ exam, onSubmit }: PersonalExamPlayerProps) {
  // Este componente não é mais usado - a prova pessoal usa a mesma interface da prova geral
  // mas com feedback diferenciado implementado na página de execução
  
  useEffect(() => {
    console.warn('PersonalExamPlayer foi descontinuado. Use a página de execução de prova normal.')
  }, [])

  return null
}
