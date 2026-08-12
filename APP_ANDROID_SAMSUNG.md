# App para Samsung / Android (PWA)

Antes desta entrega, a plataforma só ensinava a instalar o app em **iPhone**.
Quem abria num **Samsung** — o aparelho mais comum entre os alunos — não via
nada: nenhum convite, nenhuma instrução, nenhum botão. O site *era* instalável
(o manifest já existia), mas ninguém descobria sozinho.

Agora o Android é cidadão de primeira classe, com instalação de **um toque**
pelo diálogo nativo do sistema.

---

## O que mudou, em ordem de impacto

### 1. Convite de instalação que funciona no Android

`components/pwa/install-prompt.tsx` (substitui `pwa/ios-install-prompt.tsx`)

| Situação | O que a pessoa vê |
|---|---|
| Chrome, Samsung Internet 8+, Edge, Opera | Botão **Instalar agora** → diálogo nativo do Android |
| Samsung Internet antigo, Firefox Android | Passo a passo do menu **daquele** navegador |
| iPhone no Safari | Compartilhar → Adicionar à Tela de Início (como antes) |
| Já instalado / dispensado há menos de 21 dias | Nada |

A faixa não aparece em `/auth/*` (subiria por cima do botão de entrar), em
`/exam/*` (prova cronometrada), no leitor de PDF nem na própria `/instalar`. O
"agora não" do diálogo do sistema silencia igual ao X — quem recusou não é
perseguido de página em página. A chave antiga (`ios-install-dismissed-at`)
continua sendo respeitada, então quem já tinha fechado no iPhone não vê o
convite ressuscitar.

O texto se adapta ao aparelho: quem está num Galaxy lê *"Instale o DomineAqui
no seu Samsung"* — o código do modelo (`SM-…`) aparece no user agent de
qualquer navegador Android da Samsung.

### 2. A captura do evento acontece no `<head>`, não no React

Este é o detalhe que faz a diferença entre funcionar e não funcionar.

O Android dispara `beforeinstallprompt` logo depois do `load` — em geral
**antes** de o React hidratar. Um `addEventListener` dentro de `useEffect`
chega atrasado e perde o evento; é por isso que em tanto site o botão
"instalar" só aparece depois de um F5.

`SCRIPT_CAPTURA_INSTALACAO` (em `lib/pwa/instalacao.ts`) é injetado inline no
`<head>` pelo `app/layout.tsx`, chama `preventDefault()` (o que também impede a
mini-barra automática do Chrome de aparecer na hora errada) e guarda o evento
numa caixinha global. O hook `useInstalarApp` só se inscreve nela. Resultado: o
botão existe **na primeira visita**.

### 3. Ícones que o Android sabe desenhar

O Android não desenha o ícone como um quadrado: ele recorta com uma máscara —
**squircle no One UI da Samsung**, círculo no Pixel, gota d'água em outras
skins. A arte antiga era full-bleed e ia perder as bordas no recorte.

| Arquivo | Para quê |
|---|---|
| `icon-maskable-192/512.png` | Ícone adaptativo, logo dentro da *safe zone* de 80% |
| `icon-mono-512.png` | Ícone temático do Android 13+ / One UI 5+ (o launcher pinta com a cor do papel de parede) |
| `shortcuts/*.png` | 96×96, um por atalho do toque longo |

Gerados por `scripts/pwa/gerar-icones-android.py` a partir de
`public/icon-512.png`. Os PNGs são versionados — o build não depende do script.
Rode-o de novo só quando a arte-mãe mudar:

```bash
pip install pillow
python3 scripts/pwa/gerar-icones-android.py
```

### 4. Manifest completo (`app/manifest.ts`)

- `display_override: ['standalone', 'minimal-ui']` — rede de segurança para
  navegador que não suporta `standalone` não cair no modo com barra de endereço.
- `shortcuts` — toque longo no ícone abre **Provas, Questões, Flashcards e
  Cronograma**, cada um com seu ícone.
- `prefer_related_applications: false` — diz explicitamente que não existe app
  nativo na Play Store, para o Android não segurar o convite esperando um APK.
- Ícones `maskable` e `monochrome` separados dos `any`.

### 5. Modo offline

Um app instalado abre em tela cheia; sem rede, ele mostrava o **dinossauro do
Chrome** — o que parece a plataforma ter quebrado, não a internet ter caído.

`public/sw.js` agora guarda `/offline` no install e serve essa página quando a
navegação falha. Para não pagar o custo de acordar o service worker a cada
navegação (a preocupação que o próprio arquivo documenta), a navegação usa
**navigation preload**: o navegador dispara a requisição em paralelo com a
subida do SW. A página se recarrega sozinha quando o sinal volta.

### 6. Página `/instalar`

Endereço fixo para mandar a quem pergunta "tem app?". Detecta o aparelho, abre
já no passo a passo certo, mostra o botão nativo quando disponível e deixa as
abas dos outros navegadores visíveis. No computador, exibe um **QR Code** para
saltar direto para o celular. Pública (sem login) e no sitemap.

---

## Onde fica cada coisa

```
lib/pwa/instalacao.ts            detecção de plataforma, instruções, script de captura
hooks/use-instalar-app.ts        estado de instalação para a UI
components/pwa/install-prompt.tsx   faixa de convite (todas as plataformas)
components/pwa/instalar-app.tsx     conteúdo da página /instalar
components/pwa/botao-tentar-novamente.tsx   botão da tela offline
app/instalar/page.tsx            página pública de instalação
app/offline/page.tsx             tela sem conexão (cacheada pelo SW)
app/manifest.ts                  manifest do PWA
public/sw.js                     service worker (cache + fallback offline)
scripts/pwa/gerar-icones-android.py   gerador dos ícones Android
__tests__/pwa/instalacao.test.ts      21 testes da lógica de detecção
```

## Testes

```bash
npm test -- __tests__/pwa/instalacao.test.ts
```

Cobrem user agents reais: Samsung Internet 23 e 6.2, Chrome no Galaxy S23,
Edge Android, Firefox Android, Safari e Chrome no iPhone, iPad em modo desktop
(que se declara "Macintosh") e Mac de verdade. O ponto mais escorregadio está
coberto: **o user agent do Samsung Internet também contém `Chrome/`** — tratá-lo
como Chrome mandaria a pessoa procurar um menu ⋮ que não existe naquele
navegador.

## Como validar num Samsung de verdade

1. Abra o site no **Samsung Internet** (deslogado ou logado, tanto faz).
2. Em ~1,5 s a faixa aparece com **Instalar agora**.
3. Toque: o diálogo do sistema abre com nome e ícone do DomineAqui.
4. Confirme. O ícone entra na tela de início já com o recorte squircle do One UI.
5. Toque longo no ícone: os quatro atalhos aparecem.
6. Ative o modo avião e abra o app: aparece a tela offline da marca, não o erro
   do navegador. Desative: a página volta sozinha.

Para inspecionar: `chrome://inspect` no desktop com o aparelho conectado, aba
Application → Manifest mostra os ícones e atalhos como o Android os lê.

## Ponta solta conhecida

**`screenshots` no manifest.** Com eles, o Chrome/Samsung Internet trocam a
mini-barra de instalação por um diálogo rico, em tela cheia, com prévia do app —
conversão bem maior. Ficaram de fora de propósito: exigem **capturas reais** da
plataforma (formato `narrow` 1080×1920 e `wide` 1920×1080), e inventar imagens
promocionais no lugar de telas de verdade é enganoso. Assim que houver as
capturas, é só acrescentar o campo `screenshots` em `app/manifest.ts` — nada
mais precisa mudar.
