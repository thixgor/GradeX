import { describe, expect, it } from 'vitest'

import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import {
  aulasLiberadasPeloMaterial,
  diagnosticarVinculo,
  ehMaterialDeVideo,
  regrasComVinculo,
  resolverConteudo,
} from '@/lib/aulas/vinculo-material'

/**
 * O que estes testes protegem: a fronteira entre conteúdo e venda.
 *
 * A integração Aulas ↔ /materiais tem dois jeitos clássicos de dar errado, e os
 * dois custam dinheiro:
 *
 *  • **tirar acesso de quem já tinha** — vender uma aula do curso e, sem
 *    querer, transformar a venda em condição única, trancando os assinantes;
 *  • **duplicar o conteúdo** — o vídeo passar a existir em dois lugares e
 *    divergir na primeira edição.
 */

function aula(over: Record<string, any> = {}) {
  return {
    visibilidade: 'plus' as const,
    oculta: false,
    dataLiberacao: new Date('2026-01-01'),
    ...over,
  }
}

const VINCULO = {
  materialId: 'mat-1',
  materialTitulo: 'Curso de ECG',
  liberaPorCompra: true,
  conteudoDoMaterial: false,
}

describe('vender a aula não tira acesso de quem já tinha', () => {
  it('assinante continua entrando depois de a aula virar produto', () => {
    const conteudo = aula({ vinculoMaterial: VINCULO })
    const regras = regrasComVinculo(conteudo)
    expect(avaliarAcessoAula({ ...conteudo, regrasAcesso: regras }, { logado: true, ehPlus: true }).liberado).toBe(true)
  })

  it('comprador do material entra sem ser assinante', () => {
    const conteudo = aula({ vinculoMaterial: VINCULO })
    const regras = regrasComVinculo(conteudo)
    const veredito = avaliarAcessoAula(
      { ...conteudo, regrasAcesso: regras },
      { logado: true, materiais: ['mat-1'] },
    )
    expect(veredito.liberado).toBe(true)
  })

  it('quem não tem nenhum dos dois continua bloqueado', () => {
    const conteudo = aula({ vinculoMaterial: VINCULO })
    const regras = regrasComVinculo(conteudo)
    expect(avaliarAcessoAula({ ...conteudo, regrasAcesso: regras }, { logado: true }).liberado).toBe(false)
  })

  it('comprar o pacote que contém o material também libera', () => {
    // Sem isto o admin teria de cadastrar cada combo dentro de cada aula.
    const conteudo = aula({ vinculoMaterial: VINCULO })
    const regras = regrasComVinculo(conteudo, ['pac-9'])
    expect(avaliarAcessoAula({ ...conteudo, regrasAcesso: regras }, { logado: true, pacotes: ['pac-9'] }).liberado).toBe(true)
  })

  it('vínculo sem liberaPorCompra não mexe nas regras', () => {
    const conteudo = aula({ vinculoMaterial: { ...VINCULO, liberaPorCompra: false } })
    expect(regrasComVinculo(conteudo).liberarPara).toEqual([{ tipo: 'plus' }])
  })

  it('não duplica condição já cadastrada à mão', () => {
    const conteudo = aula({
      regrasAcesso: { liberarPara: [{ tipo: 'material', itemId: 'mat-1' }] },
      vinculoMaterial: VINCULO,
    })
    const materiais = regrasComVinculo(conteudo).liberarPara.filter((c: any) => c.itemId === 'mat-1')
    expect(materiais).toHaveLength(1)
  })

  it('aula gratuita vendida em material continua aberta a quem tem conta', () => {
    const conteudo = aula({ visibilidade: 'gratuita', vinculoMaterial: VINCULO })
    const regras = regrasComVinculo(conteudo)
    expect(avaliarAcessoAula({ ...conteudo, regrasAcesso: regras }, { logado: true }).liberado).toBe(true)
  })
})

describe('o conteúdo tem dono único', () => {
  const material = {
    title: 'Aula de ECG',
    type: 'video_embed',
    downloadUrl: 'https://player/material',
    coverImage: 'https://img/capa.jpg',
    videoDuration: 1800,
  }

  it('com conteudoDoMaterial, o vídeo vem do material', () => {
    const resolvido = resolverConteudo(
      { videoEmbed: 'https://player/aula' },
      { ...VINCULO, conteudoDoMaterial: true },
      material,
    )
    expect(resolvido.videoEmbed).toBe('https://player/material')
    expect(resolvido.origem).toBe('material')
    expect(resolvido.duracaoSegundos).toBe(1800)
  })

  it('sem a flag, o vídeo continua na aula mesmo havendo vínculo de venda', () => {
    const resolvido = resolverConteudo({ videoEmbed: 'https://player/aula' }, VINCULO, material)
    expect(resolvido.videoEmbed).toBe('https://player/aula')
    expect(resolvido.origem).toBe('aula')
  })

  it('material que deixou de ser vídeo não deixa o player vazio', () => {
    // Perder o vínculo é problema de configuração; tela em branco é problema
    // do aluno. Na dúvida, cai de volta na aula.
    const resolvido = resolverConteudo(
      { videoEmbed: 'https://player/aula' },
      { ...VINCULO, conteudoDoMaterial: true },
      { ...material, type: 'pdf' },
    )
    expect(resolvido.videoEmbed).toBe('https://player/aula')
    expect(resolvido.origem).toBe('aula')
  })

  it('material apagado não deixa o player vazio', () => {
    const resolvido = resolverConteudo(
      { videoEmbed: 'https://player/aula' },
      { ...VINCULO, conteudoDoMaterial: true },
      null,
    )
    expect(resolvido.videoEmbed).toBe('https://player/aula')
  })

  it('reconhece os dois tipos de vídeo do catálogo', () => {
    expect(ehMaterialDeVideo({ type: 'video' })).toBe(true)
    expect(ehMaterialDeVideo({ type: 'video_embed' })).toBe(true)
    expect(ehMaterialDeVideo({ type: 'pdf' })).toBe(false)
    expect(ehMaterialDeVideo(null)).toBe(false)
  })
})

describe('sentido inverso: o que a compra libera', () => {
  const aulas = [
    { titulo: 'A', vinculoMaterial: { ...VINCULO } },
    { titulo: 'B', vinculoMaterial: { ...VINCULO, liberaPorCompra: false } },
    { titulo: 'C', vinculoMaterial: { ...VINCULO, materialId: 'outro' } },
    { titulo: 'D' },
  ]

  it('lista só as aulas que a compra daquele material libera', () => {
    expect(aulasLiberadasPeloMaterial(aulas, 'mat-1').map((a) => a.titulo)).toEqual(['A'])
  })

  it('material sem aulas devolve lista vazia', () => {
    expect(aulasLiberadasPeloMaterial(aulas, 'inexistente')).toEqual([])
    expect(aulasLiberadasPeloMaterial(aulas, '')).toEqual([])
  })
})

describe('diagnóstico para o admin ver antes do aluno', () => {
  it('avisa quando o material vinculado sumiu', () => {
    const d = diagnosticarVinculo(VINCULO, null)
    expect(d.ok).toBe(false)
    expect(d.alerta).toContain('não existe mais')
  })

  it('avisa quando o material não é vídeo mas foi marcado como fonte', () => {
    const d = diagnosticarVinculo({ ...VINCULO, conteudoDoMaterial: true }, { title: 'Resumo', type: 'pdf' })
    expect(d.ok).toBe(false)
    expect(d.alerta).toContain('Resumo')
  })

  it('não reclama de vínculo saudável nem de aula sem vínculo', () => {
    expect(diagnosticarVinculo(VINCULO, { type: 'video_embed' }).ok).toBe(true)
    expect(diagnosticarVinculo(null, null).ok).toBe(true)
  })
})
