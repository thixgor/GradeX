import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { acessoDeLeitura, carregarReserva } from '@/lib/monitorias/reservas'
import { mascararContato } from '@/lib/monitorias/contato'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { quemFaltaAssinar } from '@/lib/monitorias/contratos'
import { contratoComPoliticaV5 } from '@/lib/monitorias/documentos/contrato'
import { podeReportar } from '@/lib/monitorias/politica'
import { negociavel } from '@/lib/monitorias/estado'
import { configDaSala } from '@/lib/monitorias/sala/config'
import { ASSENTOS_COM_AULA, janelaDaSala } from '@/lib/monitorias/sala/regras'
import { presencaResumida } from '@/lib/monitorias/sala/servidor'
import { autorizacaoPelosTermos } from '@/lib/monitorias/resumo/autorizacao'

export const dynamic = 'force-dynamic'

const DIAS_DO_HISTORICO = 90

/**
 * Nos últimos 90 dias, em outras aulas: quantas o aluno teve, quantas faltou e
 * quantas cancelou em cima da hora. Só contagens — nada de outras reservas vaza.
 */
async function historicoDosAlunos(
  c: Awaited<ReturnType<typeof obterColecoes>>,
  reservaId: string,
  alunoIds: string[],
): Promise<Map<string, { aulas: number; faltas: number; cancelamentosTardios: number }>> {
  const ids = Array.from(new Set(alunoIds))
  const mapa = new Map(ids.map((aid) => [aid, { aulas: 0, faltas: 0, cancelamentosTardios: 0 }]))
  if (!ids.length) return mapa
  const outros = await c.participacoes
    .find(
      { alunoId: { $in: ids }, createdAt: { $gte: new Date(Date.now() - DIAS_DO_HISTORICO * 24 * 3_600_000) }, reservaId: { $ne: reservaId } } as any,
      { projection: { alunoId: 1, status: 1, falta: 1, cancelamentoTardio: 1 } },
    )
    .limit(500)
    .toArray()
  for (const p of outros) {
    const h = mapa.get(p.alunoId)
    if (!h) continue
    if (['paga', 'gratis', 'concluida'].includes(p.status) || p.cancelamentoTardio) h.aulas++
    if (p.falta) h.faltas++
    if (p.cancelamentoTardio) h.cancelamentosTardios++
  }
  return mapa
}

const VE_LINK = ['confirmada', 'realizada', 'em_disputa', 'concluida']

/** GET — tudo que a sala da reserva precisa, filtrado pelo papel de quem pede. */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { limite: { limit: 120, windowMs: 60_000 } }, async ({ sessao }) => {
    const reserva = await carregarReserva(params.id)
    const acesso = await acessoDeLeitura(reserva, sessao.userId)
    if (!acesso && sessao.role !== 'admin') return naoEncontrado()
    const papel = acesso?.papel || null
    const ver = (texto: string) => (acesso?.mascarar ? mascararContato(texto).texto : texto)
    const c = await obterColecoes()
    const id = idDe(reserva)
    const [assentos, contratos, anuncio, tutor, mensagens, configSala, presenca, tarefaResumo] = await Promise.all([
      c.participacoes.find({ reservaId: id }).toArray(),
      // Sem os dados pessoais das partes nem o texto: só o que a tela usa (assinaturas e a versão do modelo).
      c.contratos.find({ reservaId: id, status: { $ne: 'rescindido' } }, { projection: { 'dados.contratante': 0, 'dados.contratado': 0, secoes: 0 } }).toArray(),
      c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any, { projection: { slug: 1, conteudos: 1, aulaGratis: 1, grupo: 1, preco: 1, modos: 1, materiais: 1, excluidoEm: 1 } }),
      c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1, fotoUrl: 1, titulo: 1 } }),
      c.mensagens.find({ reservaId: id }).sort({ createdAt: -1 }).limit(150).toArray(),
      configDaSala(),
      papel ? presencaResumida(reserva, sessao.userId) : Promise.resolve(null),
      c.resumos.findOne({ _id: id }, { projection: { status: 1 } }),
    ])
    const meu = assentos.find((a) => a.alunoId === sessao.userId) || null
    // Para o monitor: o histórico de cada aluno nos últimos 90 dias (só contagens).
    const historico = papel === 'monitor' ? await historicoDosAlunos(c, id, assentos.map((a) => a.alunoId)) : null
    // Resumo por IA: o meu adicional (se comprei) e se a aula tem resumo (o monitor vê para autorizar na sala).
    const [meuResumo, monitorPelosTermos] = await Promise.all([
      meu && tarefaResumo ? c.resumosAdicionais.findOne({ participacaoId: idDe(meu) }, { projection: { status: 1 } }) : null,
      // O monitor vê no cartão se a voz dele já está autorizada nos Termos (v5+) ou se decide na sala.
      papel === 'monitor' && tarefaResumo ? autorizacaoPelosTermos(sessao.userId).then(Boolean) : false,
    ])
    const meuContrato = meu ? contratos.find((k) => k.participacaoId === idDe(meu)) || null : null
    const ehMonitor = papel === 'monitor'
    const pagouOuGratis = !!meu && ['paga', 'gratis', 'concluida'].includes(meu.status)
    const verLink = VE_LINK.includes(reserva.status) && (ehMonitor || pagouOuGratis)
    // Sala nativa: quem tem aula (monitor ou assento com aula) vê o cartão de entrada.
    // É só a dica da tela; quem decide a entrada é `…/sala` (reconfere tudo).
    const temAula = !acesso?.somenteLeitura && (ehMonitor || (!!meu && ASSENTOS_COM_AULA.includes(meu.status)))
    // Materiais: os do anúncio quando a reserva nasceu + os atuais do anúncio
    // + os que o monitor mandou só para esta aula (esses, só para quem pagou).
    const doAnuncio = [...(reserva.materiais || []), ...(anuncio?.materiais || [])]
    const vistos = new Set<string>()
    const materiais = [
      ...doAnuncio.map((m) => ({ titulo: m.titulo, url: m.url, dominio: m.dominio, exclusivo: false, em: null as Date | null })),
      ...(ehMonitor || pagouOuGratis || sessao.role === 'admin'
        ? (reserva.materiaisExtras || []).map((m) => ({ titulo: m.titulo, url: m.url, dominio: m.dominio, exclusivo: true, em: m.em }))
        : []),
    ].filter((m) => (vistos.has(m.url) ? false : (vistos.add(m.url), true)))
    const pendentesDoMonitor = ehMonitor
      ? contratos.filter((k) => k.status === 'aguardando_assinaturas' && quemFaltaAssinar(k).includes('contratado'))
      : []

    return jsonComprimido(request, {
      papel: papel || 'admin',
      /** Saiu da reserva (expirou, cancelou, foi reembolsado): vê o histórico, não age nem escreve. */
      somenteLeitura: !!acesso?.somenteLeitura,
      versao: reserva.versao,
      maisAntigas: mensagens.length === 150,
      reserva: {
        id,
        anuncioId: reserva.anuncioId,
        anuncioTitulo: reserva.anuncioTitulo,
        anuncioSlug: (anuncio && !anuncio.excluidoEm && anuncio.slug) || null,
        conteudosDoAnuncio: anuncio?.conteudos || [],
        aulaGratis: anuncio?.aulaGratis || null,
        grupo: anuncio?.grupo || null,
        precoReferencia: anuncio?.preco || null,
        status: reserva.status,
        origem: reserva.origem,
        /** Pedido do aluno que originou a conversa (cópia, sem dados pessoais). */
        demanda: reserva.demanda ? { ...reserva.demanda, id: undefined } : null,
        // Sem o id da conta de quem propôs: só o lado (monitor/aluno).
        proposta: reserva.proposta
          ? { ...reserva.proposta, autorId: undefined, deMonitor: reserva.proposta.autorId === reserva.tutorUserId, observacao: reserva.proposta.observacao ? ver(reserva.proposta.observacao) : undefined }
          : null,
        aceites: reserva.aceites,
        inicio: reserva.inicio || null,
        fim: reserva.fim || null,
        prazoPagamento: reserva.prazoPagamento || null,
        linkReuniao: verLink ? reserva.linkReuniao || null : null,
        temLink: !!reserva.linkReuniao,
        sala: {
          nativa: configSala.salaNativaAtiva,
          linkExternoPermitido: configSala.linkExternoPermitido,
          podeEntrar: temAula && configSala.salaNativaAtiva,
          janela: temAula && reserva.inicio && reserva.fim ? janelaDaSala(reserva.inicio, reserva.fim, ehMonitor ? 'monitor' : 'aluno') : null,
          presenca: temAula ? presenca : null,
        },
        codigoConvite: reserva.codigoConvite && (ehMonitor || papel === 'organizador') ? reserva.codigoConvite : null,
        motivoCancelamento: reserva.motivoCancelamento ? ver(reserva.motivoCancelamento) : null,
        disputa: reserva.disputa ? { em: reserva.disputa.em, motivo: reserva.disputa.motivo, decisao: reserva.disputa.decisao || null } : null,
        negociavel: negociavel(reserva.status) && reserva.origem !== 'direto',
        podeReportar: !ehMonitor && pagouOuGratis && ['confirmada', 'realizada'].includes(reserva.status) && podeReportar(reserva.fim, new Date(), reserva.inicio),
        resumoIA: tarefaResumo && (meuResumo || ehMonitor) ? { tarefa: tarefaResumo.status, meu: meuResumo?.status || null, ...(ehMonitor ? { pelosTermos: monitorPelosTermos } : {}) } : null,
        createdAt: reserva.createdAt,
      },
      monitor: tutor ? { nome: tutor.nome, fotoUrl: tutor.fotoUrl || null, titulo: tutor.titulo } : null,
      meuAssento: meu
        ? {
            id: idDe(meu),
            status: meu.status,
            valorCentavos: meu.valorCentavos,
            pagoCentavos: meu.pagoCentavos ?? null,
            pagoEm: meu.pagoEm ?? null,
            paymentOrderId: meu.paymentOrderId ?? null,
            reembolsos: meu.reembolsos.map((r) => ({ valorCentavos: r.valorCentavos, status: r.status, em: r.em, motivo: r.motivo })),
            avaliacao: meu.avaliacao ? { nota: meu.avaliacao.nota, comentario: meu.avaliacao.comentario } : null,
            // Material oficial comprado junto (link para abrir em Materiais).
            materialOficial: meu.materialOficial ? { id: meu.materialOficial.id, titulo: meu.materialOficial.titulo } : null,
            /** Política do contrato deste assento ('v5' = tabela 100/50/0; sem marca = regra antiga). */
            politica: meu.politica || null,
            temResumoIA: !!meu.resumoIA,
            cancelamentoTardio: meu.cancelamentoTardio
              ? {
                  horasAntes: meu.cancelamentoTardio.horasAntes,
                  pctDevolvido: meu.cancelamentoTardio.pctDevolvido,
                  devolvidoCentavos: meu.cancelamentoTardio.devolvidoCentavos,
                  retidoCentavos: meu.cancelamentoTardio.retidoCentavos,
                  liberarApos: meu.cancelamentoTardio.liberarApos,
                  revisao: meu.cancelamentoTardio.revisao
                    ? { em: meu.cancelamentoTardio.revisao.em, decididaEm: meu.cancelamentoTardio.revisao.decididaEm || null, decisao: meu.cancelamentoTardio.revisao.decisao || null, nota: meu.cancelamentoTardio.revisao.nota || null }
                    : null,
                  podePedirRevisao: !meu.cancelamentoTardio.revisao && !meu.cancelamentoTardio.liberadoEm && Date.now() < new Date(meu.cancelamentoTardio.liberarApos).getTime(),
                }
              : null,
            falta: meu.falta ? { em: meu.falta.em, fonte: meu.falta.fonte } : null,
          }
        : null,
      meuContrato: meuContrato
        ? {
            id: idDe(meuContrato),
            numero: meuContrato.numero,
            status: meuContrato.status,
            falta: quemFaltaAssinar(meuContrato),
            /** Contrato v5+: cancelamento 100% / 50% / 0% (o assento congela isso no pagamento). */
            politicaV5: contratoComPoliticaV5(meuContrato.dados?.modeloVersao),
          }
        : null,
      contratosParaAssinar: pendentesDoMonitor.map((k) => ({ id: idDe(k), numero: k.numero })),
      materiais,
      assentos:
        ehMonitor || papel === 'organizador' || sessao.role === 'admin'
          ? assentos.map((a) => ({
              alunoNome: ehMonitor || sessao.role === 'admin' ? a.alunoNome : a.alunoNome.split(' ')[0],
              status: a.status,
              eu: a.alunoId === sessao.userId,
              ...(ehMonitor
                ? {
                    id: idDe(a),
                    contratoId: a.contratoId || null,
                    semTaxa: a.taxaPercent === 0,
                    falta: a.falta ? { em: a.falta.em, fonte: a.falta.fonte } : null,
                    cancelamentoTardio: a.cancelamentoTardio ? { horasAntes: a.cancelamentoTardio.horasAntes, pctDevolvido: a.cancelamentoTardio.pctDevolvido, retidoCentavos: a.cancelamentoTardio.retidoCentavos, liberarApos: a.cancelamentoTardio.liberarApos } : null,
                    historico: historico?.get(a.alunoId) || null,
                  }
                : {}),
            }))
          : [],
      mensagens: mensagens.reverse().map((m) => ({
        id: idDe(m),
        autor: m.autorId === 'sistema' ? 'sistema' : m.autorId === sessao.userId ? 'eu' : m.autorId === reserva.tutorUserId ? 'monitor' : 'aluno',
        tipo: m.tipo,
        texto: ver(m.texto),
        propostaId: m.propostaId || null,
        createdAt: m.createdAt,
      })),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  })
}
