import { describe, expect, it } from 'vitest'
import { COMPARADORES } from '@/lib/semiologia/comparadores'
import { SINAIS } from '@/lib/semiologia/sinais'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { VISTAS } from '@/lib/semiologia/vistas'
import { nomeDoAlvo } from '@/lib/semiologia/alvo'
import { RESUMO_DA_SEMIOLOGIA } from '@/lib/semiologia/resumo'
import { MODULOS_DO_PACOTE } from '@/lib/manual-clinico/pacote'

/**
 * O que este arquivo protege.
 *
 * A landing de vendas mostra o acervo **por fora**: quantos sinais existem,
 * como se chamam, quantos sistemas cobrem. Duas coisas podem dar errado aí, e
 * nenhuma delas aparece no `tsc`.
 *
 * A primeira é vazamento: alguém acrescenta um campo ao resumo "para a vitrine
 * ficar mais rica" e leva junto o mecanismo, a conduta ou a armadilha — que é
 * exatamente o que está sendo vendido. O resumo é servido a visitante sem
 * conta, então o corpo da ficha não pode atravessá-lo por descuido.
 *
 * A segunda é desencontro de número: o cartão do pacote
 * (`lib/manual-clinico/pacote.ts`) é escrito à mão e a vitrine conta ao vivo.
 * Quando os dois discordam, discordam na mesma tela — o herói diz 343 e o
 * cartão logo abaixo diz 12, que foi o que aconteceu enquanto o acervo crescia.
 */
describe('resumo público da Semiologia', () => {
  it('leva os títulos de tudo, e a contagem bate com o acervo', () => {
    expect(RESUMO_DA_SEMIOLOGIA.titulosSinais).toHaveLength(SINAIS.length)
    expect(RESUMO_DA_SEMIOLOGIA.titulosVistas).toHaveLength(VISTAS.length)
    expect(RESUMO_DA_SEMIOLOGIA.titulosJanelas).toHaveLength(JANELAS_ULTRASSOM.length)
    expect(RESUMO_DA_SEMIOLOGIA.titulosComparadores).toHaveLength(COMPARADORES.length)
    expect(RESUMO_DA_SEMIOLOGIA.perguntasDosComparadores).toHaveLength(COMPARADORES.length)
    expect(RESUMO_DA_SEMIOLOGIA.sinais).toBe(SINAIS.length)
  })

  it('soma os sistemas até o total de sinais', () => {
    const soma = RESUMO_DA_SEMIOLOGIA.sistemas.reduce((total, s) => total + s.total, 0)
    expect(soma).toBe(SINAIS.length)
  })

  it('não carrega o corpo de nenhuma ficha', () => {
    const servido = JSON.stringify(RESUMO_DA_SEMIOLOGIA)
    for (const sinal of SINAIS) {
      // Trechos longos o bastante para não coincidirem por acaso com um título.
      expect(servido).not.toContain(sinal.mecanismo.slice(0, 40))
      expect(servido).not.toContain(sinal.definicao.slice(0, 40))
      expect(servido).not.toContain(sinal.significado.slice(0, 40))
    }
  })

  it('conta certo os sinais com desempenho publicado e com comparador', () => {
    expect(RESUMO_DA_SEMIOLOGIA.sinaisComDesempenho).toBe(
      SINAIS.filter((s) => s.desempenho?.length).length,
    )
    expect(RESUMO_DA_SEMIOLOGIA.sinaisComComparador).toBe(SINAIS.filter((s) => s.comparador).length)
  })
})

describe('o cartão da Semiologia no pacote', () => {
  it('anuncia os números que o acervo realmente tem', () => {
    const cartao = MODULOS_DO_PACOTE.find((m) => m.id === 'semiologia')
    expect(cartao).toBeDefined()

    const porRotulo = new Map(cartao!.numeros.map((n) => [n.r, Number(n.v.replace(/\D/g, ''))]))
    expect(porRotulo.get('sinais do exame físico')).toBe(RESUMO_DA_SEMIOLOGIA.sinais)
    expect(porRotulo.get('cenas normais e alteradas')).toBe(
      RESUMO_DA_SEMIOLOGIA.cenas + RESUMO_DA_SEMIOLOGIA.cenasUltrassom,
    )
    expect(porRotulo.get('janelas de exame e POCUS')).toBe(
      RESUMO_DA_SEMIOLOGIA.vistas + RESUMO_DA_SEMIOLOGIA.janelas,
    )
  })
})

/**
 * O nome do que a pessoa tentou abrir.
 *
 * É o que deixa a landing dizer "você tentou abrir **Sinal de Murphy**" em vez
 * de uma frase genérica, e ele nasce de um caminho que veio do middleware —
 * ou seja, de fora. Slug inventado tem de virar `null`, e não uma frase
 * montada a partir do endereço: anunciar o nome errado é pior do que não
 * anunciar nenhum.
 */
describe('nomeDoAlvo', () => {
  it('reconhece um sinal, uma vista, uma janela e um comparador', () => {
    const sinal = SINAIS[0]
    const vista = VISTAS[0]
    const janela = JANELAS_ULTRASSOM[0]
    const comparador = COMPARADORES[0]

    expect(nomeDoAlvo(`/manual-clinico/semiologia/sinais/${sinal.slug}`)).toBe(sinal.nome)
    expect(nomeDoAlvo(`/manual-clinico/semiologia/beira-leito/${vista.slug}`)).toBe(vista.nome)
    expect(nomeDoAlvo(`/manual-clinico/semiologia/ultrassom/${janela.slug}`)).toBe(janela.nome)
    expect(nomeDoAlvo(`/manual-clinico/semiologia/comparar/${comparador.slug}`)).toBe(comparador.titulo)
  })

  it('nomeia as seções e a raiz', () => {
    expect(nomeDoAlvo('/manual-clinico/semiologia/sinais')).toBe('Sinais do exame físico')
    expect(nomeDoAlvo('/manual-clinico/semiologia/ultrassom/')).toBe('Ultrassom à beira do leito')
    expect(nomeDoAlvo('/manual-clinico/semiologia')).toBeNull()
  })

  it('ignora o que não é do módulo, e slug que não existe', () => {
    expect(nomeDoAlvo('/manual-clinico/radiologia/raio-x/chestPA')).toBeNull()
    expect(nomeDoAlvo('/manual-clinico/semiologia/sinais/nao-existe')).toBeNull()
    expect(nomeDoAlvo('/manual-clinico/semiologia/inventada/coisa')).toBeNull()
    expect(nomeDoAlvo(undefined)).toBeNull()
    expect(nomeDoAlvo('')).toBeNull()
  })

  it('descarta a query antes de procurar o slug', () => {
    const vista = VISTAS[0]
    expect(nomeDoAlvo(`/manual-clinico/semiologia/beira-leito/${vista.slug}?cena=alguma`)).toBe(vista.nome)
  })
})
