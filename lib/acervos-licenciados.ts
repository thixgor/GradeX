/**
 * Acervos de terceiros licenciados para a DomineAqui.
 *
 * ## Por que isto não mora dentro de um módulo
 *
 * As duas autorizações não são concedidas ao Manual de Semiologia: são
 * concedidas à **DomineAqui e a seus domínios e subdomínios**, e liberam o
 * acervo completo de cada fonte — o Radiopaedia fala em "compêndio completo […]
 * imagens, textos, casos, artigos e demais materiais educacionais"; o POCUS
 * Atlas, em "imagens, clipes de ultrassom, infográficos, textos e demais
 * materiais […] e projetos correlatos".
 *
 * Deixar esses termos dentro de `lib/semiologia/` descreveria mal o que eles
 * são e esconderia o alcance de quem for construir o próximo módulo: a
 * Radiologia tem uso óbvio para o acervo do Radiopaedia, e quem abrisse aquele
 * diretório não encontraria a autorização. Direitos de plataforma ficam na
 * raiz de `lib/`, onde qualquer módulo os encontra.
 *
 * ## O que mudou, e por que isto existe
 *
 * O módulo nasceu sem uma única fotografia. Não por escolha estética: acervo de
 * otoscopia, fundo de olho e POCUS é quase todo proprietário, e o pouco que é
 * aberto vem sob Creative Commons **NonCommercial** — incompatível com um
 * produto pago. A saída foi desenhar tudo (ver `esquemas.ts`), e a interface
 * dizia, honestamente, que os acervos de terceiros eram só referência externa
 * cuja licença o aluno deveria conferir antes de reutilizar.
 *
 * Duas autorizações escritas mudaram exatamente essa frase. **The POCUS Atlas**
 * e o **Radiopaedia.org** concederam exceção expressa à cláusula NonCommercial
 * das respectivas licenças, em favor da DomineAqui e de seus domínios e
 * subdomínios, permitindo indexar, reorganizar, traduzir, aprofundar e
 * **disponibilizar de forma paga** os conteúdos — imagens incluídas.
 *
 * ## Por que os termos moram em código, e não num PDF numa pasta
 *
 * Três coisas que um PDF arquivado não faz:
 *
 * 1. **O crédito não pode depender de alguém lembrar.** As duas autorizações
 *    exigem atribuição clara e permanente. Se o texto do crédito vive aqui e o
 *    rodapé o lê daqui, é impossível publicar uma página do módulo sem ele.
 * 2. **O escopo é território, não intenção.** Ambas as licenças valem para a
 *    DomineAqui e seus domínios. `hostAutorizado` transforma isso em checagem
 *    executável, para nenhuma mídia entrar por um host que a autorização não
 *    cobre.
 * 3. **A fronteira precisa estar escrita onde se programa.** O que a exceção
 *    cobre — e o que ela não cobre — é a informação que evita o erro caro. Ela
 *    está em `restricoes`, ao lado do código que serve a imagem, e não a três
 *    cliques de distância num contrato.
 *
 * ## A fronteira, em uma frase
 *
 * A exceção é **nossa**, não do conteúdo. Para qualquer terceiro, POCUS Atlas
 * segue CC BY-NC 4.0 e Radiopaedia segue CC BY-NC-SA 3.0. Nada aqui autoriza
 * redistribuir esse material para fora da plataforma, nem o transforma em
 * conteúdo aberto por termos passado por ele.
 */

export type FonteLicenciadaId =
  | 'pocus-atlas'
  | 'radiopaedia'
  | 'wikimedia-commons'
  | 'youtube'
  // Termo conjunto 1 (18/09/2026) — bibliotecas de ausculta.
  | 'littmann'
  | 'umich-heart-sounds'
  | 'thinklabs'
  | 'easyauscultation'
  | 'rale'
  // Termo conjunto 2 (18/09/2026) — atlas de imagem e vídeo.
  | 'dermnet'
  | 'atlas-dermatologico'
  | 'eyerounds'
  | 'retina-image-bank'
  | 'hawke-library'
  | 'gastrolab'
  | 'stanford-25'
  | 'neurosigns'

export interface FonteLicenciada {
  id: FonteLicenciadaId
  nome: string
  url: string
  titular: string
  /** Quem assina a autorização, do lado do licenciante. */
  signatarios: string[]
  /** A licença pública do acervo — a que vale para todo mundo que não é nós. */
  licencaBase: string
  /** O que a autorização acrescenta por cima dela. */
  excecao: string
  /**
   * O crédito exigido, no texto que a própria autorização sugere.
   *
   * Reproduzido literalmente de propósito: reescrever o crédito "para ficar
   * mais bonito" é a forma mais fácil de deixar de cumprir uma cláusula que foi
   * negociada palavra por palavra.
   */
  credito: string
  /** Versão curta, para selo e cabeçalho. */
  creditoCurto: string
  /** O que a autorização expressamente permite. */
  permissoes: string[]
  /** O que ela não cobre. */
  restricoes: string[]
  /** Hosts de onde a mídia desta fonte pode legitimamente vir. */
  dominiosDeMidia: string[]
  /** Procedência do documento que sustenta tudo isto. */
  comprovante: {
    arquivo: string
    versao?: string
    data: string
    sha256: string
  }
}


/**
 * Os dois termos conjuntos de 18 de setembro de 2026.
 *
 * Cada um é um único documento assinado por várias fontes ao mesmo tempo, com
 * as mesmas cláusulas para todas: indexar, traduzir, aprofundar e
 * disponibilizar de forma paga, com crédito à fonte (e ao autor, quando há) no
 * rodapé da seção ou em página dedicada; sem exclusividade, sem sublicenciar,
 * com remoção a pedido. Por isso as fontes de cada termo são montadas por uma
 * fábrica — a variação entre elas é só nome, signatário, licença pública e os
 * hosts de onde a mídia vem. O que difere de verdade entre os dois termos está
 * na cláusula 4.4 do primeiro: conteúdo acadêmico (Michigan, Manitoba) pode
 * carregar condições próprias de uso educacional, que a DomineAqui se
 * compromete a respeitar.
 */
const TERMO_CONJUNTO_1 = {
  arquivo: 'TermoCONJUNTO_Autorizacao_DomineAqui.pdf',
  data: '2026-09-18',
  sha256: '977a6c887dcb2bc0ec3264ee983442a5c4d0a3559f6cb6f880b761c39155194f',
}
const TERMO_CONJUNTO_2 = {
  arquivo: 'Termo_Autorizacao_Conjunta2_DomineAqui.pdf',
  data: '2026-09-18',
  sha256: 'f205e72540a242ae171f9abd19f788c9675ae071885628a320ed862db56f9358',
}

function fonteDoTermoConjunto(dados: {
  id: FonteLicenciadaId
  nome: string
  url: string
  titular: string
  signatarios: string[]
  licencaBase: string
  dominiosDeMidia: string[]
  comprovante: typeof TERMO_CONJUNTO_1
  /** Só no termo 1: condições acadêmicas a respeitar. */
  condicaoAcademica?: string
  /** O que a fonte tem: 'sons', 'imagens', 'vídeos'. Entra no crédito. */
  natureza: string
}): FonteLicenciada {
  const restricoes = [
    `A autorização vale apenas para a DomineAqui e seus domínios e subdomínios — para terceiros, o conteúdo segue exatamente a licença pública da fonte (${dados.licencaBase}).`,
    'Não autoriza sublicenciamento nem uso fora do contexto da plataforma.',
    'Qualquer adaptação preserva a precisão científica; a fonte pode pedir a remoção de material específico, e o pedido é atendido em prazo razoável.',
  ]
  if (dados.condicaoAcademica) restricoes.push(dados.condicaoAcademica)
  const dataPorExtenso = dados.comprovante.data.split('-').reverse().join('/')
  return {
    id: dados.id,
    nome: dados.nome,
    url: dados.url,
    titular: dados.titular,
    signatarios: dados.signatarios,
    licencaBase: dados.licencaBase,
    excecao:
      'Autorização escrita, não exclusiva e por prazo indeterminado, para indexar, organizar, traduzir, aprofundar e disponibilizar de forma paga os conteúdos, com crédito à fonte e ao autor quando identificado.',
    credito: `${dados.natureza} de ${dados.nome} (${dados.url.replace(/^https?:\/\//, '')}) — ${dados.titular}. Uso autorizado à DomineAqui por termo escrito de ${dataPorExtenso}.`,
    creditoCurto: `${dados.nome} · autorização para DomineAqui`,
    permissoes: [
      'Indexar e reorganizar o conteúdo de forma estruturada e didática em português brasileiro.',
      'Traduzir, adaptar e aprofundar textos, imagens, vídeos e áudios, mantendo a integridade científica.',
      'Disponibilizar o material em modelo pago (assinatura ou acesso premium), com os créditos mantidos.',
    ],
    restricoes,
    dominiosDeMidia: dados.dominiosDeMidia,
    comprovante: dados.comprovante,
  }
}

export const FONTES_LICENCIADAS: Record<FonteLicenciadaId, FonteLicenciada> = {
  'pocus-atlas': {
    id: 'pocus-atlas',
    nome: 'The POCUS Atlas',
    url: 'https://www.thepocusatlas.com',
    titular: 'The POCUS Atlas (Evidence Atlas App · The POCUS Atlas App)',
    signatarios: [
      'Dr. Michael Macias, MD — Fundador e Designer',
      'Dr. Matthew David Riscinti, MD — Co-fundador e Editor',
    ],
    licencaBase: 'Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
    excecao:
      'Exceção expressa à restrição NonCommercial, exclusivamente para a DomineAqui e seus domínios e subdomínios, permitindo a disponibilização paga do conteúdo.',
    credito:
      'Conteúdo baseado em / adaptado de The POCUS Atlas (thepocusatlas.com) — Fundadores: Dr. Michael Macias e Dr. Matthew David Riscinti. Licença CC BY-NC 4.0 com autorização específica para DomineAqui.',
    creditoCurto: 'The POCUS Atlas — Macias & Riscinti · CC BY-NC 4.0 com autorização para DomineAqui',
    permissoes: [
      'Indexar, organizar e estruturar o conteúdo de forma sistematizada em português brasileiro.',
      'Aprofundar, complementar e contextualizar os conteúdos educacionais originais.',
      'Disponibilizar o conteúdo, ou versões aprofundadas dele, de forma paga (assinatura, curso, acesso premium).',
      'Utilizar imagens, clipes de ultrassom, infográficos e textos do The POCUS Atlas, do Evidence Atlas e de projetos correlatos.',
    ],
    restricoes: [
      'A exceção vale apenas para a DomineAqui e seus domínios e subdomínios — para terceiros, permanece a CC BY-NC 4.0 integral.',
      'Qualquer aprofundamento deve preservar a precisão científica e não distorcer o material original.',
      'O crédito deve ser claro e permanente, sem ser excessivo ou intrusivo.',
      'Autorização não exclusiva e revogável por escrito em caso de descumprimento grave.',
    ],
    dominiosDeMidia: ['www.thepocusatlas.com', 'thepocusatlas.com', 'images.squarespace-cdn.com'],
    comprovante: {
      arquivo: 'Autorizacao_POCUS_Atlas_DomineAqui.pdf',
      data: '2026-09-13',
      sha256: 'dc87d7ca60c19d804b270a8d24de580e9968051784f9a2b57b696e3d019f8773',
    },
  },
  radiopaedia: {
    id: 'radiopaedia',
    nome: 'Radiopaedia.org',
    url: 'https://radiopaedia.org',
    titular: 'Radiopaedia Australia Pty Ltd (ACN 133 562 722) — © 2005–2026 Radiopaedia.org',
    signatarios: ['Dr. Frank Gaillard — Fundador e acionista majoritário'],
    licencaBase:
      'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 (CC BY-NC-SA 3.0)',
    excecao:
      'Exceção expressa e específica em favor da DomineAqui e de seus domínios e subdomínios, permitindo a utilização comercial (disponibilização paga) e a reorganização/tradução dos conteúdos.',
    credito:
      'Conteúdo baseado em / adaptado de materiais do Radiopaedia.org — © Radiopaedia Australia Pty Ltd',
    creditoCurto: 'Radiopaedia.org — © Radiopaedia Australia Pty Ltd · autorização para DomineAqui',
    permissoes: [
      'Indexar e reorganizar o compêndio completo de forma estruturada em português brasileiro.',
      'Aprofundar, expandir e enriquecer os conteúdos originais.',
      'Traduzir integral ou parcialmente os materiais para o português brasileiro.',
      'Disponibilizar o conteúdo resultante de forma paga.',
      'Utilizar imagens, textos, casos e artigos do acervo no âmbito da plataforma.',
    ],
    restricoes: [
      'A exceção vale apenas para a DomineAqui e seus domínios e subdomínios — para terceiros, permanece a CC BY-NC-SA 3.0.',
      'O crédito deve ser claro, porém não repetitivo ou excessivo, em local visível e permanente da seção.',
      'Qualquer alteração substancial das condições de uso deve ser formalizada por escrito.',
      // Registrado por ser o ponto em aberto do documento, e não uma permissão
      // presumida: a exceção nomeia uso comercial e reorganização/tradução e
      // silencia sobre a cláusula ShareAlike. Enquanto o silêncio não virar
      // texto, o conservador é não tratar o derivado como aberto.
      'A exceção nomeia uso comercial e tradução; não há menção expressa à cláusula ShareAlike — o derivado não é publicado como conteúdo aberto.',
    ],
    dominiosDeMidia: ['radiopaedia.org', 'prod-images-static.radiopaedia.org', 'images.radiopaedia.org'],
    comprovante: {
      arquivo: 'Autorizacao_Radiopaedia_DomineAqui.pdf',
      versao: '4.2',
      data: '2026-08-14',
      sha256: 'ba02a1bf22566ecd307dfab82c445703a307f2348d4865f46b4f3ebff2328659',
    },
  },
  /**
   * A terceira fonte é de outra natureza: não há autorização negociada, e sim
   * licença pública. Uma obra em domínio público ou sob Creative Commons
   * Attribution (sem NC, sem ND) já pode ser usada em produto pago por
   * qualquer um — o que ela exige é o crédito, imagem a imagem, com autor e
   * licença. Por isso o `credito` desta fonte é genérico e a obrigação real
   * mora no campo `autoria` de cada mídia, que a interface imprime junto à
   * imagem e que a curadoria preenche a partir dos metadados do Commons.
   *
   * Obras CC BY-SA entram com uma condição a mais: são exibidas **sem
   * modificação**. O ShareAlike só alcança obra derivada — recorte, anotação
   * por cima, montagem — e nada disso acontece aqui: a foto é servida como
   * está, com autor, licença e vínculo. O que fica de fora, por escolha: NC
   * (a plataforma é paga) e ND (a legenda traduzida já seria um limite
   * cinzento). Se uma obra dessas for a única disponível, a cena fica sem
   * foto — o módulo prefere a lacuna à licença errada.
   */
  'wikimedia-commons': {
    id: 'wikimedia-commons',
    nome: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org',
    titular: 'Autores individuais — obras em domínio público, CC0, Creative Commons Attribution ou Attribution-ShareAlike',
    signatarios: ['Não se aplica: licença pública. O autor de cada obra é identificado junto à própria imagem.'],
    licencaBase:
      'Domínio público, CC0, Creative Commons Attribution (CC BY) ou Attribution-ShareAlike (CC BY-SA), nas versões 2.0 a 4.0 — a licença exata de cada obra é a registrada ao lado dela',
    excecao:
      'Nenhuma é necessária. Licenças Attribution e Attribution-ShareAlike permitem uso comercial; obras em domínio público e CC0 não impõem condição. A obrigação é o crédito por imagem — e, nas BY-SA, exibir a obra sem modificação.',
    credito:
      'Fotografias clínicas de Wikimedia Commons (commons.wikimedia.org), em domínio público ou sob licença Creative Commons Attribution / Attribution-ShareAlike, exibidas sem modificação, com autor e licença indicados junto a cada imagem.',
    creditoCurto: 'Wikimedia Commons · autor e licença junto à imagem',
    permissoes: [
      'Exibir, legendar e contextualizar obras em domínio público, CC0, CC BY ou CC BY-SA, inclusive em produto pago.',
      'Reproduzir a obra sem modificação, com o crédito exigido pela licença: autor, licença e vínculo para a página original.',
    ],
    restricoes: [
      'Só entram obras em domínio público, CC0, CC BY ou CC BY-SA. Obras CC BY-NC e CC BY-ND não são usadas, mesmo quando são a única disponível.',
      'O crédito é por imagem e não pode ser omitido: cada mídia registra autor e licença no campo de autoria.',
      'A obra é exibida sem alteração de conteúdo. Nas CC BY-SA isso é condição, não preferência: recorte, anotação ou montagem sobre a foto seria obra derivada e teria de ser publicada sob a mesma licença.',
      'Para terceiros, cada obra segue exatamente a licença indicada junto a ela — o que a plataforma faz é cumprir essa licença, não substituí-la.',
    ],
    dominiosDeMidia: ['upload.wikimedia.org', 'thumb.wikimedia.org', 'commons.wikimedia.org'],
    comprovante: {
      arquivo: 'Creative Commons Attribution 4.0 International — texto legal (creativecommons.org/licenses/by/4.0/legalcode.txt)',
      data: '2026-09-14',
      sha256: '9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411',
    },
  },
  /**
   * O YouTube não é um acervo, e esta entrada não é uma autorização de uso do
   * conteúdo: o vídeo continua sendo do canal que o publicou. O que existe é a
   * licença que os Termos de Serviço do YouTube fazem cada usuário conceder aos
   * demais — reproduzir e **incorporar** o vídeo "conforme seja possível por um
   * recurso do Serviço". É por isso que a mídia deste tipo nunca é baixada nem
   * espelhada: fora do player do YouTube a licença não existe. O aluno vê o
   * player oficial, com o crédito do canal e o link para o vídeo; o dono pode
   * tirar o vídeo do ar quando quiser, e aí a cena volta a ser só esquema.
   */
  youtube: {
    id: 'youtube',
    nome: 'YouTube (vídeo incorporado)',
    url: 'https://www.youtube.com',
    titular: 'O canal que publicou cada vídeo — identificado junto ao player',
    signatarios: ['Não se aplica: licença dos Termos de Serviço do YouTube, concedida por cada usuário aos demais.'],
    licencaBase:
      'Termos de Serviço do YouTube, "Licença para outros usuários": reprodução e incorporação do vídeo por meio do player oficial, quando o canal permite incorporação',
    excecao:
      'Nenhuma. O vídeo não é copiado nem redistribuído — é exibido pelo player do YouTube, com o canal identificado e o vínculo para o vídeo original.',
    credito: 'Vídeo incorporado do YouTube — o canal e o vínculo para o vídeo original aparecem junto ao player. Direitos do respectivo canal.',
    creditoCurto: 'YouTube · canal identificado junto ao vídeo',
    permissoes: [
      'Incorporar o player oficial de vídeos cujo canal permite incorporação, inclusive em página de acesso pago.',
      'Indicar trecho (início e fim) e legendar o que o vídeo mostra, em português.',
    ],
    restricoes: [
      'A mídia nunca é baixada, espelhada, recortada ou reencodada: fora do player do YouTube não há licença.',
      'Só vídeos cujo canal permite incorporação (a API oEmbed confirma isso na curadoria).',
      'O vídeo pode ser removido pelo canal a qualquer momento; a cena então volta ao esquema.',
      'Para terceiros, cada vídeo segue os direitos do respectivo canal — a plataforma não os sublicencia.',
    ],
    dominiosDeMidia: ['www.youtube.com', 'youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'i.ytimg.com'],
    comprovante: {
      arquivo: 'Termos de Serviço do YouTube (youtube.com/t/terms, pt-BR), seção "Licença para outros usuários"',
      data: '2026-09-18',
      sha256: '5814c818f5429d3eb95b6d3401fe8cc7302b48c1159dacb21503e9910c353831',
    },
  },
  // ── Termo conjunto 1: ausculta ─────────────────────────────────────────────
  littmann: fonteDoTermoConjunto({
    id: 'littmann',
    nome: '3M Littmann (Solventum)',
    url: 'https://www.littmann.com',
    titular: '3M Littmann / Solventum',
    signatarios: ['Equipe comercial e educacional da Solventum'],
    licencaBase: 'Conteúdo proprietário da Solventum (todos os direitos reservados)',
    dominiosDeMidia: ['littmann.com', 'solventum.com', 'multimedia.3m.com'],
    comprovante: TERMO_CONJUNTO_1,
    natureza: 'Sons de ausculta',
  }),
  'umich-heart-sounds': fonteDoTermoConjunto({
    id: 'umich-heart-sounds',
    nome: 'UMich Heart Sound & Murmur Library',
    url: 'https://www.med.umich.edu/lrc/psb_open/html/repo/primer_heartsound/primer_heartsound.html',
    titular: 'University of Michigan Medical School',
    signatarios: ['Richard D. Judge, MD', 'Rajesh Mangrulkar, MD'],
    licencaBase: 'Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0) da biblioteca aberta da University of Michigan',
    dominiosDeMidia: ['med.umich.edu', 'umich.edu'],
    comprovante: TERMO_CONJUNTO_1,
    condicaoAcademica: 'Conteúdo acadêmico (cláusula 4.4): respeita-se a licença de uso educacional da University of Michigan, inclusive a atribuição a Judge e Mangrulkar em cada som.',
    natureza: 'Sons cardíacos e sopros',
  }),
  thinklabs: fonteDoTermoConjunto({
    id: 'thinklabs',
    nome: 'Thinklabs',
    url: 'https://www.thinklabs.com',
    titular: 'Thinklabs Medical LLC',
    signatarios: ['Clive Smith'],
    licencaBase: 'Conteúdo proprietário da Thinklabs (todos os direitos reservados)',
    dominiosDeMidia: ['thinklabs.com'],
    comprovante: TERMO_CONJUNTO_1,
    natureza: 'Sons de ausculta',
  }),
  easyauscultation: fonteDoTermoConjunto({
    id: 'easyauscultation',
    nome: 'EasyAuscultation (MedEdu)',
    url: 'https://www.easyauscultation.com',
    titular: 'MedEdu LLC',
    signatarios: ['Henry Blair / equipe MedEdu'],
    licencaBase: 'Conteúdo proprietário da MedEdu LLC (todos os direitos reservados)',
    dominiosDeMidia: ['easyauscultation.com', 'practicalclinicalskills.com'],
    comprovante: TERMO_CONJUNTO_1,
    natureza: 'Sons de ausculta cardíaca e pulmonar',
  }),
  rale: fonteDoTermoConjunto({
    id: 'rale',
    nome: 'R.A.L.E. Repository',
    url: 'https://www.rale.ca',
    titular: 'Respiratory Acoustics Laboratory, University of Manitoba / PixSoft Inc.',
    signatarios: ['H. Pasterkamp — Respiratory Acoustics Laboratory, University of Manitoba', 'PixSoft Inc.'],
    licencaBase: 'Conteúdo proprietário do R.A.L.E. Repository / PixSoft (todos os direitos reservados)',
    dominiosDeMidia: ['rale.ca'],
    comprovante: TERMO_CONJUNTO_1,
    condicaoAcademica: 'Conteúdo acadêmico (cláusula 4.4): respeitam-se as condições de uso educacional da University of Manitoba.',
    natureza: 'Sons respiratórios',
  }),
  // ── Termo conjunto 2: atlas de imagem e vídeo ──────────────────────────────
  dermnet: fonteDoTermoConjunto({
    id: 'dermnet',
    nome: 'DermNet NZ',
    url: 'https://dermnetnz.org',
    titular: 'DermNet New Zealand Trust',
    signatarios: ['Dr. Amanda Oakley / DermNet editorial team'],
    licencaBase: 'Creative Commons Attribution-NonCommercial-NoDerivatives 3.0 NZ (CC BY-NC-ND 3.0 NZ)',
    dominiosDeMidia: ['dermnetnz.org'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Fotografias dermatológicas',
  }),
  'atlas-dermatologico': fonteDoTermoConjunto({
    id: 'atlas-dermatologico',
    nome: 'Atlas Dermatológico',
    url: 'https://www.atlasdermatologico.com.br',
    titular: 'Prof. Samuel Freire da Silva',
    signatarios: ['Samuel Freire'],
    licencaBase: 'Conteúdo proprietário, de uso educacional gratuito (todos os direitos reservados ao autor)',
    dominiosDeMidia: ['atlasdermatologico.com.br'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Fotografias dermatológicas',
  }),
  eyerounds: fonteDoTermoConjunto({
    id: 'eyerounds',
    nome: 'EyeRounds (University of Iowa)',
    url: 'https://eyerounds.org',
    titular: 'University of Iowa Department of Ophthalmology and Visual Sciences',
    signatarios: ['University of Iowa / EyeRounds team'],
    licencaBase: 'Conteúdo proprietário da University of Iowa, de uso educacional (todos os direitos reservados)',
    dominiosDeMidia: ['eyerounds.org', 'webeye.ophth.uiowa.edu', 'uiowa.edu'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Fotografias e vídeos oftalmológicos',
  }),
  'retina-image-bank': fonteDoTermoConjunto({
    id: 'retina-image-bank',
    nome: 'Retina Image Bank',
    url: 'https://imagebank.asrs.org',
    titular: 'American Society of Retina Specialists (ASRS)',
    signatarios: ['American Society of Retina Specialists (ASRS)'],
    licencaBase: 'Conteúdo proprietário da ASRS e dos contribuidores (todos os direitos reservados)',
    dominiosDeMidia: ['imagebank.asrs.org', 'asrs.org'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Imagens de retina',
  }),
  'hawke-library': fonteDoTermoConjunto({
    id: 'hawke-library',
    nome: 'Hawke Library',
    url: 'https://www.hawkelibrary.com',
    titular: 'Dr. Michael Hawke',
    signatarios: ['Dr. Michael Hawke'],
    licencaBase: 'Conteúdo proprietário do Dr. Michael Hawke (todos os direitos reservados)',
    dominiosDeMidia: ['hawkelibrary.com'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Fotografias otoscópicas',
  }),
  gastrolab: fonteDoTermoConjunto({
    id: 'gastrolab',
    nome: 'Gastrolab',
    url: 'https://www.gastrolab.net',
    titular: 'Gastrolab — Prof. Dr. Hans T. R. Tytgat e equipe',
    signatarios: ['Prof. Dr. Hans T. R. Tytgat / equipe do Gastrolab'],
    licencaBase: 'Conteúdo proprietário do Gastrolab (todos os direitos reservados)',
    dominiosDeMidia: ['gastrolab.net'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Imagens e vídeos endoscópicos',
  }),
  'stanford-25': fonteDoTermoConjunto({
    id: 'stanford-25',
    nome: 'Stanford Medicine 25',
    url: 'https://stanfordmedicine25.stanford.edu',
    titular: 'Stanford Medicine — Dr. Abraham Verghese',
    signatarios: ['Stanford Medicine / Dr. Abraham Verghese'],
    licencaBase: 'Conteúdo proprietário da Stanford University (todos os direitos reservados)',
    dominiosDeMidia: ['stanfordmedicine25.stanford.edu', 'stanford.edu'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Fotografias e vídeos de exame físico',
  }),
  neurosigns: fonteDoTermoConjunto({
    id: 'neurosigns',
    nome: 'Neurosigns.org',
    url: 'https://www.neurosigns.org',
    titular: 'Neurosigns — Dr. Robert W. Baloh e equipe',
    signatarios: ['Dr. Robert W. Baloh / equipe Neurosigns'],
    licencaBase: 'Conteúdo proprietário do Neurosigns.org (todos os direitos reservados)',
    dominiosDeMidia: ['neurosigns.org'],
    comprovante: TERMO_CONJUNTO_2,
    natureza: 'Vídeos de sinais neurológicos',
  }),
}

export const LISTA_DE_FONTES: FonteLicenciada[] = [
  FONTES_LICENCIADAS['pocus-atlas'],
  FONTES_LICENCIADAS.radiopaedia,
  FONTES_LICENCIADAS['wikimedia-commons'],
  FONTES_LICENCIADAS.youtube,
  FONTES_LICENCIADAS.littmann,
  FONTES_LICENCIADAS['umich-heart-sounds'],
  FONTES_LICENCIADAS.thinklabs,
  FONTES_LICENCIADAS.easyauscultation,
  FONTES_LICENCIADAS.rale,
  FONTES_LICENCIADAS.dermnet,
  FONTES_LICENCIADAS['atlas-dermatologico'],
  FONTES_LICENCIADAS.eyerounds,
  FONTES_LICENCIADAS['retina-image-bank'],
  FONTES_LICENCIADAS['hawke-library'],
  FONTES_LICENCIADAS.gastrolab,
  FONTES_LICENCIADAS['stanford-25'],
  FONTES_LICENCIADAS.neurosigns,
]

/**
 * A frase que abre a página de créditos.
 *
 * Diz as duas coisas que o aluno precisa saber e que nenhuma das duas sozinha
 * responde: de onde vem a imagem que ele está vendo, e por que ela pode estar
 * num produto pago.
 */
export const CREDITO_BASE =
  'O Manual de Semiologia combina material próprio — todas as figuras esquemáticas são desenhadas por nós — com acervos de terceiros usados sob autorização escrita. Esta página registra a procedência de cada fonte, o que a autorização permite e o que ela não cobre.'

/** Aviso que acompanha qualquer mídia clínica real exibida no módulo. */
export const AVISO_EDUCACIONAL =
  'Imagens e clipes de casos reais têm finalidade exclusivamente educacional e não substituem avaliação clínica. A interpretação depende do contexto do paciente, da qualidade da aquisição e do exame completo.'

export function fonteLicenciada(id: FonteLicenciadaId): FonteLicenciada {
  return FONTES_LICENCIADAS[id]
}

/**
 * O host pode servir mídia desta fonte?
 *
 * Só HTTPS, e só host que a autorização cobre. A checagem vive aqui — junto dos
 * termos — e não no componente que desenha, porque quem ingere mídia precisa da
 * **mesma** regra: uma allowlist aplicada apenas na renderização deixa a URL
 * errada entrar no acervo e só falhar na frente do aluno.
 *
 * A comparação é por host exato ou por sufixo de domínio precedido de ponto:
 * `endsWith('radiopaedia.org')` sozinho aceitaria `naoradiopaedia.org`, que é
 * como allowlist vira convite.
 */
export function hostAutorizado(url: string, fonte: FonteLicenciada): boolean {
  let alvo: URL
  try {
    alvo = new URL(url)
  } catch {
    return false
  }
  if (alvo.protocol !== 'https:') return false
  const host = alvo.hostname.toLowerCase()
  return fonte.dominiosDeMidia.some(
    (permitido) => host === permitido.toLowerCase() || host.endsWith(`.${permitido.toLowerCase()}`),
  )
}

/** A URL é servível por alguma das fontes licenciadas? Devolve qual. */
export function fonteDaUrl(url: string): FonteLicenciada | null {
  return LISTA_DE_FONTES.find((fonte) => hostAutorizado(url, fonte)) ?? null
}
