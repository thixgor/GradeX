import type { EntradaDicionario } from './tipos'
import { DESDOBRAMENTOS } from './desdobramentos'
import { CRANIO_FACE } from './cranio-face'
import { CRANIO_BASE } from './cranio-base'
import { MANDIBULA } from './mandibula'
import { COLUNA_TORAX } from './coluna-torax'
import { COLUNA } from './coluna'
import { TORAX_OSSEO } from './torax-osseo'
import { MEMBRO_SUPERIOR } from './membro-superior'
import { CINGULO_SUPERIOR } from './cingulo-superior'
import { BRACO_COTOVELO } from './braco-cotovelo'
import { ANTEBRACO } from './antebraco'
import { MAO } from './mao'
import { MEMBRO_INFERIOR } from './membro-inferior'
import { CINGULO_INFERIOR } from './cingulo-inferior'
import { COXA_JOELHO } from './coxa-joelho'
import { PERNA_PE } from './perna-pe'
import { TRONCO } from './tronco'
import { DORSO_PAREDE } from './dorso-parede'
import { CARDIOVASCULAR } from './cardiovascular'
import { CORACAO } from './coracao'
import { NEURO } from './neuro'
import { NEURO_TELENCEFALO } from './neuro-telencefalo'
import { NEURO_TRONCO_CEREBELO } from './neuro-tronco-cerebelo'
import { NEURO_MEDULA_MENINGES } from './neuro-medula-meninges'
import { RESPIRATORIO } from './respiratorio'
import { RESPIRATORIO_VIAS } from './respiratorio-vias'
import { RESPIRATORIO_PULMOES } from './respiratorio-pulmoes'
import { DIGESTORIO } from './digestorio'
import { DIGESTORIO_ORAL } from './digestorio-oral'
import { DIGESTORIO_TUBO } from './digestorio-tubo'
import { DIGESTORIO_ANEXOS } from './digestorio-anexos'
import { UROGENITAL } from './urogenital'
import { URINARIO } from './urinario'
import { GENITAL_MASCULINO } from './genital-masculino'
import { GENITAL_FEMININO } from './genital-feminino'
import { FAMILIAS } from './familias'

export type { EntradaDicionario } from './tipos'

/**
 * Dicionário curado do Atlas de Anatomia.
 *
 * O acervo da UFJF entrega, para cada marcador, um nome e uma coordenada na
 * imagem. Tudo o que o estudante lê depois — o que a estrutura é, como achá-la
 * na peça, o que ela faz, quem a irriga e a inerva, quem ela toca e por que
 * isso reaparece na enfermaria — está escrito aqui, uma estrutura de cada vez.
 *
 * A divisão em arquivos é por região de estudo, não por sistema do acervo, e a
 * razão é prática: quem abre o punho quer o rádio, o escafoide, o retináculo
 * dos flexores e o nervo mediano na mesma leitura, e esses quatro moram em
 * quatro sistemas diferentes do catálogo. Escrever a região inteira num arquivo
 * só é o que mantém as fichas vizinhas coerentes entre si.
 *
 * `FAMILIAS` vem por último de propósito: são as fichas de família, casadas por
 * conteúdo (`contem`) e não por título exato, e só devem responder quando
 * nenhuma ficha específica reivindicou aquele nome.
 */
export const DICIONARIO: EntradaDicionario[] = [
  // Vem primeiro: no casamento exato vence a primeira entrada, e a ficha
  // específica precisa vencer a ficha de família que ainda cita o mesmo nome.
  ...DESDOBRAMENTOS,
  ...CRANIO_FACE,
  ...CRANIO_BASE,
  ...MANDIBULA,
  ...COLUNA_TORAX,
  ...COLUNA,
  ...TORAX_OSSEO,
  ...MEMBRO_SUPERIOR,
  ...CINGULO_SUPERIOR,
  ...BRACO_COTOVELO,
  ...ANTEBRACO,
  ...MAO,
  ...MEMBRO_INFERIOR,
  ...CINGULO_INFERIOR,
  ...COXA_JOELHO,
  ...PERNA_PE,
  ...TRONCO,
  ...DORSO_PAREDE,
  ...CARDIOVASCULAR,
  ...CORACAO,
  ...NEURO,
  ...NEURO_TELENCEFALO,
  ...NEURO_TRONCO_CEREBELO,
  ...NEURO_MEDULA_MENINGES,
  ...RESPIRATORIO,
  ...RESPIRATORIO_VIAS,
  ...RESPIRATORIO_PULMOES,
  ...DIGESTORIO,
  ...DIGESTORIO_ORAL,
  ...DIGESTORIO_TUBO,
  ...DIGESTORIO_ANEXOS,
  ...UROGENITAL,
  ...URINARIO,
  ...GENITAL_MASCULINO,
  ...GENITAL_FEMININO,
  ...FAMILIAS,
]
