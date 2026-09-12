# Anúncios da plataforma

Painel: **/admin/anuncios**. Os anúncios ativos aparecem como uma peça flutuante
em quase toda a plataforma (`components/platform-ads.tsx`), com rotação
automática e botão para ocultar por 30 minutos.

## Imagem

A arte é enviada direto do computador (arrastar, clicar ou colar com Ctrl+V) e
fica hospedada no Vercel Blob — não é mais preciso subir no Imgur e colar a URL.

- Rota que autoriza o envio: `app/api/admin/anuncios/upload/route.ts`
- Envio client-side (`lib/anuncio-image-upload.ts`), até **8 MB**, nos formatos
  JPG, PNG, WEBP, GIF e AVIF.
- Usa o store **público** de imagens: `BLOB_READ_WRITE_TOKEN_MIDIA`. Não troque
  por `BLOB_READ_WRITE_TOKEN` — aquele store é privado (PDFs de materiais) e
  recusa blobs públicos com um erro que chega ao navegador como "blocked by CORS
  policy", sem dizer a causa.
- O campo de URL continua disponível (link "Usar uma URL") para anúncios antigos
  ou artes já hospedadas em outro CDN.

Tamanho recomendado: 1200 × 400 px (proporção 3:1).

## Destino

O destino é escolhido em uma busca (`app/api/admin/anuncios/destinos/route.ts`)
que cobre:

| Tipo | Origem | Caminho gerado |
| --- | --- | --- |
| Material | `materials` | `/materiais/<id>` |
| Pacote | `material_packages` | `/pacotes/<id>` |
| Produto da loja | `physical_products` | `/loja/<id>` |
| Aula | `aulas_postagens` | `/aulas/<id>` |
| Rifa | `raffles` | `/rifas/<slug>` |
| Parte do site | catálogo da busca global | rota da área/página |

Quem escolhe um desses destinos grava também `destino: { tipo, rotulo, refId }`,
usado como título do banner quando não há chamada escrita.

**Destino interno nunca abre aba nova.** O clique navega com `router.push`, o que
vale para o banner, para o botão do modal e para os links escritos dentro do
conteúdo do modal. Abrir uma aba para ir de uma página do app a outra recarrega
tudo e, no PWA instalado, joga a pessoa no navegador. A opção "abrir em nova aba"
só aparece para link externo.

Um endereço absoluto do próprio site colado no campo externo também é tratado
como interno na hora do clique. Caminhos que começam com `//` ou `/\` são
recusados: o navegador os resolve como domínio externo.

## Modelos persuasivos

O painel colapsável "Modelos persuasivos" (`lib/anuncio-templates.ts`) traz um
texto pronto por técnica — escassez, urgência, prova social, autoridade, aversão
à perda, ancoragem, reciprocidade, curiosidade, novidade, pertencimento, redução
de risco e compromisso. Cada card explica por que a técnica funciona e quando
usá-la; "Usar modelo" preenche chamada, texto do botão, título, conteúdo e botão
do modal de uma vez.

Os trechos a trocar vêm em `[COLCHETES]`. O formulário avisa quando algum sobrou
e só salva com um segundo clique ("Salvar assim mesmo") — colchete também pode
ser texto legítimo.

O conteúdo do modal aceita apenas `p, strong, em, b, i, u, small, span, br, ul,
ol, li, h3, h4, blockquote, hr, a`; o resto é removido na exibição pública.

## Segmentação

Sem períodos marcados, o anúncio aparece para todo mundo. Com períodos, só para
quem está em um deles (`/api/anuncios` filtra pelo período atual do usuário; a
resposta é cache privado de 60 s justamente por depender do usuário).

## Ordenação

A seta de mover chama `PATCH /api/admin/anuncios` com a lista de ids na nova
ordem, e o servidor regrava `ordem` pela posição. A troca de valores entre dois
vizinhos, que existia antes, não movia nada quando os dois tinham o mesmo número.
