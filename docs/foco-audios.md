# Modo Foco — vozes (ElevenLabs v4)

O Modo Foco (`/foco`) funciona inteiro sem áudio: mostra a legenda de cada
fala e toca sinos sintetizados nas viradas de fase. Com estes 10 MP3 no ar, a
mesma voz da jornada de perfil passa a guiar o começo, a pausa, a volta, o fim,
a respiração e o aquecimento de atenção.

Código: `lib/foco/narracao.ts` (roteiros e legendas) e
`components/foco/som-do-foco.ts` (voz, sinos e som ambiente).

## Como gerar

Igual à jornada (`docs/jornada-voz-e-musica.md`): **Eleven v4**, **a mesma voz
da jornada**, Stability ≈ 0,40–0,50, Similarity ≈ 0,75, idioma **pt**. Cole os
roteiros exatamente como estão — as palavras entre `[ ]` são audio tags de
atuação, não são faladas.

As três falas da respiração (`resp-*`) precisam caber no tempo da fase: a
inspiração tem **2 s**, o complemento **1 s** e a expiração **6 s**. Gere
algumas versões e fique com as que caibam; se sobrar, a esfera continua no
ritmo e a voz termina por cima.

## As falas

### 1. `inicio.mp3`

_Ao começar um ciclo de foco_

```text
[calm] Respira fundo. [pause] Celular longe, uma coisa só na cabeça… [warmly] Bora. O tempo começa agora.
```

### 2. `metade.mp3`

_Na metade do ciclo (só nos ciclos de 50 min ou mais)_

```text
[softly] Metade do caminho. [pause] Segue firme.
```

### 3. `pausa.mp3`

_Ao terminar um ciclo (pausa curta)_

```text
[warmly] Pausa! [relieved] Levanta, bebe água, olha pra longe… [softly] nada de rede social. [playful] Eu te chamo na volta.
```

### 4. `pausa-longa.mp3`

_A cada 4 ciclos do Pomodoro_

```text
[proud] Quatro ciclos completos! [warmly] Agora sim: pausa longa. [pause] Merecida.
```

### 5. `volta.mp3`

_Quando a pausa termina_

```text
[energetic] Pausa acabou. [pause] Respira… e volta pro ciclo. [warmly] Você tá indo bem.
```

### 6. `fim.mp3`

_Ao encerrar a sessão_

```text
[triumphant] Sessão concluída! [pause] [curious] Antes de sair… o que ficou na sua cabeça? [softly] Escreve três coisas, de memória.
```

### 7. `resp-inspira.mp3`

_Respiração guiada — 1ª inspiração (2 s)_

```text
[calm, slowly] Inspira pelo nariz…
```

### 8. `resp-mais.mp3`

_Respiração guiada — 2ª inspiração curta (1 s)_

```text
[calm, softly] mais um pouco…
```

### 9. `resp-solta.mp3`

_Respiração guiada — expiração longa (6 s)_

```text
[calm, slowly, drawn out] e solta… devagar… pela boca.
```

### 10. `aquecimento.mp3`

_Ao abrir o aquecimento de atenção (zigue-zague)_

```text
[playful] Aquecimento de atenção. [pause] Olho no ponto… [excited] e toca quando ele ficar dourado!
```

## Tratamento antes de subir

O mesmo das falas da jornada — normalizar para −18 LUFS, aparar o silêncio das
pontas, mono 64 kbps:

```bash
ffmpeg -i entrada.mp3 -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-1.5:LRA=11" -ac 1 -c:a libmp3lame -b:a 64k public/audio/foco/<id>.mp3
```

Depois, em `lib/foco/narracao.ts`, troque `AUDIOS_DE_FOCO_PRONTOS` para `true`.
Enquanto estiver `false`, o site não pede os MP3 (nenhum 404 à toa).

## Som ambiente

Não precisa de arquivo: o ruído marrom e a chuva são gerados no navegador
(Web Audio), e o "Lo-fi" reaproveita a música da jornada
(`public/audio/jornada/musica.mp3`). A evidência de ruído de fundo para
atenção é mista — ajuda mais quem tem desatenção (Söderlund et al., 2010) —,
por isso é opção, e o padrão é silêncio.
