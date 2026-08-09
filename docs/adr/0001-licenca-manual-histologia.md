# ADR 0001 — Portão de licença do Manual da Histologia

- **Estado:** aceito — Rota A (gratuito, sem exploração comercial) registrada
- **Data da decisão:** 2026-08-07
- **Decisores:** throdrigf@gmail.com (responsável pelo produto)

## Decisão registrada

Rota A: o Manual da Histologia permanece **integralmente gratuito**, sem
paywall, sem CTA comercial contextual e tecnicamente separado do Plus+. Ver
`AUTORIZACAO` em `lib/histologia/licenca.ts`.

Isso libera a publicação em produção quanto ao aspecto jurídico. Duas
pendências operacionais continuam abertas e independem desta decisão:

1. **Mídia não publicada** — o acervo (2,56 GiB) ainda não foi enviado ao
   Vercel Blob; sem `NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE`, a interface mostra
   aviso em vez de imagem. Ver `public/Manual-Histologia/IMPLEMENTACAO.md`.
2. **Revisão biomédica pendente** — todo conteúdo continua marcado
   `pendente-de-revisao`; a tarja correspondente aparece em cada página.
3. **Flag de ambiente** — em produção, além da decisão de licença, o módulo só
   fica visível com `HISTOLOGIA_HABILITADO=1` definido no ambiente.

## Contexto

O acervo do **Digital Histology** (Virginia Commonwealth University School of
Medicine / ALT Lab) é publicado sob **CC BY-NC-SA 4.0**, conforme
<https://digitalhistology.org/credits/>.

A cláusula **NãoComercial** (NC) é, por padrão, incompatível com:

- distribuição atrás de paywall ou assinatura;
- uso do conteúdo como argumento de venda de um produto pago;
- CTA comercial contextual dentro da experiência.

O GradeX opera fluxos pagos (Plus+, compra avulsa do Manual Clínico, checkout).
O módulo de Tomografia, por exemplo, usa `useAcessoTomografia()` para barrar quem
não assina. Aplicar o mesmo padrão à Histologia colocaria conteúdo NC atrás de
pagamento.

`public/Manual-Histologia/LICENCA_E_PUBLICACAO.md` já registra esse bloqueio e
exige que uma de duas rotas seja escolhida **antes** de publicar.

## Decisão

1. O Manual da Histologia é implementado como **módulo gratuito por
   construção**. Não existe, em nenhum ponto de `app/manual-clinico/histologia/**`
   ou `components/histologia/**`, chamada a hook de acesso pago, referência a
   `PLUS_LABEL`, botão de checkout ou vitrine de plano. A gratuidade não é uma
   configuração que alguém possa inverter por engano: é a ausência de código de
   cobrança.

2. Enquanto **não houver decisão registrada**, o módulo fica **desligado em
   produção**. O estado vive em `lib/histologia/licenca.ts`, no objeto
   `AUTORIZACAO`, hoje com `decisao: 'pendente'`.

3. A liberação em produção exige **duas** condições simultâneas:
   - `AUTORIZACAO.decisao !== 'pendente'`; e
   - variável de ambiente `HISTOLOGIA_HABILITADO=1`.

   Fora de produção o módulo abre normalmente — desenvolvimento e revisão
   biomédica precisam acontecer para que a pendência seja resolvida, e é
   exatamente o que a licença permite.

4. Quando bloqueado, a rota responde **404 seco**. Não exibimos "conteúdo
   indisponível por questões de licença": anunciar que existe material escondido
   convida ao contorno e não beneficia ninguém.

5. As obrigações de atribuição são cumpridas de forma estrutural, não
   decorativa: `CREDITO_BASE`, `LICENCA` e `ALTERACOES_REALIZADAS` vivem em
   `lib/histologia/licenca.ts` e aparecem na gaveta de créditos de toda lâmina,
   junto dos créditos específicos daquela imagem (`creditos`, preservados do
   acervo), da `url_origem`, da data de acesso e do SHA-256.

## Como liberar

Só o responsável pelo produto pode fazer isto. Passos:

1. Escolha a rota:
   - **Rota A — gratuito:** confirme que o módulo permanecerá sem paywall, sem
     CTA comercial contextual e sem vínculo técnico com benefícios pagos.
   - **Rota B — autorização escrita:** obtenha permissão dos titulares para o
     uso comercial pretendido e arquive o documento no repositório.
2. Edite `AUTORIZACAO` em `lib/histologia/licenca.ts` preenchendo `decisao`,
   `registradoEm`, `responsavel` e, na rota B, `documento`.
3. Defina `HISTOLOGIA_HABILITADO=1` no ambiente de produção.
4. Atualize este ADR com a decisão tomada e a data.

## Consequências

- **Positiva:** é impossível publicar acidentalmente conteúdo NC atrás de
  paywall — não há código de cobrança para configurar errado.
- **Positiva:** a auditoria de licença é um arquivo, revisável em code review.
- **Negativa:** o módulo não gera receita direta. É o preço da licença
  escolhida pelos titulares, não uma limitação técnica.
- **Negativa:** enquanto pendente, o módulo não é indexado por buscadores
  (`podeIndexar()` retorna `false`), então não acumula autoridade de SEO.

## Referências

- <https://digitalhistology.org/credits/>
- <https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-BR>
- `public/Manual-Histologia/LICENCA_E_PUBLICACAO.md`
