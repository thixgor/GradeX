# Proteção de conteúdo — o que existe, o que não existe

Tudo o que chega ao navegador pode ser lido. Desligar o JavaScript, digitar
`view-source:` na barra, abrir o DevTools pelo menu, olhar a aba Network ou
passar o tráfego por um proxy: qualquer um desses mostra o HTML e o JSON que o
servidor mandou. Por isso o site trabalha em duas frentes, e é importante não
confundir uma com a outra.

## 1. O servidor não manda o que a pessoa não pode ver (proteção real)

| Onde | O quê |
| --- | --- |
| `lib/provas/sanitizar-prova.ts` | Gabarito, comentário e respostas aceitas da prova avaliativa só saem depois do fim. |
| `lib/banco/acesso-servidor.ts` (`ocultarConteudo`) | Questão bloqueada do plano gratuito sai sem enunciado, alternativas, explicação **e sem imagens** (enunciado, alternativas, comentário). |
| `app/api/amostra/route.ts` + `lib/amostra-pool.ts` | A amostra pública sorteia dentro de um pool fixo de 40 questões por semana. Raspar a amostra rende essas 40, não o banco. |
| `app/api/materiais/[id]/route.ts` | Os complementares crus (com `buttonUrl` e `blobUrl`) só saem para admin; os demais recebem a versão filtrada por acesso. |
| `app/api/flashcards/[id]/cards/route.ts` | Cartões de baralho gerado por IA só para o dono (ou admin). |
| Leitor de PDF, aulas, histologia, patologias | Ver os comentários de cada rota — páginas liberadas, embeds e lâminas só com acesso. |

## 2. Dissuasão no navegador (atrito, não cofre)

- `components/protecao-contra-inspecao.tsx` + `lib/protecao-inspecao.ts`, no
  layout raiz, para todos menos admin:
  - F12, Ctrl+Shift+I/J/C/K, Cmd+Opt+I/J/C/U, Ctrl/Cmd+U e Ctrl/Cmd+S não fazem
    nada (e uma linha na tela diz por quê);
  - botão direito do mouse não abre o menu nativo — exceto em link e campo de
    escrita; no toque nada muda (o toque longo é o gesto de selecionar texto);
  - DevTools acoplado à janela esconde a página atrás de um aviso. Na prova
    monitorada, o fato vai como alerta para `/admin/proctoring` pelo
    WebSocket (`server/websocket-server.js`, tipo `devtools`).
  - Desligar sem mexer em código: `NEXT_PUBLIC_PROTECAO_INSPECAO=off` na Vercel
    e um redeploy (variável `NEXT_PUBLIC_` entra no bundle durante o build).
- `components/exam/escudo-anti-cola.tsx`: cópia, impressão e menu travados por
  prova.
- `components/flashcards/marca-dagua-flashcard.tsx`: nome, e-mail e data de
  quem estuda sobre o card. Sem requisição — lê o cache do bootstrap.
- Marca d'água nos vídeos e no PDF baixado.

O que a dissuasão **não** pega: DevTools em janela separada, JavaScript
desligado, `view-source:` digitado na barra, extensões, proxy, foto de celular.
Para esses casos, só a frente 1 vale.

## Custo

Nada desta lista acrescenta invocação de função na Vercel. A dissuasão roda no
navegador; o alerta da prova vai pelo servidor WebSocket (fora da Vercel); as
correções de servidor mexem em rotas que já existiam, com menos bytes.

## Pendências conhecidas (ficaram de fora por custo)

Fechá-las exige transformar páginas estáticas em dinâmicas ou servir arquivos
por função — exatamente o que o `CLAUDE.md` pede para evitar. Ficam registradas
para quando a decisão de custo for outra.

1. **Radiologia (Tomografia e Raio-X), Exames Laboratoriais e Semiologia.** As
   páginas são geradas no build e o conteúdo inteiro vai no payload RSC; o
   bloqueio é só visual, no cliente (`AreaRadiologia`, `AreaDosExames`,
   `AreaSemiologia`). A correção é a da Histologia: portão na página com
   `redirect()` (`lib/histologia/acesso.ts`) — o que torna cada visita uma
   invocação.
2. **Ferramentas Clínicas e ECG.** O conteúdo está no bundle JavaScript; o
   portão é só no cliente. Corrigir exige servir o conteúdo por API.
3. **`public/TC_*` e `public/atlas-anatomia/`.** Imagens baixáveis direto do
   CDN. Servi-las por função custaria Fast Origin Transfer em todo acesso.
4. **Busca do Banco para o plano gratuito.** O filtro `busca` roda sobre o
   enunciado de questões ainda bloqueadas, e a contagem é real — dá para sondar
   o texto. Corrigir muda o produto (o gratuito deixaria de buscar).
5. **`console.log` no bundle do cliente.** `compiler.removeConsole` do Next 14
   também apaga os logs do servidor (`next/dist/build/swc/options.js`), que são
   a observabilidade das APIs na Vercel. Ficou de fora.
