import 'server-only'

/**
 * Registro das tentativas de passar contato ou combinar por fora.
 *
 * O detector (`contato-inteligente.ts`) decide; aqui a decisão vira evidência
 * para o admin (Admin → Monitorias → Contato por fora) e, na terceira tentativa
 * bloqueada em 24 h, um aviso para a equipe. Nada aqui pune sozinho: quem decide
 * advertência, suspensão ou banimento é o suporte, lendo o registro.
 */

import { getDb } from '@/lib/mongodb'
import { colecoes } from './db'
import { avisarEquipe } from './avisos'
import {
  detectarContato,
  detectarEmSequencia,
  pareceFragmentoNumerico,
  type DeteccaoDeContato,
} from './contato-inteligente'
import type { OrigemInfracao } from './tipos'

/** Quantas tentativas bloqueadas em 24 h chamam a equipe. */
export const TENTATIVAS_PARA_AVISAR = 3
const JANELA_DA_SEQUENCIA_MS = 3 * 60_000

/**
 * Analisa uma mensagem do chat. Se ela é quase só número, junta com as últimas
 * do mesmo autor (dos últimos 3 min) para pegar telefone mandado em pedaços —
 * só nesse caso há uma leitura a mais no banco.
 */
export async function analisarMensagem(reservaId: string, autorId: string, texto: string, agora = new Date()): Promise<DeteccaoDeContato> {
  const direta = detectarContato(texto)
  if (direta.nivel === 'bloqueio' || !pareceFragmentoNumerico(texto)) return direta
  const c = colecoes(await getDb())
  const anteriores = await c.mensagens
    .find({ reservaId, autorId, tipo: 'texto', createdAt: { $gt: new Date(agora.getTime() - JANELA_DA_SEQUENCIA_MS) } }, { projection: { texto: 1 } })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray()
  const emSequencia = detectarEmSequencia(anteriores.reverse().map((m) => m.texto), texto)
  return emSequencia.nivel ? emSequencia : direta
}

export async function registrarInfracao(
  input: {
    reservaId: string
    titulo: string
    userId: string
    nome: string
    papel: 'monitor' | 'aluno'
    origem: OrigemInfracao
    deteccao: DeteccaoDeContato
    texto: string
  },
  agora = new Date(),
): Promise<void> {
  const { deteccao } = input
  if (!deteccao.nivel) return
  const c = colecoes(await getDb())
  await c.infracoes.insertOne({
    reservaId: input.reservaId,
    userId: input.userId,
    nome: input.nome.slice(0, 120),
    papel: input.papel,
    origem: input.origem,
    nivel: deteccao.nivel,
    categorias: deteccao.categorias,
    trechos: deteccao.trechos,
    texto: input.texto.slice(0, 500),
    createdAt: agora,
  })
  if (deteccao.nivel !== 'bloqueio') return
  const recentes = await c.infracoes.countDocuments({ userId: input.userId, nivel: 'bloqueio', createdAt: { $gt: new Date(agora.getTime() - 24 * 3600_000) } })
  if (recentes === TENTATIVAS_PARA_AVISAR) {
    await avisarEquipe(
      'Tentativas de contato por fora',
      `${input.nome} (${input.papel}) teve ${TENTATIVAS_PARA_AVISAR} mensagens bloqueadas em 24 h. Última na monitoria "${input.titulo}".`,
      '/admin/monitorias?aba=contato',
    )
  }
}
