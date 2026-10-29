import type { MotivoDeXp } from './cliente'

/**
 * Como cada motivo de XP é comemorado.
 *
 * `grande` abre a celebração central com a marca ("DomineAqui XP", a moeda
 * girando, o número subindo): é para o que acontece poucas vezes e merece
 * pausa — avaliar, comprar, resgatar, entregar prova, terminar foco, concluir
 * aula, criar baralho. O resto (cada questão, cada revisão) ganha o "+XP" com
 * a marca no topo: festa a cada questão viraria barulho e atrapalharia o
 * estudo.
 *
 * A avaliação tem tratamento próprio (`especial`): é o que mais ajuda quem vem
 * depois, e o que a casa mais valoriza — mais tempo na tela, corações e o
 * agradecimento por escrito.
 */
export interface Comemoracao {
  tamanho: 'grande' | 'pequena'
  especial?: boolean
  titulo: string
  texto: string
  /** Rótulo curto do "+XP" pequeno. */
  rotulo: string
}

export const COMEMORACOES: Record<MotivoDeXp, Comemoracao> = {
  avaliacao: {
    tamanho: 'grande',
    especial: true,
    titulo: 'Obrigado pela avaliação!',
    texto: 'Sua opinião guia quem vem depois — e é o que mais vale XP aqui. Com comentário, vale ainda mais.',
    rotulo: 'Avaliação enviada',
  },
  compra: {
    tamanho: 'grande',
    titulo: 'Na sua estante!',
    texto: 'Compra confirmada. O material já é seu — e o XP já entrou.',
    rotulo: 'Compra confirmada',
  },
  resgate: {
    tamanho: 'grande',
    titulo: 'Resgatado com o Plus+!',
    texto: 'O material está liberado na sua conta. Bom estudo.',
    rotulo: 'Resgate do Plus+',
  },
  prova: {
    tamanho: 'grande',
    titulo: 'Prova entregue!',
    texto: 'Cada resposta já conta. Os acertos viram XP quando a nota for liberada.',
    rotulo: 'Prova entregue',
  },
  foco: {
    tamanho: 'grande',
    titulo: 'Sessão de foco concluída!',
    texto: 'Cada minuto de foco vale XP — e bater a meta da sessão vale bônus.',
    rotulo: 'Sessão de foco',
  },
  aula: {
    tamanho: 'grande',
    titulo: 'Aula concluída!',
    texto: 'Mais uma no seu histórico. A próxima está te esperando.',
    rotulo: 'Aula concluída',
  },
  baralho: {
    tamanho: 'grande',
    titulo: 'Baralho criado!',
    texto: 'Criar as próprias cartas é estudar duas vezes. Cada carta nova também vale XP.',
    rotulo: 'Baralho criado',
  },
  flashcard: { tamanho: 'pequena', titulo: 'Revisão salva', texto: '', rotulo: 'Revisão de flashcards' },
  questao: { tamanho: 'pequena', titulo: 'Questão resolvida', texto: '', rotulo: 'Questão resolvida' },
  material: { tamanho: 'pequena', titulo: 'Material estudado', texto: '', rotulo: 'Material estudado' },
  quiz: { tamanho: 'pequena', titulo: 'Quiz concluído', texto: '', rotulo: 'Quiz concluído' },
  jogo: { tamanho: 'pequena', titulo: 'Jogo concluído', texto: '', rotulo: 'Jogo concluído' },
  licao: { tamanho: 'pequena', titulo: 'Lição concluída', texto: '', rotulo: 'Lição concluída' },
  forum: { tamanho: 'pequena', titulo: 'Contribuição no fórum', texto: '', rotulo: 'Fórum' },
  mapa: { tamanho: 'pequena', titulo: 'Mapa mental criado', texto: '', rotulo: 'Mapa mental' },
  anatomia: { tamanho: 'pequena', titulo: 'Quiz de anatomia', texto: '', rotulo: 'Quiz de anatomia' },
}

/** Sem motivo conhecido: ganho grande (50+) também merece a celebração. */
export function comemoracaoPara(motivo: MotivoDeXp | null | undefined, xp: number): Comemoracao {
  if (motivo && COMEMORACOES[motivo]) return COMEMORACOES[motivo]
  return xp >= 50
    ? { tamanho: 'grande', titulo: 'XP conquistado!', texto: 'Seu estudo virou ponto. Continue assim.', rotulo: 'XP conquistado' }
    : { tamanho: 'pequena', titulo: 'XP conquistado', texto: '', rotulo: 'XP conquistado' }
}
