# Jornada de perfil — voz (ElevenLabs v4) e música

A jornada de perfil (o modal que pergunta se a pessoa é estudante, residente ou
médico) tem uma narradora: a logo animada fala por um balão e, quando os áudios
estiverem no ar, pela voz — com uma música calma de fundo. Este arquivo é o
roteiro para gerar esses áudios.

Código: `lib/jornada/narracao.ts` (falas e legendas),
`components/jornada/use-som-da-jornada.ts` (voz, música, efeitos) e
`components/complete-profile-modal.tsx` (a jornada).

## Como gerar as falas

1. No ElevenLabs, abra **Text to Speech** e escolha o modelo **Eleven v4**
   (`eleven_v4`).
2. Escolha uma voz da **biblioteca** em português do Brasil, calorosa e jovem
   (voz de biblioteca soa mais estável no v4 do que voz desenhada). Use a
   **mesma voz** em todas as falas.
3. Ajustes: **Stability ≈ 0,40–0,50** (mais baixo = mais emoção; se alguma fala
   sair instável, suba um pouco) e **Similarity ≈ 0,75**. O v4 não usa "Style"
   nem "Speed". Idioma: **pt** (`language_code: "pt"`).
4. Cole cada roteiro abaixo **exatamente como está**, colchetes incluídos.
   - As palavras entre `[ ]` são *audio tags*: instruções de atuação, não são
     faladas. Ficam em inglês de propósito e valem até a próxima tag.
   - Não troque os colchetes por parênteses ou chaves: aí o modelo lê em voz alta.
   - As reticências e os travessões também são de propósito: dão as pausas.
5. Gere 2 ou 3 versões de cada fala e fique com a mais natural.
6. Baixe em **MP3 44,1 kHz, 128 kbps** e salve com o nome indicado em
   `public/audio/jornada/`.

## As falas

### 1. `boas-vindas.mp3`

_Tela de abertura (toca no primeiro toque da pessoa)_

```text
[warmly] Oi! Que bom ter você aqui. [pause] Em menos de um minuto a gente monta o seu perfil… [playful] e o DomineAqui passa a falar a sua língua.
```

### 2. `profissao.mp3`

_Passo 1 — escolher a profissão_

```text
[curious] Primeiro, me conta… [slightly pause] você é estudante, residente, ou já é médico?
```

### 3. `reacao-estudante.mp3`

_Logo depois de tocar em "Estudante"_

```text
[excited] Estudante! Boa! [warmly] Então eu separo o que cai no seu período.
```

### 4. `reacao-residente.mp3`

_Logo depois de tocar em "Residente"_

```text
[amazed] Residente! [softly] Plantão puxado, né? [warmly] Vou deixar tudo direto ao ponto pra você.
```

### 5. `reacao-medico.mp3`

_Logo depois de tocar em "Médico(a)"_

```text
[warmly] Doutor, doutora… [playful] seja muito bem-vindo. [pause] Consulta rápida, sem enrolação. Prometo.
```

### 6. `local.mp3`

_Passo — estado e WhatsApp_

```text
[friendly] Agora: de onde você é? [slightly pause] E deixa o seu WhatsApp… é por lá que eu aviso quando sai material novo.
```

### 7. `contexto-estudante.mp3`

_Passo — faculdade e período (estudante)_

```text
[curious] Qual é a sua faculdade… e em que período você está? [playful, whispering] Prometo não perguntar a nota da última prova.
```

### 8. `contexto-residente.mp3`

_Passo — área, ano, hospital e CRM (residente)_

```text
[thoughtful] Me conta a área, o ano e o hospital da residência… [slightly pause] e o seu CRM, pra fechar.
```

### 9. `contexto-medico.mp3`

_Passo — especialidade e CRM (médico)_

```text
[thoughtful] Qual é a sua especialidade? [slightly pause] E o seu CRM, pra completar o perfil.
```

### 10. `cpf.mp3`

_Passo — CPF_

```text
[calm, reassuring] Última coisa: o seu CPF. [softly] A gente só confere na Receita que é você… e ele não aparece pra mais ninguém.
```

### 11. `conclusao.mp3`

_Tela do troféu_

```text
[triumphant] Pronto! Perfil completo! [laughs] [warmly] Agora é com você… [pause] bora estudar?
```

## A música de fundo

- Arquivo: `public/audio/jornada/musica.mp3`.
- Calma, instrumental, sem voz: lo-fi suave, piano ambiente ou pads. Ela toca
  baixinha (16% do volume) e abaixa sozinha enquanto a voz fala.
- **Loop sem emenda** de 60 a 120 s, MP3 128 kbps (1–2 MB). Corte no tempo do
  compasso para o loop não "pular".
- Se quiser gerar no **ElevenLabs Music**, um prompt que funciona:

  ```text
  Calm lo-fi instrumental for a study app onboarding, soft felt piano, warm pads,
  gentle vinyl texture, 75 BPM, hopeful and relaxed, no vocals, seamless loop
  ```

## Ligar os áudios no site

Enquanto os arquivos não estão na pasta, a jornada **não pede** os MP3 ao
servidor: o balão escreve a fala e os efeitos sonoros (o "plim" dos pontos, a
fanfarra do troféu) são sintetizados no próprio navegador. Depois de subir os
arquivos, troque as chaves em `lib/jornada/narracao.ts`:

```ts
export const AUDIOS_PRONTOS = {
  voz: true,     // os 11 MP3 das falas
  musica: true,  // musica.mp3
}
```

Os MP3 em `public/` saem do CDN como arquivo estático — não passam por função
nem contam como Fast Origin Transfer.

## O que a pessoa controla

- Botão de som (alto-falante) no topo da jornada: liga e desliga voz e música
  juntas, e a escolha fica salva no aparelho.
- Nada toca antes do primeiro toque (regra dos navegadores). A boas-vindas toca
  nesse primeiro toque; reação e troféu nunca são cortados no meio.
- Com "reduzir movimento" ligado no sistema, confete, faíscas e luzes param;
  o som continua respeitando o botão.
