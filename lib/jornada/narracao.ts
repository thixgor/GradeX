/**
 * A voz da jornada de perfil — os roteiros que vão para o ElevenLabs (Eleven v4)
 * e as legendas que aparecem no balão da logo.
 *
 * Cada fala tem duas formas:
 *
 * - `roteiro`: o texto que se cola no ElevenLabs, com as *audio tags* do v4 entre
 *   colchetes (`[warmly]`, `[pause]`, `[laughs]`…). As tags vão em inglês — são
 *   instruções de atuação, não são lidas — e ficam antes das palavras que afetam;
 *   a emoção vale até a próxima tag. Nada de parênteses ou chaves: o modelo lê
 *   em voz alta o que estiver neles.
 * - `legenda`: a mesma frase sem as tags, que o balão escreve na tela. Ela vale
 *   sozinha: quem está com o som desligado (ou numa biblioteca) lê a fala.
 *
 * O passo a passo para gerar os áudios está em `docs/jornada-voz-e-musica.md`.
 * Os arquivos vão em `public/audio/jornada/<id>.mp3`; a música de fundo em
 * `public/audio/jornada/musica.mp3`.
 */

export type IdDaFala =
  | 'boas-vindas'
  | 'profissao'
  | 'reacao-estudante'
  | 'reacao-residente'
  | 'reacao-medico'
  | 'local'
  | 'contexto-estudante'
  | 'contexto-residente'
  | 'contexto-medico'
  | 'cpf'
  | 'conclusao'

export interface Fala {
  id: IdDaFala
  roteiro: string
  legenda: string
}

export const FALAS: Record<IdDaFala, Fala> = {
  'boas-vindas': {
    id: 'boas-vindas',
    roteiro:
      '[warmly] Oi! Que bom ter você aqui. [pause] Em menos de um minuto a gente monta o seu perfil… [playful] e o DomineAqui passa a falar a sua língua.',
    legenda: 'Oi! Que bom ter você aqui. Em menos de um minuto a gente monta o seu perfil — e o DomineAqui passa a falar a sua língua.',
  },
  profissao: {
    id: 'profissao',
    roteiro: '[curious] Primeiro, me conta… [slightly pause] você é estudante, residente, ou já é médico?',
    legenda: 'Primeiro, me conta: você é estudante, residente ou já é médico?',
  },
  'reacao-estudante': {
    id: 'reacao-estudante',
    roteiro: '[excited] Estudante! Boa! [warmly] Então eu separo o que cai no seu período.',
    legenda: 'Estudante! Boa! Então eu separo o que cai no seu período.',
  },
  'reacao-residente': {
    id: 'reacao-residente',
    roteiro: '[amazed] Residente! [softly] Plantão puxado, né? [warmly] Vou deixar tudo direto ao ponto pra você.',
    legenda: 'Residente! Plantão puxado, né? Vou deixar tudo direto ao ponto pra você.',
  },
  'reacao-medico': {
    id: 'reacao-medico',
    roteiro: '[warmly] Doutor, doutora… [playful] seja muito bem-vindo. [pause] Consulta rápida, sem enrolação. Prometo.',
    legenda: 'Doutor, doutora, seja muito bem-vindo. Consulta rápida, sem enrolação. Prometo.',
  },
  local: {
    id: 'local',
    roteiro:
      '[friendly] Agora: de onde você é? [slightly pause] E deixa o seu WhatsApp… é por lá que eu aviso quando sai material novo.',
    legenda: 'Agora: de onde você é? E deixa o seu WhatsApp — é por lá que eu aviso quando sai material novo.',
  },
  'contexto-estudante': {
    id: 'contexto-estudante',
    roteiro:
      '[curious] Qual é a sua faculdade… e em que período você está? [playful, whispering] Prometo não perguntar a nota da última prova.',
    legenda: 'Qual é a sua faculdade, e em que período você está? Prometo não perguntar a nota da última prova.',
  },
  'contexto-residente': {
    id: 'contexto-residente',
    roteiro: '[thoughtful] Me conta a área, o ano e o hospital da residência… [slightly pause] e o seu CRM, pra fechar.',
    legenda: 'Me conta a área, o ano e o hospital da residência — e o seu CRM, pra fechar.',
  },
  'contexto-medico': {
    id: 'contexto-medico',
    roteiro: '[thoughtful] Qual é a sua especialidade? [slightly pause] E o seu CRM, pra completar o perfil.',
    legenda: 'Qual é a sua especialidade? E o seu CRM, pra completar o perfil.',
  },
  cpf: {
    id: 'cpf',
    roteiro:
      '[calm, reassuring] Última coisa: o seu CPF. [softly] A gente só confere na Receita que é você… e ele não aparece pra mais ninguém.',
    legenda: 'Última coisa: o seu CPF. A gente só confere na Receita que é você — e ele não aparece pra mais ninguém.',
  },
  conclusao: {
    id: 'conclusao',
    roteiro: '[triumphant] Pronto! Perfil completo! [laughs] [warmly] Agora é com você… [pause] bora estudar?',
    legenda: 'Pronto! Perfil completo! Agora é com você — bora estudar?',
  },
}

/**
 * Quais arquivos já estão em `public/audio/jornada/`. Enquanto estiverem em
 * `false`, a jornada não pede o MP3 ao servidor (um 404 por fala, em todo
 * cadastro, à toa): o balão escreve a legenda e os efeitos sonoros sintetizados
 * continuam tocando. Subiu os arquivos? Troque para `true`.
 */
export const AUDIOS_PRONTOS = {
  voz: false,
  musica: false,
}

export const PASTA_DE_AUDIO = '/audio/jornada'
