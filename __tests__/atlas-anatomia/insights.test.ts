import { describe, expect, it } from 'vitest'
import { ATLAS_SYSTEMS, flattenCollections, type AtlasMarker } from '@/lib/atlas-anatomia/catalogo'
import { getMarkerInsight } from '@/lib/atlas-anatomia/insights'
import { classificar } from '@/lib/atlas-anatomia/classes'
import { resolverRegiao } from '@/lib/atlas-anatomia/regioes'

interface Ocorrencia {
  sistema: string
  caminho: string[]
  prancha: string
  marcador: AtlasMarker
}

const OCORRENCIAS: Ocorrencia[] = ATLAS_SYSTEMS.flatMap(sistema =>
  flattenCollections(sistema.collections).flatMap(colecao =>
    (colecao.pieces || []).flatMap(peca =>
      peca.markers.map(marcador => ({
        sistema: sistema.slug,
        caminho: colecao.breadcrumb,
        prancha: peca.title,
        marcador,
      })),
    ),
  ),
)

function fichaDe(titulo: string) {
  const ocorrencia = OCORRENCIAS.find(item => item.marcador.title === titulo)
  if (!ocorrencia) throw new Error(`Marcador ausente no acervo: ${titulo}`)
  return getMarkerInsight(ocorrencia.marcador, {
    sistema: ocorrencia.sistema,
    caminho: ocorrencia.caminho,
    prancha: ocorrencia.prancha,
  })
}

describe('motor de conteúdo do Atlas de Anatomia', () => {
  it('entrega ficha completa para todos os marcadores do acervo', () => {
    expect(OCORRENCIAS).toHaveLength(2382)

    for (const { sistema, caminho, prancha, marcador } of OCORRENCIAS) {
      const ficha = getMarkerInsight(marcador, { sistema, caminho, prancha })

      // Selos são rótulos curtos; os demais campos são texto corrido e não
      // podem degenerar em uma frase solta. A ficha é o produto da seção.
      for (const campo of ['classe', 'regiao'] as const) {
        expect(ficha[campo].trim().length, `${marcador.title} · ${campo}`).toBeGreaterThan(3)
      }
      for (const campo of ['resumo', 'localizacao', 'funcao', 'clinica'] as const) {
        expect(ficha[campo].trim().length, `${marcador.title} · ${campo}`).toBeGreaterThan(28)
      }
      expect(ficha.pontos.length, marcador.title).toBeGreaterThanOrEqual(3)
    }
  })

  it('tem ficha própria para todas as estruturas do acervo, sem exceção', () => {
    // O texto de classe existe como rede de segurança para um marcador novo que
    // apareça no acervo, mas nenhuma estrutura de hoje deve cair nele: a
    // reclamação que motivou o dicionário atual era exatamente essa — dezenas de
    // estruturas lendo "órgão de uma cavidade corporal" em vez do que elas são.
    const semFicha = new Set(
      OCORRENCIAS.filter(
        ({ sistema, caminho, prancha, marcador }) =>
          !getMarkerInsight(marcador, { sistema, caminho, prancha }).aprofundado,
      ).map(item => item.marcador.title),
    )

    expect([...semFicha]).toEqual([])
  })

  it('nunca serve a irrigação da região no lugar da irrigação da estrutura', () => {
    // O erro que motivou esta trava: numa prancha do coração o acervo marca o
    // lobo superior do pulmão direito, e a ficha dele exibia as artérias
    // coronárias como vascularização — porque a região da prancha era "Coração".
    // O lobo pulmonar não vê uma coronária na vida. Ter ficha própria passou a
    // significar responder pela própria estrutura, inclusive no que se cala.
    const comVasosDaRegiao = new Set(
      OCORRENCIAS.filter(({ sistema, caminho, prancha, marcador }) => {
        const ficha = getMarkerInsight(marcador, { sistema, caminho, prancha })
        return ficha.aprofundado && ficha.vasosRegionais
      }).map(item => item.marcador.title),
    )

    expect([...comVasosDaRegiao]).toEqual([])
  })

  it('dá vasos e nervos próprios a toda estrutura que os tenha', () => {
    // Vaso e nervo são o que o estudante procura na ficha depois de saber o
    // nome. Onde a classe da estrutura prevê esses blocos, eles precisam existir
    // e ser dela — não do vizinho, não da prancha.
    const semVasos = new Set<string>()
    const semNervos = new Set<string>()

    for (const { sistema, caminho, prancha, marcador } of OCORRENCIAS) {
      const classe = classificar(marcador.title, sistema)
      const ficha = getMarkerInsight(marcador, { sistema, caminho, prancha })
      if (classe.mostraVasos && !ficha.vascularizacao) semVasos.add(marcador.title)
      if (classe.mostraNervos && !ficha.inervacao) semNervos.add(marcador.title)
    }

    expect([...semVasos]).toEqual([])
    expect([...semNervos]).toEqual([])
  })

  it('não repete o mesmo texto em estruturas que são coisas diferentes', () => {
    // Sobram grupos com texto igual, e são legítimos: o acervo escreve a mesma
    // peça de dois jeitos ("Traqueia" e "Traquéia", "Bexiga" e "Bexiga
    // Urinária", "Músculo Serrátil Posterior Superior" e "Afastamento do
    // Músculo Serrátil Posterior Superior"). Separar esses seria inventar uma
    // diferença que não existe. O que não pode voltar é o texto único servindo
    // estruturas de fato distintas — a valva e o óstio, o detrusor e a mucosa,
    // a pele e a fáscia peitoral.
    const porResumo = new Map<string, Set<string>>()
    for (const { sistema, caminho, prancha, marcador } of OCORRENCIAS) {
      const ficha = getMarkerInsight(marcador, { sistema, caminho, prancha })
      const grupo = porResumo.get(ficha.resumo) || new Set<string>()
      grupo.add(marcador.title)
      porResumo.set(ficha.resumo, grupo)
    }

    const compartilhados = [...porResumo.values()].filter(grupo => grupo.size > 1)
    const titulos = new Set(compartilhados.flatMap(grupo => [...grupo]))

    // Eram 143 grupos e 328 títulos antes da separação.
    expect(compartilhados.length).toBeLessThanOrEqual(81)
    expect(titulos.size).toBeLessThanOrEqual(173)
  })

  it('separa as estruturas que só pareciam a mesma coisa', () => {
    // Cada par abaixo dividia uma única ficha e é, de fato, duas coisas: o
    // aparelho valvar e o buraco que ele guarda; o músculo da bexiga e a mucosa
    // que o forra; a pele da mama e a fáscia sob ela; o rim direito e o
    // esquerdo, cujas veias têm comprimentos e destinos diferentes.
    const paresQuePrecisamDiferir: Array<[string, string]> = [
      ['Valva Atrioventricular Direita (Tricúspide)', 'Óstio Atrioventricular Direito'],
      ['Válvula Atrioventricular Esquerda', 'Óstio Atrioventricular Esquerdo'],
      ['Músculo Detrusor da Bexiga', 'Túnica Mucosa'],
      ['Pele', 'Fáscia Peitoral'],
      ['Veia Renal Direita', 'Veia Renal Esquerda'],
      ['Glândula Suprarrenal Direita', 'Glândula Suprarrenal Esquerda'],
      ['Testículo Direito', 'Testículo Esquerdo'],
      ['Cabeça do Epidídimo', 'Cauda do Epidídimo'],
      ['Corpo da Língua', 'Raiz da Língua'],
      ['Lábio Superior', 'Lábio Inferior'],
      ['Prega Vocal', 'Glote'],
      ['Piloro', 'Esfíncter Pilórico'],
      ['Canal Vertebral', 'Forame Vertebral'],
      ['Hemisfério Cerebelar Direito', 'Hemisfério Cerebelar Esquerdo'],
      ['Corpo do Útero', 'Cavidade do Útero'],
      ['Quadrante Superior Medial', 'Quadrante Inferior Medial'],
    ]

    for (const [uma, outra] of paresQuePrecisamDiferir) {
      expect(fichaDe(uma).resumo, `${uma} e ${outra} não podem dividir a mesma ficha`).not.toBe(fichaDe(outra).resumo)
    }
  })

  it('entrega o gancho de memória na esmagadora maioria das estruturas', () => {
    const comGancho = OCORRENCIAS.filter(
      ({ sistema, caminho, prancha, marcador }) => getMarkerInsight(marcador, { sistema, caminho, prancha }).memoria,
    ).length

    // `memoria` é o que faz a estrutura grudar: o mnemônico, a imagem mental ou
    // o raciocínio que dispensa decorar. Só falta nas poucas fichas herdadas que
    // ainda não foram revisitadas.
    expect(comGancho / OCORRENCIAS.length).toBeGreaterThan(0.6)
  })

  it('não deixa uma ficha responder por estrutura que só parece com ela', () => {
    // O casamento por substring do dicionário antigo produzia absurdos: a ficha
    // do rim explicava a "Articulação Carpometacarpal do Polegar (entre o osso
    // trapézio e o **prim**eiro metacarpo)", a da ulna respondia pelo nervo
    // ulnar e a da fíbula descrevia o músculo fibular longo. Cada par abaixo
    // casava por conter o nome do outro, e não pode voltar a casar.
    const paresQueNaoPodemSeConfundir: Array<[string, string]> = [
      ['Rim', 'Articulação Carpometacarpal do Polegar (entre o osso trapézio e o primeiro metacarpo)'],
      ['Ulna', 'Nervo Ulnar'],
      ['Rádio', 'Artéria Radial'],
      ['Fíbula', 'Músculo Fibular Longo'],
      ['Tíbia', 'Músculo Tibial Anterior'],
      ['Escápula', 'Músculo Levantador da Escápula'],
      ['Língua', 'Veia Lingual Profunda'],
      ['Artéria Aorta', 'Arco da Aorta'],
      ['Osso Frontal', 'Sutura Frontal'],
    ]

    for (const [estrutura, impostor] of paresQueNaoPodemSeConfundir) {
      expect(fichaDe(estrutura).resumo, `${impostor} não pode herdar a ficha de ${estrutura}`).not.toBe(
        fichaDe(impostor).resumo,
      )
    }
  })

  it('escolhe a ficha certa quando o mesmo nome é coisa diferente em cada sistema', () => {
    // O acervo reaproveita nomes genéricos entre pranchas: "Margem Superior" é a
    // borda da escápula no esquelético e a borda do coração no circulatório.
    const escapula = getMarkerInsight(
      { title: 'Margem Superior', description: '', x: 0, y: 0, placement: '', color: '' },
      { sistema: 'esqueletico', caminho: ['Membro Superior', 'Cíngulo do Membro Superior'] },
    )
    const coracao = getMarkerInsight(
      { title: 'Margem Superior', description: '', x: 0, y: 0, placement: '', color: '' },
      { sistema: 'circulatorio', caminho: ['Coração'] },
    )

    expect(escapula.resumo).not.toBe(coracao.resumo)
    expect(escapula.resumo.toLowerCase()).toContain('escápula')
  })

  it('classifica praticamente todo marcador em uma família anatômica', () => {
    const semClasse = new Set(
      OCORRENCIAS.filter(
        ({ sistema, caminho, prancha, marcador }) =>
          getMarkerInsight(marcador, { sistema, caminho, prancha }).classeId === 'estrutura',
      ).map(item => item.marcador.title),
    )

    // Só devem sobrar aqui as legendas que não nomeiam estrutura nenhuma
    // ("Afastamento do Músculo…") e recortes topográficos como o trígono femoral.
    expect(semClasse.size).toBeLessThanOrEqual(6)
  })

  it('resolve a região pelo caminho da coleção, sem confundir palavras contidas', () => {
    // "antebraço" contém "braço": sem comparação por palavra inteira, toda a
    // coleção do antebraço herdaria a irrigação e a inervação do braço.
    expect(resolverRegiao('esqueletico', ['Membro Superior', 'Antebraço']).id).toBe('antebraco')
    expect(resolverRegiao('esqueletico', ['Membro Superior', 'Braço']).id).toBe('braco')
    expect(resolverRegiao('esqueletico', ['Membro Inferior', 'Perna']).id).toBe('perna')
    expect(resolverRegiao('esqueletico', ['Membro Inferior', 'Pé']).id).toBe('pe')
    expect(resolverRegiao('nervoso', ['Meninges']).id).toBe('meninges')
    expect(resolverRegiao('circulatorio', ['Coração']).id).toBe('coracao')
  })

  it('deduz a classe estrutural a partir da terminologia anatômica', () => {
    expect(classificar('Músculo Braquiorradial').id).toBe('musculo')
    expect(classificar('Artéria Radial').id).toBe('arteria')
    expect(classificar('Veia Cava Inferior').id).toBe('veia')
    expect(classificar('Nervo Mediano').id).toBe('nervo')
    expect(classificar('Forame Vertebral').id).toBe('passagem-ossea')
    expect(classificar('Processo Espinhoso').id).toBe('acidente-osseo')
    expect(classificar('Tendão do Músculo Flexor Longo do Hálux').id).toBe('tendao')
    expect(classificar('Ligamento Patelar').id).toBe('ligamento')
    // Sem pista no nome, o sistema do acervo evita o texto totalmente genérico.
    expect(classificar('Endocárdio', 'circulatorio').id).toBe('cardiaco')
    expect(classificar('Pulvinar do Tálamo', 'nervoso').id).toBe('snc')
  })

  it('traz conteúdo específico para as estruturas curadas', () => {
    const braquiorradial = fichaDe('Músculo Braquiorradial')
    expect(braquiorradial.aprofundado).toBe(true)
    expect(braquiorradial.inervacao).toContain('radial')

    const escafoide = fichaDe('Escafoide')
    expect(escafoide.clinica.toLowerCase()).toContain('tabaqueira')

    const ventriculoEsquerdo = fichaDe('Ventrículo Esquerdo')
    expect(ventriculoEsquerdo.classe).toBe('Câmara cardíaca')
    expect(ventriculoEsquerdo.vascularizacao).toBeTruthy()

    const espinhoso = fichaDe('Processo Espinhoso')
    expect(espinhoso.regiao).toBe('Coluna vertebral')
    expect(espinhoso.pontos.length).toBeGreaterThanOrEqual(3)

    // Estruturas que antes dividiam uma ficha de família agora têm a sua, com o
    // dado que só vale para elas.
    const vastoMedial = fichaDe('Músculo Vasto Medial')
    expect(vastoMedial.resumo).not.toBe(fichaDe('Músculo Reto Femoral').resumo)
    expect(vastoMedial.clinica.toLowerCase()).toContain('atrofi')

    const suturaSagital = fichaDe('Sutura Sagital')
    expect(suturaSagital.resumo).not.toBe(fichaDe('Sutura Coronal').resumo)
  })

  it('preserva a descrição original do acervo como nota, quando existe', () => {
    const comDescricao = OCORRENCIAS.find(item => (item.marcador.description || '').trim().length >= 12)
    if (!comDescricao) return

    const ficha = getMarkerInsight(comDescricao.marcador, {
      sistema: comDescricao.sistema,
      caminho: comDescricao.caminho,
      prancha: comDescricao.prancha,
    })
    expect(ficha.notaAcervo).toBe(comDescricao.marcador.description.trim())
  })
})
