import { regrasDaAula } from '@/lib/aulas/acesso'
import { PLUS_LABEL } from '@/lib/account-tier'

/**
 * Os selos de situação da aula no painel (§5).
 *
 * Sem eles o admin precisa abrir a aula para responder a pergunta mais básica
 * do dia a dia — "isto está no ar?". E a resposta não cabe num booleano: uma
 * aula pode estar publicada mas agendada para semana que vem, ou visível mas
 * trancada atrás de um material. São dois eixos diferentes, e por isso viram
 * dois grupos de selo:
 *
 *  • **situação** — está no ar, oculta, ou esperando a data? Sempre exatamente
 *    uma;
 *  • **acesso** — quem consegue abrir? Zero ou mais.
 *
 * Misturar os dois num selo só ("Publicada Plus+") esconderia o caso que mais
 * gera engano: aula publicada, mas com acesso que ninguém tem.
 */

export type SituacaoDaAula = 'publicada' | 'oculta' | 'agendada' | 'encerrada'

export interface SeloDeSituacao {
  id: SituacaoDaAula
  rotulo: string
  /** Sinal semântico para a cor; a tela decide as classes. */
  tom: 'ok' | 'neutro' | 'atencao' | 'perigo'
  detalhe?: string
}

export interface AulaParaSelo {
  oculta?: boolean
  visibilidade?: string
  dataLiberacao?: string | Date | null
  /** Mesmo campo que o motor de acesso lê para encerrar a janela. */
  ocultarEm?: string | Date | null
  ocultarAteLiberacao?: boolean
  regrasAcesso?: any
  vinculoMaterial?: { materialId?: string; materialTitulo?: string } | null
}

function paraData(valor: unknown): Date | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(String(valor))
  return Number.isNaN(data.getTime()) ? null : data
}

export function situacaoDaAula(aula: AulaParaSelo, agora: Date = new Date()): SeloDeSituacao {
  // Oculta vence tudo: é a decisão explícita do admin, e mostrar "Agendada"
  // numa aula que ele acabou de tirar do ar seria mentir sobre o que acontece.
  // O banco guarda um booleano só (`oculta`), então rascunho e "tirei do ar"
  // são o mesmo estado. Chamar de "Oculta" é o rótulo honesto: dizer
  // "Rascunho" para uma aula que já esteve publicada seria inventar histórico.
  if (aula.oculta === true) {
    return { id: 'oculta', rotulo: 'Oculta', tom: 'neutro' }
  }

  const encerramento = paraData(aula.ocultarEm)
  if (encerramento && encerramento <= agora) {
    return { id: 'encerrada', rotulo: 'Encerrada', tom: 'perigo' }
  }

  const liberacao = paraData(aula.dataLiberacao)
  if (liberacao && liberacao > agora) {
    return {
      id: 'agendada',
      rotulo: 'Agendada',
      tom: 'atencao',
      detalhe: liberacao.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  return { id: 'publicada', rotulo: 'Publicada', tom: 'ok' }
}

export interface SeloDeAcesso {
  rotulo: string
  tom: 'ok' | 'neutro' | 'destaque' | 'atencao'
}

/**
 * Quem consegue abrir a aula, em palavras curtas.
 *
 * Lê as mesmas regras que o motor de acesso usa, e não o campo `visibilidade`
 * cru: assim o selo nunca discorda da trava de verdade. Uma aula com regra
 * nova e `visibilidade` antiga mostraria "Gratuita" enquanto o servidor
 * devolve cadeado — exatamente o tipo de divergência que faz o admin achar que
 * a plataforma está quebrada.
 */
export function selosDeAcesso(aula: AulaParaSelo): SeloDeAcesso[] {
  const regras = regrasDaAula(aula as any)
  const selos: SeloDeAcesso[] = []

  if (regras.amostra) {
    selos.push({ rotulo: 'Amostra', tom: 'destaque' })
  }

  for (const condicao of regras.liberarPara || []) {
    switch (condicao.tipo) {
      case 'publico':
        selos.push({ rotulo: 'Aberta', tom: 'ok' })
        break
      case 'cadastrado':
        selos.push({ rotulo: 'Cadastrados', tom: 'neutro' })
        break
      case 'plus':
        selos.push({ rotulo: PLUS_LABEL, tom: 'destaque' })
        break
      case 'manual-clinico':
        selos.push({ rotulo: 'Manual Clínico', tom: 'destaque' })
        break
      case 'material':
        selos.push({ rotulo: condicao.titulo || 'Material', tom: 'atencao' })
        break
      case 'pacote':
        selos.push({ rotulo: condicao.titulo || 'Pacote', tom: 'atencao' })
        break
      case 'grupo':
        selos.push({ rotulo: condicao.titulo || 'Turma', tom: 'atencao' })
        break
    }
  }

  if ((regras.exigirTambem || []).length > 0) {
    selos.push({ rotulo: 'Restrita a turma', tom: 'atencao' })
  }

  // Vínculo com /materiais não é uma condição de acesso — é de onde o conteúdo
  // vem (§6). Vale o selo porque muda o que editar: o vídeo mora no material.
  if (aula.vinculoMaterial?.materialId) {
    selos.push({ rotulo: 'Vinculada a material', tom: 'neutro' })
  }

  return selos
}

/**
 * Aula sem conteúdo nenhum — o alerta que mais poupa suporte.
 *
 * Uma aula publicada e vazia é indistinguível de uma aula quebrada para quem
 * está do outro lado. O painel precisa gritar isso antes do aluno descobrir.
 */
export function estaVazia(aula: AulaParaSelo & { videoEmbed?: string; linkOuEmbed?: string; pdfs?: any[]; botoesAcesso?: any[] }): boolean {
  if (aula.vinculoMaterial?.materialId) return false
  return (
    !aula.videoEmbed &&
    !aula.linkOuEmbed &&
    (aula.pdfs || []).length === 0 &&
    (aula.botoesAcesso || []).length === 0
  )
}
