/**
 * O repertório falado do Dom. Cada momento tem várias versões e o sorteio
 * evita repetir as últimas — ouvir a mesma frase toda vez é o que faz um
 * mascote parecer robô. `{nome}` vira o primeiro nome do aluno.
 *
 * Frases curtas de propósito: são faladas em voz alta e aparecem no balão.
 */

export type MomentoDaFala =
  | 'bomDia'
  | 'boaTarde'
  | 'boaNoite'
  | 'madrugada'
  | 'primeiraVez'
  | 'voltou'
  | 'pensando'
  | 'pensandoSaude'
  | 'achou'
  | 'navegando'
  | 'erro'
  | 'semSinal'
  | 'limite'
  | 'calma'
  | 'tchau'
  | 'socraticoVestir'
  | 'socraticoInicio'
  | 'socraticoFim'
  | 'socraticoTirar'
  | 'material'
  | 'bloqueado'
  | 'ouvindo'
  | 'obrigado'

export const FALAS: Record<MomentoDaFala, string[]> = {
  bomDia: [
    'Bom dia, {nome}! Café na mão e bora estudar?',
    'Bom diaaa, {nome}! Que bom te ver cedinho por aqui.',
    'Bom dia, {nome}! Cérebro fresquinho é o melhor pra aprender.',
    'Opa, bom dia, {nome}! Hoje vai ser produtivo, eu sinto.',
    'Bom dia, {nome}! Já separei meus óculos pra gente estudar.',
    'Bom dia, {nome}! O que vamos dominar hoje?',
    'Bom dia, {nome}! Manhã é hora de neurônio animado.',
    'Bom dia! Que alegria começar o dia com você, {nome}.',
  ],
  boaTarde: [
    'Boa tarde, {nome}! Bora aproveitar a tarde?',
    'Boa tarde, {nome}! Chegou na hora certa, tô cheio de energia.',
    'Ei, boa tarde, {nome}! O que você quer aprender agora?',
    'Boa tarde, {nome}! Que tal uma sessão de estudo caprichada?',
    'Boa tarde, {nome}! Pós-almoço é comigo: eu te mantenho acordado.',
    'Boa tarde, {nome}! Tô por aqui pro que precisar.',
    'Opa, boa tarde, {nome}! Me conta, no que eu te ajudo?',
    'Boa tarde, {nome}! Partiu dominar mais um assunto?',
  ],
  boaNoite: [
    'Boa noite, {nome}! Estudando até agora? Que orgulho!',
    'Boa noite, {nome}! Vamos fechar o dia com chave de ouro?',
    'Boa noite, {nome}! Revisão noturna fixa melhor, sabia?',
    'Ei, boa noite, {nome}! No que eu posso te ajudar?',
    'Boa noite, {nome}! Bora estudar com calma e sem pressa.',
    'Boa noite, {nome}! Tô aqui de pijama e óculos, pronto pra ajudar.',
    'Boa noite, {nome}! Me fala o que tá precisando.',
    'Boa noite, {nome}! Um pouquinho por dia faz milagre.',
  ],
  madrugada: [
    'Uau, {nome}, de madrugada? Vamos ser rápidos e depois cama, combinado?',
    'Madrugada de estudo, {nome}? Te ajudo, mas o sono também ensina!',
    'Oi, {nome}! Corujinha hoje, né? Bora lá.',
    'Ei, {nome}, já é tarde! Mas tô aqui com você.',
    'Madrugada, {nome}? Seu cérebro consolida tudo dormindo, viu?',
  ],
  primeiraVez: [
    'Oi, {nome}! Eu sou o Dom, seu parceiro de estudos da DomineAqui. Posso tirar dúvidas, te levar a qualquer canto do site e até virar Sócrates pra te fazer pensar. Vamos nessa?',
    'Prazer, {nome}! Eu sou o Dom. Tiro suas dúvidas de saúde, te guio pela plataforma e tenho um modo socrático que vai turbinar seu raciocínio. Bora começar?',
    'Olá, {nome}! Me chamo Dom e vou ser seu companheiro de estudos. Pergunta qualquer coisa de saúde ou me pede pra te levar a algum lugar!',
  ],
  voltou: [
    'Olha quem voltou! Senti sua falta, {nome}.',
    'Ei, {nome}! Bem-vindo de volta.',
    'Que bom te ver de novo, {nome}!',
    'Voltou, {nome}! Continuamos de onde paramos?',
    'Oi de novo, {nome}! Pronto pra mais uma?',
    'Eba, {nome} na área!',
  ],
  pensando: [
    'Hmm, deixa eu pensar…',
    'Estou achando aqui…',
    'Só um segundinho…',
    'Hmm, boa pergunta… deixa eu ver.',
    'Pensando com carinho…',
    'Procurando o melhor jeito de te explicar…',
    'Organizando as ideias aqui…',
    'Hmm… já já te respondo.',
    'Vou tentar te ajudar e já te passo um relatório!',
    'Consultando meus neurônios…',
  ],
  pensandoSaude: [
    'Deixa eu conferir nas diretrizes mais recentes…',
    'Buscando as fontes mais atualizadas…',
    'Hmm, vou checar a literatura pra você…',
    'Conferindo o mecanismo direitinho…',
    'Separando as melhores referências…',
    'Lendo rapidinho o que tem de mais novo…',
  ],
  achou: [
    'Achei!',
    'Pronto, olha só!',
    'Aqui está!',
    'Prontinho!',
    'Olha o que eu encontrei!',
    'Tcharam!',
  ],
  navegando: [
    'Vou te levar lá!',
    'Bora! Te levo agora.',
    'Segura aí, tô te levando!',
    'Partiu! Já te levo.',
    'Deixa comigo, vou te levar lá.',
    'Vem comigo!',
  ],
  erro: [
    'Ops! Meu celular travou. Tenta de novo?',
    'Eita, deu um errinho aqui. Vamos de novo?',
    'Hmm, algo não saiu como eu queria. Tenta mais uma vez?',
    'Ai, tropecei! Me pergunta de novo?',
    'Opa, deu ruim por aqui. Bora tentar outra vez?',
    'Desculpa! Meu sinal falhou. Pode repetir?',
  ],
  semSinal: [
    'Meu celular ficou sem sinal… volto em alguns minutinhos!',
    'Tô sem conexão agora. Tenta daqui a pouquinho?',
    'Ops, perdi o sinal! Essa não contou no seu limite.',
  ],
  limite: [
    'Ufa, conversamos muito hoje! Amanhã tem mais.',
    'Por hoje chega, {nome}! Descansa que amanhã a gente continua.',
    'Batemos o limite do dia! Que dia produtivo, hein?',
    'Hoje rendeu! Amanhã eu volto com energia total.',
  ],
  calma: [
    'Calma, calma! Deixa eu respirar um segundinho.',
    'Opa, devagar! Já te respondo.',
    'Uma de cada vez, {nome}!',
  ],
  tchau: [
    'Tchau, {nome}! Arrasa nos estudos!',
    'Até mais, {nome}! Tô sempre aqui.',
    'Fui! Qualquer coisa, é só me chamar.',
    'Tchauzinho, {nome}! Orgulho de você.',
    'Até logo! Bons estudos, {nome}.',
    'Beijo, {nome}! Volta logo.',
    'Até a próxima, {nome}! Foi ótimo estudar com você.',
  ],
  socraticoVestir: [
    'Só um instante… vou vestir minha toga!',
    'Hora de virar Sócrates!',
    'Deixa eu me arrumar… pronto, sou um filósofo!',
    'Toga, barba e celular de bronze: Sócrates na área!',
  ],
  socraticoInicio: [
    'Eu não vou só te dar a resposta: vou te ajudar a chegar nela. Bora pensar juntos?',
    'Só sei que nada sei… e juntos vamos descobrir tudo! Escolhe um tema.',
    'Lembre: não existe resposta errada aqui, só degraus. Vamos subir?',
    'Pensar é o melhor exercício pro cérebro. Escolhe o tema e eu começo com a primeira pergunta.',
  ],
  socraticoFim: [
    'Mandou muito bem! Você construiu esse raciocínio sozinho.',
    'Que orgulho, {nome}! Isso aqui você não esquece mais.',
    'Sessão concluída! Sócrates estaria impressionado.',
    'Uau, {nome}! Do conceito ao caso clínico. Que jornada!',
  ],
  socraticoTirar: [
    'Vou guardar minha toga. Até a próxima, filósofo!',
    'De volta à jaqueta! Foi ótimo pensar com você.',
    'Sócrates foi descansar. Bora continuar?',
  ],
  material: [
    'Tô vendo que você está lendo esse material. Ficou com dúvida em alguma parte?',
    'Bora estudar esse material juntos? Me pergunta o que quiser.',
    'Se travar em alguma página, é só me chamar!',
  ],
  bloqueado: [
    'Oi, {nome}! Eu sou o Dom. Quer me ter como parceiro de estudos?',
    'Ei, {nome}! Eu adoraria estudar com você.',
    'Oi, {nome}! Deixa eu te mostrar o que eu sei fazer.',
  ],
  ouvindo: [
    'Pode falar, tô ouvindo!',
    'Sou todo ouvidos!',
    'Manda ver!',
  ],
  obrigado: [
    'Imagina! Tô aqui pra isso.',
    'Por nada! Adoro te ajudar.',
    'Que isso, {nome}! Quando precisar, é só chamar.',
  ],
}

const recentes = new Map<MomentoDaFala, number[]>()

/** Sorteia uma fala do momento sem repetir as duas últimas. */
export function falaDe(momento: MomentoDaFala, nome = ''): string {
  const opcoes = FALAS[momento]
  const evitar = recentes.get(momento) || []
  let i = Math.floor(Math.random() * opcoes.length)
  for (let tentativa = 0; tentativa < 6 && evitar.includes(i) && opcoes.length > 2; tentativa++) {
    i = Math.floor(Math.random() * opcoes.length)
  }
  recentes.set(momento, [i, ...evitar].slice(0, 2))
  const texto = opcoes[i]
  return nome ? texto.replace(/\{nome\}/g, nome) : texto.replace(/,? ?\{nome\}/g, '').replace(/^\s*[,!]\s*/, '')
}

/** Saudação pela hora de São Paulo. */
export function momentoDaSaudacao(agora = new Date()): MomentoDaFala {
  const hora = Number(agora.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }))
  if (hora >= 5 && hora < 12) return 'bomDia'
  if (hora >= 12 && hora < 18) return 'boaTarde'
  if (hora >= 18 || hora < 1) return 'boaNoite'
  return 'madrugada'
}
