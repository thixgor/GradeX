# ADR 0003 — Manual da Histologia privativo de assinantes

- **Estado:** aceito — substitui a Rota A do [ADR 0001](./0001-licenca-manual-histologia.md)
- **Data da decisão:** 2026-08-13
- **Decisores:** throdrigf@gmail.com (responsável pelo produto)

## Decisão

O Manual da Histologia deixa de ser gratuito. A partir desta data o módulo é
**privativo de assinantes do Manual Clínico e de contas DomineAqui Plus+** —
a mesma regra de `hasFullAccess` que já vale para o Manual do Eletrocardiograma,
o Manual de Radiologia, Domine Anatomia e as Ferramentas Clínicas.

Quem não assina — **inclusive o visitante sem login** — recebe uma landing de
vendas na mesma URL, no lugar do conteúdo.

## Contexto

O ADR 0001 registrou a Rota A (gratuito, sem exploração comercial) como forma de
conviver com a cláusula NãoComercial do acervo Digital Histology (VCU), que está
sob CC BY-NC-SA 4.0. A gratuidade era **estrutural**: não existia código de
cobrança em nenhum arquivo do módulo, e um teste varria a superfície inteira
atrás dos símbolos que trariam o paywall de volta.

O responsável pelo produto decidiu reverter essa escolha e alinhar a Histologia
às demais seções premium do Manual Clínico.

## O que esta decisão NÃO resolve

A cláusula **NãoComercial** continua incompatível, por padrão, com distribuição
atrás de assinatura. Esta decisão **não** obtém a autorização escrita dos
titulares — ela assume o risco enquanto a autorização não chega.

Isso está declarado em código, não só aqui: `PENDENCIA_NAO_COMERCIAL`, em
`lib/histologia/licenca.ts`, carrega o texto da pendência com data e
responsável, e um teste em `__tests__/histologia/acervo.test.ts` falha se o
módulo estiver pago **e** a pendência tiver sido apagada sem que um documento
de autorização fosse arquivado. Risco assumido com registro é diferente de risco
descoberto meses depois por quem herdou o código.

**Para encerrar a pendência:** obtenha a autorização escrita da Virginia
Commonwealth University / ALT Lab, arquive o documento no repositório, preencha
`AUTORIZACAO.documento` e mude `AUTORIZACAO.decisao` para
`'autorizacao-escrita-arquivada'`. A pendência some sozinha.

**Para reverter:** mude `AUTORIZACAO.decisao` para
`'gratuito-sem-exploracao-comercial'`. `histologiaEhPrivativa()` passa a devolver
`false`, o portão libera todo mundo e nenhuma página precisa mudar.

## Como o portão foi construído

### Um único ponto de decisão

`lib/histologia/acesso.ts` é o arquivo inteiro onde o acesso pago é decidido.
O layout do módulo (`app/manual-clinico/histologia/layout.tsx`) pergunta ali uma
vez e escolhe entre `children` e a vitrine.

O teste que antes proibia qualquer símbolo de cobrança no módulo não foi
apagado: mudou de invariante. Ele agora permite os símbolos de acesso pago
**apenas** em `lib/histologia/acesso.ts`, `licenca.ts`, na vitrine e no layout —
e falha se alguém copiar uma checagem para dentro de uma página. É o que mantém
a reversão barata.

### No servidor, não no cliente

As páginas deste módulo são componentes de servidor: o acervo entra no HTML.
Barrar no navegador (o padrão que Anatomia e ECG usam, porque são páginas de
cliente que buscam dados por rota) entregaria justamente o produto. Como o
`children` só é renderizado no ramo liberado, as páginas da árvore nem chegam a
executar para quem não assina.

**Consequência aceita:** o módulo passou de geração estática (ISR de um dia)
para renderização sob demanda — ler a sessão é incompatível com pré-renderizar.
O custo é pequeno porque os dados vêm de módulos JavaScript empacotados, e não
de rede ou banco.

### As rotas de dados fecham junto

`/api/manual-clinico/histologia/{indice,busca,quiz/[slug]/gabarito}` passaram a
consultar o mesmo portão e a devolver **404 seco** para quem não assina. Sem
isso, o índice completo — 7.453 rótulos de estrutura — seria um `curl` de
distância, e o muro teria porta dos fundos.

O cache dessas rotas deixou de ser `public, s-maxage=…`: resposta que depende de
quem pergunta não pode ficar num cache compartilhado, sob pena de a borda servir
o acervo de um assinante a um visitante.

### As rotas continuam públicas no middleware

`/manual-clinico/histologia` e sua árvore seguem em `publicRoutes`. "Público"
ali significa apenas "não redireciona para o login" — é o que permite ao
visitante deslogado ver a landing em vez de cair numa tela de entrar, e ao
buscador ter o que indexar. Quem decide o que aparece é o layout.

## A landing

`components/histologia/vitrine.tsx`. A régua foi **mostrar em vez de
descrever**: no meio da página há uma lâmina real do acervo com as camadas de
marcação funcionando — quem chega acende as estruturas com o dedo antes de
decidir. O que fica do outro lado do muro são as outras 1.319 lâminas.

Os números vêm do currículo real (`lib/histologia/vitrine.ts`, montado no
servidor para que o catálogo não vaze no bundle de quem ainda não comprou), e o
crédito exigido pela licença aparece **também** na landing: a obrigação de
atribuição não começa depois da compra.

## Consequências

- **Positiva:** a seção passa a gerar receita e alinha-se às demais áreas
  premium do Manual Clínico.
- **Positiva:** o link antigo continua valendo — quem chega por busca ou por
  indicação vê a oferta, e não um 404.
- **Negativa:** o risco jurídico da cláusula NC passa a ser real e assumido.
  Enquanto a autorização escrita não existir, o projeto está exposto a um
  pedido de remoção pelos titulares.
- **Negativa:** o módulo perdeu a geração estática e passou a custar uma leitura
  de sessão por requisição.
- **Negativa:** alunos que usavam o módulo gratuitamente perdem o acesso. É a
  consequência direta da decisão, não um efeito colateral.

## Referências

- [ADR 0001 — Portão de licença do Manual da Histologia](./0001-licenca-manual-histologia.md)
- `public/Manual-Histologia/LICENCA_E_PUBLICACAO.md`
- <https://digitalhistology.org/credits/>
- <https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-BR>
