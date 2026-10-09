import 'server-only'

/** Carrega anúncio + tutor + usuário-monitor de uma vez (rotas de pedido/agendamento). */

import { ObjectId } from 'mongodb'
import { obterColecoes } from './db'
import { carregarUsuario, type UsuarioMonitoria } from './servidor'
import { ErroMonitoria } from './reservas'
import type { Anuncio, Tutor } from './tipos'

export async function carregarAnuncioParaContratar(anuncioId: string): Promise<{
  anuncio: Anuncio
  tutor: Tutor
  monitor: UsuarioMonitoria
}> {
  if (!ObjectId.isValid(anuncioId)) throw new ErroMonitoria(404, 'Anúncio não encontrado.')
  const c = await obterColecoes()
  const anuncio = await c.anuncios.findOne({ _id: new ObjectId(anuncioId), status: 'publicado' } as any)
  if (!anuncio || !ObjectId.isValid(anuncio.tutorId)) throw new ErroMonitoria(404, 'Este anúncio não está disponível.')
  const [tutor, monitor] = await Promise.all([
    c.tutores.findOne({ _id: new ObjectId(anuncio.tutorId), status: 'ativo' } as any),
    carregarUsuario(anuncio.userId),
  ])
  if (!tutor || !monitor || monitor.banned) throw new ErroMonitoria(404, 'Este anúncio não está disponível.')
  return { anuncio, tutor, monitor }
}
