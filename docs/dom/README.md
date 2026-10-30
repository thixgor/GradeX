# Dom — o assistente de IA e mascote da DomineAqui

## Quem pode usar a IA

Plus+, Quest+ (e admin) ou quem **comprou um material nos últimos 3 dias**
(compra paga; resgate pelo Plus+, entrega manual e troca não contam). Regra em
`lib/dom/acesso.ts`, janela em `DIAS_DE_ACESSO_POR_COMPRA` (`lib/dom/config.ts`).

O mascote (reações, guia da landing, tour, falas das vitrines) aparece para
todo mundo; só a conversa com a IA é restrita.

## Motores e limites

- **Gemini** primeiro (`gemini-3.5-flash-lite` → `gemini-flash-lite-latest` →
  `gemini-3.8-flash`), com as chaves do painel / `GEMINI_API_KEY`.
- **AI Gateway da Vercel** de reserva (`AI_GATEWAY_API_KEY`), quando o Gemini
  está no teto ou falha.
- Tetos padrão (todos trocáveis por variável de ambiente, ver `.env.example`):
  25 mensagens/pessoa/dia, 5/min; Gemini 900/dia e 12/min no total; Gateway
  300/dia; busca do Google (fontes) 8/pessoa e 350 no total por dia.

## Segurança

Guarda antes da IA (`lib/dom/guarda.ts`): injeção de prompt, extração do
prompt, troca de persona/jailbreak, abuso de tokens, carga codificada e uso
fora do propósito são barrados sem gastar token e viram incidente em
**/admin/dom** (e na trilha de segurança do painel). Três graves em 24 h
suspendem o Dom para a conta por 24 h. A saída é conferida contra um canário
por requisição (vazamento do prompt) e as falas do Dom no histórico são
assinadas (HMAC) — histórico forjado é descartado.

## Falas gravadas (ElevenLabs)

Nada é falado em tempo real: todo áudio é gravado.

1. Catálogo: `components/dom/falas.ts` (id + texto com tags de entonação).
2. Roteiro: `node --experimental-strip-types --no-warnings scripts/dom/gerar-roteiro.mjs`
   → `docs/dom/roteiro-elevenlabs.md` e `.csv` (marca o que já tem áudio).
3. Tratamento dos MP3 brutos: `node scripts/dom/tratar-audios.mjs <pasta>`
   (tira apito, apara pausas, suaviza a estridência, iguala o volume em
   −19 LUFS, põe um fundo grave e baixinho) → `public/dom/audio/v1/`.
4. Índice: `node scripts/dom/indexar-audios.mjs` → `components/dom/audios-gravados.ts`.

Fala sem áudio aparece só no balão, com a boca mexendo em silêncio. Para não
cansar, falas "baixas" (pensando, achei, vou te levar lá) tocam só às vezes e
com intervalo mínimo (`voz.ts`, parcimônia).

**Silenciar**: o Dom fala `desabilitado.mp3` e fica com fita na boca em todo
lugar onde aparece, até religar o som.

## Reações na plataforma

Qualquer tela chama `reagirDom(evento)` (`lib/dom/reacoes.ts`): foguinho de
acertos seguidos no Banco (3, 5, 10…), nota da prova (gabarito, alta, média,
baixa), subida de nível e de liga, compra, foco, aula, fim de revisão de
flashcards e marcos de dias seguidos. No máximo uma aparição a cada 25 s.

## Desenhos

Originais em `img/dom/`; versões enxutas e separadas em partes (cauda, celular)
geradas por `node scripts/dom/preparar-mascotes.mjs` em `public/dom/v1/`
(cache imutável — desenho novo vai para `v2/`).
