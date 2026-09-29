import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { FONTES_LICENCIADAS } from '@/lib/acervos-licenciados'
import { estruturaPorId } from '@/lib/histologia-zoom/estruturas'
import { niveisResolvidos } from '@/lib/histologia-zoom/fonte-de-tiles'
import { laminasDoOrgao, orgaoPorId } from '@/lib/histologia-zoom/repositorio'
import { ACHADOS, achadoPorId } from '@/lib/histopatologia-zoom/achados'
import { CURADORIA } from '@/lib/histopatologia-zoom/curadoria'
import { DOENCAS } from '@/lib/histopatologia-zoom/doencas'
import { REFERENCIA_ABNT_LEEDS, RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import {
  LAMINAS_PATOLOGICAS,
  achadosDaLamina,
  anotacaoPatologica,
  marcacoesDaLamina,
  piramideAperio,
} from '@/lib/histopatologia-zoom/repositorio'
import type { AnotacaoPatologica } from '@/lib/histopatologia-zoom/tipos'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { consolidar } = require('../../scripts/histopatologia-zoom/consolidar-anotacoes.mjs')

describe('Histopatologia com Zoom — glossário e doenças', () => {
  it('glossário de achados: ids únicos e verbetes completos', () => {
    const ids = ACHADOS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of ACHADOS) {
      expect(a.resumo.length, a.id).toBeGreaterThan(40)
      for (const campo of ['comoReconhecer', 'mecanismo', 'significado', 'ondeOcorre', 'armadilhas'] as const) {
        expect(a[campo].length, `${a.id}.${campo}`).toBeGreaterThan(0)
      }
    }
  })

  it('cada doença aponta achados do glossário, um órgão normal com lâmina e tem ficha completa', () => {
    const ids = DOENCAS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of DOENCAS) {
      expect(orgaoPorId(d.orgao), `${d.id}: órgão ${d.orgao}`).toBeTruthy()
      expect(laminasDoOrgao(d.orgao).length, `${d.id}: sem lâmina normal`).toBeGreaterThan(0)
      const achados = d.achados.map((a) => a.achado)
      expect(new Set(achados).size, `${d.id}: achado repetido`).toBe(achados.length)
      for (const a of achados) expect(achadoPorId(a), `${d.id}: achado ${a}`).toBeTruthy()
      expect(d.achados.some((a) => a.tipo === 'especifico'), d.id).toBe(true)
      expect(d.achados.some((a) => a.tipo === 'geral'), d.id).toBe(true)
      expect(d.achados.some((a) => a.peso === 'criterio'), d.id).toBe(true)
      expect(d.patogenese.length, d.id).toBeGreaterThanOrEqual(3)
      expect(d.roteiro.length, d.id).toBeGreaterThanOrEqual(3)
      expect(d.diferenciais.length, d.id).toBeGreaterThanOrEqual(2)
      expect(d.comparacaoComNormal.length, d.id).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('Histopatologia com Zoom — lâminas e marcações', () => {
  it('o consolidado de anotações está atualizado', () => {
    const gerado = JSON.parse(
      readFileSync(path.join(process.cwd(), 'data', 'histopatologia-zoom', 'anotacoes.gerado.json'), 'utf8'),
    )
    expect(gerado).toEqual(consolidar())
  })

  it('toda lâmina curada pertence a uma doença conhecida e tem anotação conferida', () => {
    expect(LAMINAS_PATOLOGICAS.length).toBe(CURADORIA.length)
    for (const l of LAMINAS_PATOLOGICAS) {
      const a = anotacaoPatologica(l.slug)
      expect(a, `${l.slug} sem anotação`).toBeTruthy()
      expect(a!.revisao.conferencias, l.slug).toBeGreaterThanOrEqual(3)
      expect(a!.resumo.length, l.slug).toBeGreaterThan(40)
    }
  })

  it('marcações: verbete existe e coordenadas caem dentro da lâmina', () => {
    for (const l of LAMINAS_PATOLOGICAS) {
      const a = anotacaoPatologica(l.slug) as AnotacaoPatologica
      const altura = l.altura / l.largura
      const ids = a.marcacoes.map((m) => m.id)
      expect(new Set(ids).size, l.slug).toBe(ids.length)
      for (const m of a.marcacoes) {
        const ok = m.categoria === 'patologica' ? achadoPorId(m.estrutura) : estruturaPorId(m.estrutura)
        expect(ok, `${l.slug}/${m.id}: verbete ${m.estrutura}`).toBeTruthy()
        const pontos = m.marcas.flatMap((k) =>
          k.tipo === 'seta' ? [k.ponta] : k.tipo === 'contorno' ? k.pontos : [k.centro],
        )
        for (const [x, y] of pontos) {
          expect(x, `${l.slug}/${m.id}`).toBeGreaterThanOrEqual(0)
          expect(x, `${l.slug}/${m.id}`).toBeLessThanOrEqual(1)
          expect(y, `${l.slug}/${m.id}`).toBeGreaterThanOrEqual(0)
          expect(y, `${l.slug}/${m.id}`).toBeLessThanOrEqual(altura)
        }
      }
      // Resolvidas na ordem da interface: achados primeiro.
      const exibidas = marcacoesDaLamina(l.slug)
      expect(exibidas.length, l.slug).toBe(a.marcacoes.length)
    }
  })

  it('cada achado da doença tem veredito na lâmina, e o veredito é sustentado', () => {
    for (const l of LAMINAS_PATOLOGICAS) {
      const a = anotacaoPatologica(l.slug) as AnotacaoPatologica
      const doenca = DOENCAS.find((d) => d.id === l.doenca)!
      const declarados = new Set(a.achados.map((x) => x.achado))
      for (const d of doenca.achados) expect(declarados.has(d.achado), `${l.slug}: sem veredito para ${d.achado}`).toBe(true)
      for (const x of a.achados) expect(achadoPorId(x.achado), `${l.slug}: ${x.achado}`).toBeTruthy()

      const ids = new Set(a.marcacoes.map((m) => m.id))
      const referenciadas = new Set<string>()
      for (const x of achadosDaLamina(l.slug, doenca)) {
        for (const m of x.marcacoes ?? []) {
          expect(ids.has(m), `${l.slug}: ${x.achado} → ${m}`).toBe(true)
          referenciadas.add(m)
        }
        if (x.status === 'presente') {
          expect((x.marcacoes?.length ?? 0) > 0 || !!x.nota, `${l.slug}: ${x.achado} presente sem marca nem nota`).toBe(true)
        } else {
          expect(x.nota, `${l.slug}: ${x.achado} ${x.status} sem justificativa`).toBeTruthy()
        }
      }
      // Toda marcação patológica mostra algum achado declarado.
      for (const m of a.marcacoes.filter((k) => k.categoria === 'patologica')) {
        expect(referenciadas.has(m.id), `${l.slug}: marcação ${m.id} não sustenta nenhum achado`).toBe(true)
      }
      // O critério diagnóstico está presente — senão a lâmina não ensina a doença.
      const criterios = doenca.achados.filter((d) => d.peso === 'criterio').map((d) => d.achado)
      expect(
        a.achados.some((x) => criterios.includes(x.achado) && x.status === 'presente'),
        `${l.slug}: nenhum critério diagnóstico presente`,
      ).toBe(true)
      expect(a.marcacoes.filter((m) => m.categoria === 'patologica').length, l.slug).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('Histopatologia com Zoom — tiles e direitos', () => {
  it('pirâmide Aperio: níveis em potência de 2 até um único tile, URL de região', () => {
    const p = piramideAperio('/A/b c.svs', 22011, 15795, 20)
    const topo = p.niveis[p.niveis.length - 1]
    expect(topo.largura).toBe(22011)
    expect(topo.reducao).toBe(1)
    expect(p.niveis[0].nx).toBe(1)
    expect(p.niveis[0].ny).toBe(1)
    const n = niveisResolvidos(p)
    expect(n[n.length - 1].url(2, 3)).toBe('https://images.virtualpathology.leeds.ac.uk/A/b%20c.svs?1024+1536+512+512+1+90')
    expect(p.miniatura.url).toContain('?0+0+')
  })

  it('autorização de Leeds registrada e crédito de rodapé com referência ABNT', () => {
    const f = FONTES_LICENCIADAS.leeds
    expect(f.comprovante.versao).toBe('DOMAQ-LEEDS-VP-2026-001')
    expect(f.dominiosDeMidia).toContain('images.virtualpathology.leeds.ac.uk')
    expect(RODAPE_LEEDS).toContain('Leeds Virtual Pathology (University of Leeds)')
    expect(REFERENCIA_ABNT_LEEDS).toMatch(/^UNIVERSITY OF LEEDS\./)
  })
})
