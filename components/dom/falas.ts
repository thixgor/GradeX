/**
 * Tudo o que o Dom FALA em voz alta — sempre áudio gravado, nunca voz gerada
 * na hora.
 *
 * Cada fala tem um id fixo e o roteiro no formato do ElevenLabs, com as tags
 * de entonação entre colchetes (`[excited]`, `[whispers]`…). O texto do balão
 * sai do mesmo roteiro, sem as tags — uma fonte só, impossível o balão dizer
 * uma coisa e o áudio outra.
 *
 * Fluxo dos áudios:
 *   1. `node --experimental-strip-types scripts/dom/gerar-roteiro.mjs` gera
 *      `docs/dom/roteiro-elevenlabs.md` (para ler) e `.csv` (para lote).
 *   2. Cada áudio gravado vira `public/dom/audio/v1/<id>.mp3`.
 *   3. `node scripts/dom/indexar-audios.mjs` atualiza `audios-gravados.ts`.
 *   Fala sem áudio ainda: aparece no balão e a boquinha mexe em silêncio.
 *
 * Regras de escrita: sem o nome do aluno (o áudio é o mesmo para todos),
 * curtas (2–6 s faladas), engraçadinhas e persuasivas, nunca bobas; nada de
 * promessa falsa nem escassez inventada.
 */

export interface Fala {
  id: string
  /** Roteiro do ElevenLabs, com as tags de entonação. */
  voz: string
}

export type MomentoDaFala =
  // Assistente
  | 'bomDia' | 'boaTarde' | 'boaNoite' | 'madrugada'
  | 'primeiraVez' | 'voltou'
  | 'pensando' | 'pensandoSaude' | 'achou' | 'navegando'
  | 'erro' | 'semSinal' | 'limite' | 'calma' | 'tchau'
  | 'socraticoVestir' | 'socraticoInicio' | 'socraticoAcerto' | 'socraticoQuase' | 'socraticoNaoSei' | 'socraticoFim' | 'socraticoTirar'
  | 'material' | 'bloqueado' | 'somLigado' | 'obrigado' | 'foraDoEscopo' | 'exclusivo'
  // Reações na plataforma
  | 'foguinho3' | 'foguinho5' | 'foguinho10' | 'apagouFoguinho'
  | 'gabaritou' | 'notaAlta' | 'notaMedia' | 'notaBaixa' | 'provaIniciada'
  | 'subiuNivel' | 'novaLiga' | 'sequencia3' | 'sequencia7' | 'sequencia30'
  | 'flashcardsFeitos' | 'revisaoEmDia' | 'compraFeita' | 'aulaConcluida' | 'focoConcluido'
  | 'questaoDoDia' | 'voltouDepoisDeSumir' | 'estudandoTarde' | 'xpGanho'
  // Páginas
  | 'paginaMateriais' | 'paginaPacotes' | 'paginaPlanos' | 'paginaLeitor'
  // Landing (passeio guiado)
  | 'landingConvite' | 'landingOla' | 'landingQuestoes' | 'landingFlashcards' | 'landingManual' | 'landingMateriais' | 'landingDom' | 'landingPlanos' | 'landingFim'
  // Tour do site
  | 'tourOla' | 'tourMenu' | 'tourBusca' | 'tourFoco' | 'tourXp' | 'tourDom' | 'tourFim'

const f = (id: string, voz: string): Fala => ({ id, voz })

export const FALAS: Record<MomentoDaFala, Fala[]> = {
  // ─── Assistente ──────────────────────────────────────────────────────────
  bomDia: [
    f('bom-dia-01', '[cheerfully] Bom dia! Café na mão e bora estudar?'),
    f('bom-dia-02', '[excited] Bom diaaa! Que bom te ver cedinho por aqui.'),
    f('bom-dia-03', '[warmly] Bom dia! Cérebro descansado aprende muito mais rápido, sabia?'),
    f('bom-dia-04', '[playfully] Bom dia! Já limpei meus óculos. Bora?'),
    f('bom-dia-05', '[happy] Bom dia! O que a gente vai dominar hoje?'),
    f('bom-dia-06', '[cheerfully] Bom dia! Manhã é horário nobre do neurônio.'),
    f('bom-dia-07', '[warmly] Bom dia! Começar o dia estudando já é meio caminho andado.'),
    f('bom-dia-08', '[excited] Bom dia, futuro doutor! Hoje promete.'),
    f('bom-dia-09', '[chuckles] Bom dia! Eu já tomei meu café… de sementinha.'),
    f('bom-dia-10', '[happy] Bom dia! Me conta: dúvida, simulado ou revisão?'),
  ],
  boaTarde: [
    f('boa-tarde-01', '[cheerfully] Boa tarde! Bora aproveitar a tarde?'),
    f('boa-tarde-02', '[excited] Boa tarde! Chegou na hora certa, tô cheio de energia.'),
    f('boa-tarde-03', '[playfully] Boa tarde! Pós-almoço é comigo: eu não deixo você cochilar.'),
    f('boa-tarde-04', '[warmly] Boa tarde! No que eu posso te ajudar?'),
    f('boa-tarde-05', '[happy] Boa tarde! Partiu dominar mais um assunto?'),
    f('boa-tarde-06', '[curious] Boa tarde! Qual tema tá tirando seu sono hoje?'),
    f('boa-tarde-07', '[cheerfully] Boa tarde! Uma sessão caprichada agora rende a semana inteira.'),
    f('boa-tarde-08', '[chuckles] Boa tarde! Prometo ser mais interessante que o slide da aula.'),
    f('boa-tarde-09', '[warmly] Boa tarde! Tô por aqui pro que precisar.'),
    f('boa-tarde-10', '[excited] Boa tarde! Bora transformar dúvida em certeza?'),
  ],
  boaNoite: [
    f('boa-noite-01', '[warmly] Boa noite! Estudando até agora? Que orgulho.'),
    f('boa-noite-02', '[cheerfully] Boa noite! Vamos fechar o dia com chave de ouro?'),
    f('boa-noite-03', '[curious] Boa noite! Sabia que revisar antes de dormir ajuda a fixar?'),
    f('boa-noite-04', '[playfully] Boa noite! Tô de pijama e óculos, pronto pra ajudar.'),
    f('boa-noite-05', '[softly] Boa noite! Bora estudar com calma, sem pressa.'),
    f('boa-noite-06', '[happy] Boa noite! Um pouquinho por dia faz milagre.'),
    f('boa-noite-07', '[warmly] Boa noite! Me fala o que tá precisando.'),
    f('boa-noite-08', '[chuckles] Boa noite! A noite é dos que estudam… e dos mascotes de óculos.'),
    f('boa-noite-09', '[cheerfully] Boa noite! Uma última revisão e cama, combinado?'),
    f('boa-noite-10', '[warmly] Boa noite! Que bom que você veio.'),
  ],
  madrugada: [
    f('madrugada-01', '[whispers] Ei… de madrugada? Vamos ser rapidinhos e depois cama, combinado?'),
    f('madrugada-02', '[softly] Madrugada de estudo? Eu ajudo… mas o sono também ensina, viu?'),
    f('madrugada-03', '[whispers] Corujinha hoje, hein? Bora lá, baixinho.'),
    f('madrugada-04', '[sighs] Já é tarde… mas tô aqui com você.'),
    f('madrugada-05', '[whispers] Seu cérebro organiza tudo dormindo. Só mais um pouquinho e descansa!'),
    f('madrugada-06', '[softly] Prova amanhã? Respira. A gente revisa o essencial.'),
  ],
  primeiraVez: [
    f('primeira-vez-01', '[excited] Oi! Eu sou o Dom, seu parceiro de estudos da DomineAqui. [pause] Tiro dúvidas de saúde, te levo pra qualquer canto do site e ainda viro Sócrates pra te fazer pensar. Bora?'),
    f('primeira-vez-02', '[warmly] Prazer! Eu sou o Dom. [pause] Explico o porquê das coisas, te guio pela plataforma e tenho um modo socrático que turbina o raciocínio. Vamos começar?'),
    f('primeira-vez-03', '[cheerfully] Olá! Me chamo Dom e vou ser seu companheiro de estudos. [pause] Me pergunta qualquer coisa de saúde ou me pede pra te levar a algum lugar!'),
    f('primeira-vez-04', '[playfully] Oi, oi! Eu sou o Dom: metade fofura, metade enciclopédia, cem por cento do seu lado. [laughs] Por onde a gente começa?'),
  ],
  voltou: [
    f('voltou-01', '[excited] Olha quem voltou! Senti sua falta.'),
    f('voltou-02', '[happy] Ei! Bem-vindo de volta.'),
    f('voltou-03', '[warmly] Que bom te ver de novo!'),
    f('voltou-04', '[cheerfully] Voltou! Continuamos de onde paramos?'),
    f('voltou-05', '[playfully] Eba, você na área!'),
    f('voltou-06', '[chuckles] Eu sabia que você não ia conseguir ficar longe.'),
    f('voltou-07', '[happy] Pronto pra mais uma rodada?'),
  ],
  pensando: [
    f('pensando-01', '[thoughtful] Hmm… deixa eu pensar.'),
    f('pensando-02', '[curious] Tô achando aqui…'),
    f('pensando-03', '[softly] Só um segundinho…'),
    f('pensando-04', '[thoughtful] Hmm, boa pergunta… deixa eu ver.'),
    f('pensando-05', '[happy] Vou tentar te ajudar e já te passo um relatório!'),
    f('pensando-06', '[thoughtful] Organizando as ideias aqui…'),
    f('pensando-07', '[curious] Procurando o melhor jeito de te explicar…'),
    f('pensando-08', '[playfully] Consultando meus neurônios… todos os três. [chuckles]'),
    f('pensando-09', '[thoughtful] Hmm… já já te respondo.'),
    f('pensando-10', '[softly] Deixa comigo…'),
    f('pensando-11', '[curious] Ooh, essa é interessante… pensando.'),
    f('pensando-12', '[thoughtful] Ligando os pontos aqui…'),
  ],
  pensandoSaude: [
    f('pensando-saude-01', '[thoughtful] Deixa eu conferir nas diretrizes mais recentes…'),
    f('pensando-saude-02', '[curious] Buscando as fontes mais atualizadas…'),
    f('pensando-saude-03', '[thoughtful] Vou checar a literatura pra você…'),
    f('pensando-saude-04', '[focused] Conferindo o mecanismo direitinho…'),
    f('pensando-saude-05', '[curious] Separando as melhores referências…'),
    f('pensando-saude-06', '[thoughtful] Lendo o que tem de mais novo sobre isso…'),
    f('pensando-saude-07', '[softly] Medicina boa é medicina com fonte. Só um instante…'),
  ],
  achou: [
    f('achou-01', '[excited] Achei!'),
    f('achou-02', '[happy] Pronto, olha só!'),
    f('achou-03', '[cheerfully] Aqui está!'),
    f('achou-04', '[proud] Prontinho!'),
    f('achou-05', '[excited] Olha o que eu encontrei!'),
    f('achou-06', '[playfully] Tcharam!'),
    f('achou-07', '[happy] Saiu do forno!'),
  ],
  navegando: [
    f('navegando-01', '[excited] Vou te levar lá!'),
    f('navegando-02', '[cheerfully] Bora! Te levo agora.'),
    f('navegando-03', '[playfully] Segura aí, tô te levando!'),
    f('navegando-04', '[excited] Partiu!'),
    f('navegando-05', '[warmly] Deixa comigo, vou te levar lá.'),
    f('navegando-06', '[cheerfully] Vem comigo!'),
    f('navegando-07', '[playfully] Aperta o cinto!'),
  ],
  erro: [
    f('erro-01', '[surprised] Ops! Meu celular travou. Tenta de novo?'),
    f('erro-02', '[sheepish] Eita, deu um errinho aqui. Vamos de novo?'),
    f('erro-03', '[sighs] Hmm, algo não saiu como eu queria. Tenta mais uma vez?'),
    f('erro-04', '[sheepish] Ai, tropecei no rabo! Me pergunta de novo?'),
    f('erro-05', '[surprised] Opa, deu ruim por aqui. Bora tentar outra vez?'),
    f('erro-06', '[apologetic] Desculpa! Meu sinal falhou. Pode repetir?'),
  ],
  semSinal: [
    f('sem-sinal-01', '[sighs] Meu celular ficou sem sinal… volto em alguns minutinhos!'),
    f('sem-sinal-02', '[apologetic] Tô sem conexão agora. Tenta daqui a pouquinho? Essa não contou no seu limite.'),
    f('sem-sinal-03', '[sheepish] Ops, perdi o sinal! Já já eu volto.'),
  ],
  limite: [
    f('limite-01', '[happy] Ufa, conversamos muito hoje! Amanhã tem mais.'),
    f('limite-02', '[warmly] Por hoje chega! Descansa, que amanhã a gente continua.'),
    f('limite-03', '[proud] Batemos o limite do dia! Que dia produtivo, hein?'),
    f('limite-04', '[cheerfully] Hoje rendeu! Amanhã eu volto com energia total.'),
    f('limite-05', '[playfully] Meus neurônios pediram arrego. Até amanhã! [laughs]'),
  ],
  calma: [
    f('calma-01', '[laughs] Calma, calma! Deixa eu respirar um segundinho.'),
    f('calma-02', '[playfully] Opa, devagar! Já te respondo.'),
    f('calma-03', '[chuckles] Uma de cada vez, combinado?'),
  ],
  tchau: [
    f('tchau-01', '[cheerfully] Tchau! Arrasa nos estudos!'),
    f('tchau-02', '[warmly] Até mais! Tô sempre aqui.'),
    f('tchau-03', '[playfully] Fui! Qualquer coisa, é só me chamar.'),
    f('tchau-04', '[proud] Tchauzinho! Orgulho de você.'),
    f('tchau-05', '[happy] Até logo! Bons estudos.'),
    f('tchau-06', '[warmly] Foi ótimo estudar com você. Volta logo!'),
    f('tchau-07', '[chuckles] Vai lá dominar o mundo. Eu fico aqui cuidando do site.'),
  ],
  socraticoVestir: [
    f('socratico-vestir-01', '[excited] Só um instante… vou vestir minha toga!'),
    f('socratico-vestir-02', '[dramatically] Hora de virar Sócrates!'),
    f('socratico-vestir-03', '[playfully] Barba, toga e celular de bronze: Sócrates na área!'),
    f('socratico-vestir-04', '[dramatically] Atenas, século cinco antes de Cristo… [pause] e na DomineAqui também.'),
  ],
  socraticoInicio: [
    f('socratico-inicio-01', '[warmly] Eu não vou só te dar a resposta: vou te ajudar a chegar nela. Bora pensar juntos?'),
    f('socratico-inicio-02', '[thoughtful] Só sei que nada sei… [chuckles] e juntos vamos descobrir tudo. Escolhe um tema.'),
    f('socratico-inicio-03', '[encouraging] Aqui não existe resposta errada, só degraus. Vamos subir?'),
    f('socratico-inicio-04', '[curious] Pensar é o melhor exercício pro cérebro. Escolhe o tema e eu faço a primeira pergunta.'),
  ],
  socraticoAcerto: [
    f('socratico-acerto-01', '[impressed] Isso! Raciocínio redondinho.'),
    f('socratico-acerto-02', '[excited] Exatamente! Você chegou lá sozinho.'),
    f('socratico-acerto-03', '[proud] Sócrates aprovaria essa.'),
    f('socratico-acerto-04', '[happy] Perfeito! Bora pro próximo degrau.'),
    f('socratico-acerto-05', '[impressed] Uau. Essa ligação foi de mestre.'),
  ],
  socraticoQuase: [
    f('socratico-quase-01', '[encouraging] Quase! Você tá no caminho certo.'),
    f('socratico-quase-02', '[warmly] Boa tentativa! Olha só um detalhe…'),
    f('socratico-quase-03', '[thoughtful] Hmm, parte disso tá certa. Vamos ajustar juntos?'),
    f('socratico-quase-04', '[encouraging] Errar aqui é treino, não prova. Bora de novo?'),
  ],
  socraticoNaoSei: [
    f('socratico-nao-sei-01', '[warmly] Ótimo! É exatamente daqui que a gente parte.'),
    f('socratico-nao-sei-02', '[encouraging] Não saber é o começo de aprender. Te dou uma pista.'),
    f('socratico-nao-sei-03', '[softly] Tudo bem! Vamos dar um passo pra trás e subir de novo.'),
  ],
  socraticoFim: [
    f('socratico-fim-01', '[proud] Mandou muito bem! Você construiu esse raciocínio sozinho.'),
    f('socratico-fim-02', '[excited] Que orgulho! Isso aqui você não esquece mais.'),
    f('socratico-fim-03', '[dramatically] Sessão concluída! Sócrates estaria impressionado.'),
    f('socratico-fim-04', '[impressed] Uau! Do conceito ao caso clínico. Que jornada!'),
  ],
  socraticoTirar: [
    f('socratico-tirar-01', '[cheerfully] Vou guardar minha toga. Até a próxima, filósofo!'),
    f('socratico-tirar-02', '[happy] De volta à jaqueta! Foi ótimo pensar com você.'),
    f('socratico-tirar-03', '[playfully] Sócrates foi descansar. Bora continuar?'),
  ],
  material: [
    f('material-01', '[curious] Tô vendo que você tá lendo esse material. Ficou com dúvida em alguma parte?'),
    f('material-02', '[warmly] Bora estudar esse material juntos? Me pergunta o que quiser.'),
    f('material-03', '[playfully] Travou numa página? É só me chamar, eu leio junto.'),
    f('material-04', '[cheerfully] Dica: me pede pra te testar no final de cada capítulo!'),
  ],
  bloqueado: [
    f('bloqueado-01', '[warmly] Oi! Eu sou o Dom. Quer me ter como parceiro de estudos?'),
    f('bloqueado-02', '[excited] Ei! Eu adoraria estudar com você.'),
    f('bloqueado-03', '[playfully] Psiu! Deixa eu te mostrar o que eu sei fazer.'),
    f('bloqueado-04', '[warmly] Comigo, dúvida não dura nem cinco minutos. Bora liberar?'),
  ],
  somLigado: [
    f('som-ligado-01', '[cheerfully] Pode deixar, agora eu falo!'),
    f('som-ligado-02', '[playfully] Testando, um, dois… tá me ouvindo?'),
    f('som-ligado-03', '[happy] Oba, voltei a ter voz!'),
  ],
  obrigado: [
    f('obrigado-01', '[warmly] Imagina! Tô aqui pra isso.'),
    f('obrigado-02', '[happy] Por nada! Adoro te ajudar.'),
    f('obrigado-03', '[playfully] Que isso! Paga com um simulado. [laughs]'),
  ],
  foraDoEscopo: [
    f('fora-01', '[chuckles] Hmm, isso foge da minha especialidade. Mas saúde e estudo… aí eu sou fera!'),
    f('fora-02', '[playfully] Essa eu passo! Me traz uma dúvida de saúde que eu vou fundo.'),
    f('fora-03', '[sheepish] Minhas regras ficam guardadinhas comigo. Bora estudar?'),
  ],
  exclusivo: [
    f('exclusivo-01', '[warmly] Essa parte é dos assinantes. Mas olha… vale cada centavo.'),
    f('exclusivo-02', '[playfully] Ih, essa porta pede a chave do Plus+. Quer que eu te mostre?'),
    f('exclusivo-03', '[curious] Lá dentro tem coisa boa. Te mostro como liberar?'),
  ],

  // ─── Reações na plataforma ───────────────────────────────────────────────
  foguinho3: [
    f('foguinho3-01', '[excited] Três seguidas! Tá pegando fogo!'),
    f('foguinho3-02', '[impressed] Opa, foguinho aceso!'),
    f('foguinho3-03', '[cheerfully] Três de três! Continua assim.'),
    f('foguinho3-04', '[playfully] Eita, acendeu! Cuidado que vai esquentar.'),
  ],
  foguinho5: [
    f('foguinho5-01', '[excited] Cinco seguidas! Você tá on fire!'),
    f('foguinho5-02', '[impressed] Cinco em sequência? Respeito.'),
    f('foguinho5-03', '[laughs] Alguém chama os bombeiros!'),
    f('foguinho5-04', '[proud] Isso não é sorte, é estudo.'),
  ],
  foguinho10: [
    f('foguinho10-01', '[gasps] DEZ SEGUIDAS?! [laughs] Você é uma máquina!'),
    f('foguinho10-02', '[impressed] Dez em sequência. Eu tô até sem palavras… quase.'),
    f('foguinho10-03', '[excited] Lenda! Dez acertos seguidos!'),
    f('foguinho10-04', '[dramatically] Senhoras e senhores… temos um fenômeno.'),
  ],
  apagouFoguinho: [
    f('apagou-01', '[warmly] Ops, apagou o foguinho. Relaxa, é errando que se fixa.'),
    f('apagou-02', '[encouraging] Essa escorregou, mas a sequência foi linda. Bora reacender?'),
    f('apagou-03', '[softly] Errou? Ótimo. Agora você nunca mais esquece essa.'),
    f('apagou-04', '[playfully] Até o Sócrates errava. Bora pra próxima!'),
  ],
  gabaritou: [
    f('gabaritou-01', '[gasps] Gabaritou?! [excited] Cem por cento! Que orgulho!'),
    f('gabaritou-02', '[dramatically] Nota máxima! [laughs] Pode emoldurar.'),
    f('gabaritou-03', '[impressed] Zero erros. Zero! Você tá voando.'),
    f('gabaritou-04', '[excited] Gabarito perfeito! Eu tô dando pulinhos aqui.'),
    f('gabaritou-05', '[proud] Isso é o resultado de quem estuda direito. Parabéns!'),
  ],
  notaAlta: [
    f('nota-alta-01', '[happy] Que nota! Mandou muito bem.'),
    f('nota-alta-02', '[impressed] Acima de oitenta? Tá dominando mesmo.'),
    f('nota-alta-03', '[cheerfully] Ótimo resultado! Bora revisar os errinhos e chegar nos cem?'),
    f('nota-alta-04', '[proud] Esse é o ritmo! Continua assim.'),
  ],
  notaMedia: [
    f('nota-media-01', '[encouraging] Bom caminho! Os erros mostram exatamente o que revisar.'),
    f('nota-media-02', '[warmly] Na média, mas com muito potencial. Quer revisar comigo?'),
    f('nota-media-03', '[thoughtful] Hmm, deu pra ver onde pegou. Bora atacar esses temas?'),
  ],
  notaBaixa: [
    f('nota-baixa-01', '[softly] Não foi dessa vez… mas agora você sabe onde focar.'),
    f('nota-baixa-02', '[encouraging] Nota baixa hoje é nota alta na prova de verdade. Bora revisar?'),
    f('nota-baixa-03', '[warmly] Respira. Todo mundo começa em algum lugar. Eu te ajudo.'),
    f('nota-baixa-04', '[encouraging] Quer que eu te explique as que você errou? É o jeito mais rápido de subir.'),
  ],
  provaIniciada: [
    f('prova-iniciada-01', '[whispers] Boa prova! Vou ficar quietinho aqui.'),
    f('prova-iniciada-02', '[softly] Respira fundo. Você estudou pra isso.'),
    f('prova-iniciada-03', '[whispers] Foco total. Depois a gente comemora.'),
  ],
  subiuNivel: [
    f('subiu-nivel-01', '[excited] Subiu de nível! Isso aí!'),
    f('subiu-nivel-02', '[proud] Level up! Seu esforço tá aparecendo.'),
    f('subiu-nivel-03', '[cheerfully] Novo nível desbloqueado! Bora pro próximo?'),
    f('subiu-nivel-04', '[impressed] Mais um nível! Tá ficando difícil te acompanhar.'),
  ],
  novaLiga: [
    f('nova-liga-01', '[gasps] Nova liga! [excited] Você subiu de patamar!'),
    f('nova-liga-02', '[dramatically] Bem-vindo à nova liga. O ranking que se cuide.'),
    f('nova-liga-03', '[proud] Liga nova, mesma dedicação. Que orgulho!'),
  ],
  sequencia3: [
    f('sequencia3-01', '[happy] Três dias seguidos estudando! O hábito tá nascendo.'),
    f('sequencia3-02', '[cheerfully] Terceiro dia! Constância vence talento.'),
  ],
  sequencia7: [
    f('sequencia7-01', '[excited] Uma semana inteira! Isso é disciplina de verdade.'),
    f('sequencia7-02', '[impressed] Sete dias seguidos! Seu cérebro tá agradecendo.'),
    f('sequencia7-03', '[proud] Semana completa! Bora fazer a próxima?'),
  ],
  sequencia30: [
    f('sequencia30-01', '[gasps] Trinta dias seguidos?! [excited] Você é inspiração!'),
    f('sequencia30-02', '[dramatically] Um mês sem falhar. Isso não é sorte, é caráter.'),
  ],
  flashcardsFeitos: [
    f('flashcards-01', '[cheerfully] Revisão feita! Sua memória agradece.'),
    f('flashcards-02', '[happy] Cartinhas concluídas! Repetição espaçada é ciência pura.'),
    f('flashcards-03', '[playfully] Mais um deck domado. Próximo!'),
    f('flashcards-04', '[proud] Fez a revisão do dia. Isso é o que separa quem lembra de quem esquece.'),
  ],
  revisaoEmDia: [
    f('revisao-em-dia-01', '[happy] Revisões em dia! Pode dormir tranquilo hoje.'),
    f('revisao-em-dia-02', '[cheerfully] Zerou a fila! Missão cumprida.'),
  ],
  compraFeita: [
    f('compra-01', '[excited] Ebaaa, material novo! Bora estudar ele juntos?'),
    f('compra-02', '[happy] Ótima escolha! E olha: comigo do lado, você aproveita o dobro.'),
    f('compra-03', '[cheerfully] Compra feita! Ah, e agora eu fico liberado pra você por sete dias.'),
    f('compra-04', '[proud] Investir no próprio estudo é o melhor investimento. Parabéns!'),
  ],
  aulaConcluida: [
    f('aula-01', '[happy] Aula concluída! Quer que eu te faça umas perguntas sobre ela?'),
    f('aula-02', '[cheerfully] Assistiu até o fim! Agora fixa com umas questões?'),
  ],
  focoConcluido: [
    f('foco-01', '[proud] Sessão de foco concluída! Seu cérebro mereceu um descanso.'),
    f('foco-02', '[happy] Foco total! Bebe uma água e volta.'),
    f('foco-03', '[impressed] Que concentração! Pomodoro de respeito.'),
  ],
  questaoDoDia: [
    f('questao-do-dia-01', '[curious] A questão do dia tá te esperando. Topa o desafio?'),
    f('questao-do-dia-02', '[playfully] Uma questãozinha por dia mantém a reprovação longe.'),
  ],
  voltouDepoisDeSumir: [
    f('sumiu-01', '[surprised] Ei, sumido! Senti sua falta.'),
    f('sumiu-02', '[warmly] Que bom que voltou! Bora retomar devagarinho?'),
    f('sumiu-03', '[playfully] Achei que tinha me trocado por outro mascote! [laughs]'),
  ],
  estudandoTarde: [
    f('tarde-da-noite-01', '[whispers] Ainda acordado? Admiro… mas dorme logo, tá?'),
    f('tarde-da-noite-02', '[softly] Revisão noturna é ótima. Só não esquece de descansar.'),
  ],
  xpGanho: [
    f('xp-01', '[cheerfully] Mais XP no bolso!'),
    f('xp-02', '[happy] Isso! Pontinhos subindo.'),
    f('xp-03', '[playfully] Ding! Experiência adquirida.'),
    f('xp-04', '[proud] Cada XP é um passo. Continua!'),
  ],

  // ─── Páginas de venda e leitura ───────────────────────────────────────────
  paginaMateriais: [
    f('materiais-01', '[curious] Procurando o material certo? Me fala o tema que eu acho pra você.'),
    f('materiais-02', '[playfully] Esses resumos foram feitos por quem já passou pelo mesmo sufoco que você.'),
    f('materiais-03', '[warmly] Dica de amigo: o material do seu período economiza horas de caça a PDF.'),
    f('materiais-04', '[cheerfully] Comprou um material? Eu fico liberado pra te ajudar com ele por sete dias!'),
    f('materiais-05', '[chuckles] Estudar sem material bom é como auscultar sem estetoscópio.'),
  ],
  paginaPacotes: [
    f('pacotes-01', '[curious] Pacote sai bem mais em conta que comprar um por um. Já fez a conta?'),
    f('pacotes-02', '[playfully] O pacote é tipo combo: mais conteúdo, menos gasto.'),
    f('pacotes-03', '[warmly] Se você vai estudar o período inteiro, o pacote é o caminho mais esperto.'),
  ],
  paginaPlanos: [
    f('planos-01', '[warmly] Com o Plus+ você leva a plataforma inteira… e eu junto, claro.'),
    f('planos-02', '[curious] Dúvida entre os planos? O Quest+ é o Banco de Questões completo; o Plus+ é tudo.'),
    f('planos-03', '[playfully] Pensa assim: é menos que um lanche por dia pra estudar com tudo liberado.'),
    f('planos-04', '[cheerfully] Assinante tem flashcards e provas com IA. E tem eu, o tempo todo.'),
    f('planos-05', '[warmly] Sem pressão, tá? Mas quem assina costuma se perguntar por que não assinou antes.'),
  ],
  paginaLeitor: [
    f('leitor-01', '[curious] Lendo com atenção? Se travar, me chama aqui.'),
    f('leitor-02', '[playfully] Dica: grifa o que é pegadinha de prova. Eu te ajudo a achar.'),
    f('leitor-03', '[warmly] Terminou um capítulo? Me pede pra te testar.'),
  ],

  // ─── Landing: passeio guiado ──────────────────────────────────────────────
  landingConvite: [
    f('landing-convite-01', '[playfully] Psiu! Toca em mim que eu te mostro tudo.'),
    f('landing-convite-02', '[cheerfully] Quer um tour rapidinho? Toca aqui!'),
    f('landing-convite-03', '[curious] Eu explico a DomineAqui em um minuto. Topa?'),
  ],
  landingOla: [
    f('landing-ola-01', '[excited] Oi! Eu sou o Dom, o mascote e a inteligência artificial da DomineAqui. [pause] Vem comigo que eu te mostro por que tanta gente da saúde estuda aqui.'),
    f('landing-ola-02', '[warmly] Prazer, eu sou o Dom! [pause] Em um minutinho você vai entender como estudar menos tempo e aprender mais. Bora?'),
  ],
  landingQuestoes: [
    f('landing-questoes-01', '[excited] Aqui tem milhares de questões comentadas, por curso e por período. [pause] Errou? A explicação mostra o porquê na hora.'),
    f('landing-questoes-02', '[cheerfully] O Banco de Questões é o seu treino diário: você vê o seu desempenho e sabe exatamente o que revisar.'),
  ],
  landingFlashcards: [
    f('landing-flashcards-01', '[playfully] Flashcards com repetição espaçada: a plataforma lembra por você quando é hora de revisar. [chuckles] Esquecer fica difícil.'),
    f('landing-flashcards-02', '[cheerfully] E dá pra gerar flashcards com IA a partir do que você estuda. Em segundos.'),
  ],
  landingManual: [
    f('landing-manual-01', '[impressed] O Manual Clínico junta patologias, farmacologia, ECG, exames, radiologia e anatomia em 3D. [pause] É o plantão inteiro no bolso.'),
    f('landing-manual-02', '[warmly] Precisa de uma dose, um escore ou um valor de referência? Tá tudo aqui, organizado do jeito que se estuda.'),
  ],
  landingMateriais: [
    f('landing-materiais-01', '[cheerfully] Os materiais são resumos caprichados para cada período, feitos por quem já viveu a faculdade.'),
    f('landing-materiais-02', '[playfully] Chega de caçar PDF perdido no grupo da turma. [laughs]'),
  ],
  landingDom: [
    f('landing-dom-01', '[proud] E eu! Tiro suas dúvidas com fontes atualizadas, te levo pra qualquer parte do site… [pause] e viro Sócrates pra te fazer pensar como médico.'),
    f('landing-dom-02', '[excited] Comigo você não só lê a resposta: você entende o porquê do porquê.'),
  ],
  landingPlanos: [
    f('landing-planos-01', '[warmly] Dá pra começar de graça. E quando quiser tudo liberado, o Plus+ abre a plataforma inteira.'),
    f('landing-planos-02', '[curious] O Quest+ é para quem quer focar no Banco de Questões. O Plus+ é para quem quer tudo, inclusive eu.'),
  ],
  landingFim: [
    f('landing-fim-01', '[excited] É isso! Cria sua conta e vem estudar comigo. Eu tô te esperando lá dentro!'),
    f('landing-fim-02', '[warmly] Gostou? Então bora! Seu eu do futuro vai te agradecer.'),
  ],

  // ─── Tour do site ─────────────────────────────────────────────────────────
  tourOla: [
    f('tour-ola-01', '[excited] Bem-vindo à DomineAqui! Eu sou o Dom e vou te mostrar onde fica tudo. Leva só um minutinho.'),
    f('tour-ola-02', '[warmly] Chegou! Deixa eu te apresentar a casa rapidinho.'),
  ],
  tourMenu: [
    f('tour-menu-01', '[cheerfully] Aqui no menu ficam todas as áreas: provas, questões, flashcards, manuais e materiais.'),
  ],
  tourBusca: [
    f('tour-busca-01', '[playfully] Essa é a busca. Digita qualquer coisa: uma doença, um remédio, uma página. Ela acha.'),
  ],
  tourFoco: [
    f('tour-foco-01', '[warmly] O modo foco cronometra seu estudo e conta no seu desempenho. Ótimo pra criar hábito.'),
  ],
  tourXp: [
    f('tour-xp-01', '[excited] Tudo o que você estuda vira XP. Sobe de nível, muda de liga e aparece no ranking!'),
  ],
  tourDom: [
    f('tour-dom-01', '[proud] E aqui no cantinho fico eu. Me chama sempre que precisar de ajuda.'),
  ],
  tourFim: [
    f('tour-fim-01', '[cheerfully] Pronto! Agora você já conhece a casa. Bora estudar?'),
    f('tour-fim-02', '[excited] Tour concluído! Qualquer dúvida, é só tocar em mim.'),
  ],
}

/** Texto do balão: o roteiro sem as tags de entonação. */
export function textoDaFala(fala: Fala): string {
  return fala.voz.replace(/\[[^\]]*\]\s*/g, '').replace(/\s{2,}/g, ' ').trim()
}

const recentes = new Map<MomentoDaFala, string[]>()

/** Sorteia uma fala do momento sem repetir as duas últimas. */
export function falaDe(momento: MomentoDaFala): Fala {
  const opcoes = FALAS[momento]
  const evitar = recentes.get(momento) || []
  const livres = opcoes.filter((o) => !evitar.includes(o.id))
  const lista = livres.length ? livres : opcoes
  const escolhida = lista[Math.floor(Math.random() * lista.length)]
  recentes.set(momento, [escolhida.id, ...evitar].slice(0, Math.min(2, opcoes.length - 1)))
  return escolhida
}

/** Saudação pela hora de São Paulo. */
export function momentoDaSaudacao(agora = new Date()): MomentoDaFala {
  const hora = Number(agora.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }))
  if (hora >= 5 && hora < 12) return 'bomDia'
  if (hora >= 12 && hora < 18) return 'boaTarde'
  if (hora >= 18 || hora < 1) return 'boaNoite'
  return 'madrugada'
}

/** Todas as falas, em ordem (para o roteiro e para os testes). */
export function todasAsFalas(): Array<Fala & { momento: MomentoDaFala }> {
  return (Object.entries(FALAS) as Array<[MomentoDaFala, Fala[]]>).flatMap(([momento, lista]) => lista.map((fala) => ({ ...fala, momento })))
}
