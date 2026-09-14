# Briefing — Manual de Semiologia

Cole o conteúdo abaixo (da linha de corte para baixo) numa sessão do Claude Code
aberta na pasta do projeto. É autocontido: a sessão descobre o resto lendo o
repositório.

Duas frentes, nesta ordem de prioridade:

1. **Ilustrações** — a que mais importa hoje. Não precisa de rede.
2. **Curadoria de casos reais** — precisa de acesso a radiopaedia.org e
   thepocusatlas.com.

---
---

Você vai trabalhar no **Manual de Semiologia** deste repositório. Leia este
briefing inteiro antes de tocar em qualquer arquivo.

## O produto

**DomineAqui** (`domineaqui.com.br`) é uma plataforma brasileira de educação
médica. Dentro dela, o **Manual Clínico** é um pacote único de nove módulos
vendidos juntos — patologias, exames laboratoriais, farmacologia,
eletrocardiograma, radiologia, histologia, anatomia, ferramentas clínicas e,
o mais novo, **semiologia**. A lista canônica está em
`lib/manual-clinico/pacote.ts`.

A barra de qualidade já existente é alta, e é contra ela que este módulo é
julgado:

- **Histologia**: 1.318 lâminas reais, 7.371 estruturas marcadas, microscópio
  interativo.
- **Radiologia**: 640 cortes de TC que o aluno rola como na estação de trabalho,
  28 incidências de raio-X com ~200 demarcações acendíveis, sete janelas de
  leitura.
- **Anatomia**: 211 pranchas com ficha por estrutura, 100 modelos 3D em 360°.
- **Eletrocardiograma**: 12 derivações **geradas matematicamente em tempo real**
  a partir de parâmetros eletrofisiológicos. Não guarda um único PNG de traçado.

Leia dois ou três desses módulos antes de escrever código. O padrão de
comentário do repositório é denso e explicativo — comentário diz **por quê**, não
o quê. Prosa em português do Brasil.

## O que o Manual de Semiologia resolve

O Manual ensinava a ler o exame *complementar* (radiografia, tomografia, lâmina,
traçado, gasometria) e a doença inteira em cada ficha. Faltava a etapa anterior:
a que o aluno faz com a própria mão.

O sintoma é concreto. O aluno vai à clínica da família, encosta o otoscópio no
primeiro ouvido da vida dele e descobre que não sabe dizer se aquilo é normal.
Não falta teoria — ele recita "translúcida, nacarada, com triângulo luminoso
ântero-inferior". Falta a imagem: nunca viu uma, e descrição verbal só vira
reconhecimento quando existe algo com que comparar.

O módulo tem três alas (`/manual-clinico/semiologia`):

| Ala | Conteúdo |
|---|---|
| **Sinais** | 12 fichas de exame físico: icterícia, edema, cianose, turgência jugular, baqueteamento, ascite, asterixe, enchimento capilar, palidez, estigmas hepáticos, Murphy, Blumberg |
| **Beira-leito** | 4 janelas, 18 cenas: otoscopia, fundo de olho, orofaringoscopia, rinoscopia |
| **Ultrassom** | 4 janelas, 11 cenas: linhas A/B, FAST-Morrison, veia cava, pericárdio |

Mais 3 comparadores (edema, icterícia, cianose por causa) — o corte transversal
que livro nenhum faz: não "o que é edema", mas **qual edema é qual**.

## A decisão de arquitetura que define tudo

Acervo fotográfico de otoscopia e fundo de olho é quase todo proprietário. A
saída foi a mesma do Eletrocardiograma: **a imagem é gerada**. Cada cena é um
SVG paramétrico escrito por nós, em `components/semiologia/ilustracoes/`, com
`viewBox="0 0 100 100"` — o que permite às estruturas de `vistas.ts` guardarem
coordenadas em porcentagem e o marcador cair exatamente sobre o cabo do martelo.

Isso paga três vezes: é direito nosso, é comparável (duas otites lado a lado
mudam só no que importa, porque o resto do desenho é literalmente o mesmo
código) e é **interativo**.

A regra que torna isso honesto: o desenho deriva do mecanismo. Na otoscopia, o
triângulo luminoso é **calculado** a partir da planura da membrana
(`forcaDoCone = 1 − |curvatura| × 1.9`), então é impossível desenhar uma membrana
abaulada que ainda o tenha. Preserve esse tipo de derivação; nunca desenhe um
achado "à mão" onde ele pode sair de um parâmetro.

---

# FRENTE 1 — Ilustrações (prioridade, sem rede)

## O problema, declarado sem rodeio

As figuras estão fracas. O dono do projeto resumiu: *"tá só com uns SVG feião —
o único legal e interativo é o de icterícia."* Ele está certo, e o diagnóstico é
específico:

- **6 de 17** figuras têm controle deslizante (`ilustracoes/controles.ts`):
  icterícia, jugular, baqueteamento, enchimento capilar, palidez, ascite.
- **6** são desenhos estáticos, sem parâmetro nenhum: edema, cianose, asterixe,
  aranha vascular, Murphy, Blumberg.
- **5 cenas têm a máquina paramétrica pronta e nunca exposta**: otoscopia
  (`curvatura`, `opacidade`, `hiperemia`, `conduto`), fundoscopia
  (`calibreArteria`, `calibreVeia`), ultrassom (`linhasB`, `liquido`, `derrame`),
  orofaringe e rinoscopia.

A terceira linha é o erro estrutural. `components/semiologia/visor.tsx` só troca
de cena — nunca expõe um controle. A fiação de deslizador existe apenas em
`ficha-sinal.tsx`, via o mapa `CONTROLES`. **É por isso que só a icterícia parece
viva**: ela é a única cujo parâmetro chega ao aluno.

## Tarefas, em ordem de valor

**1. Expor os parâmetros das cenas no visor.** Leve a mecânica de `CONTROLES`
para `visor.tsx`, ou generalize-a para os dois. O ganho didático imediato:

- Otoscopia → arrastar `curvatura` de −1 (retraída) a +1 (abaulada) e ver o
  triângulo luminoso se desfazer. É a melhor aula do módulo e já está calculada.
- Fundoscopia → `calibreArteria` mostrando a relação arteríola/vênula estreitar
  na retinopatia hipertensiva.
- Ultrassom pulmonar → `linhasB` de 0 a 8, o pulmão passando de seco a molhado,
  as linhas A horizontais sendo apagadas pelas verticais.

Cada controle precisa de rótulo clínico, unidade e marcos anotados (limiares que
importam), como já faz `controles.ts`. Só exponha parâmetro **clinicamente
significativo** — deslizador decorativo ensina que qualquer variação carrega
informação, o que é falso.

**2. Dar parâmetro a quem não tem.** Edema (profundidade e tempo de recuperação
do cacifo), cianose (hemoglobina reduzida em g/dL, que é o que de fato governa a
cor), Blumberg e Murphy (sequência da manobra em passos). Asterixe já é animado;
avalie se ganha um controle de frequência das quedas.

**3. Melhorar o desenho.** Rode a folha de contato (instruções abaixo) e olhe
tudo junto. Os mais fracos hoje: asterixe (mão em formato de luva), Murphy e
Blumberg (esquemáticos demais), jugular (pescoço abstrato), palidez e edema
(anatomia tosca). Procure silhueta reconhecível, sombreamento que dê volume e
proporção clínica correta — não realismo fotográfico, mas desenho médico que
alguém assinaria.

**Regras de cor que não mudam**: tecido nunca responde ao tema. Esclera ictérica
é amarela no modo escuro também — `corDeTecido()` existe para tornar essa
fronteira explícita. Só moldura, legenda e régua usam token do tema.

## Como revisar visualmente

Não existe harness no repositório — monte um descartável. O caminho que funciona:
renderize todas as figuras com `renderToStaticMarkup` numa página HTML e tire
screenshot com Playwright. O JSX precisa de `esbuild: { jsx: 'automatic' }` numa
config de vitest separada, porque a config padrão usa o runtime clássico. Apague
o harness antes de commitar.

Olhe as figuras **juntas**, em grade. Isoladas elas enganam; lado a lado fica
óbvio qual destoa.

---

# FRENTE 2 — Curadoria de casos reais (precisa de rede)

## O que temos

Autorização escrita de duas fontes, registrada em `lib/acervos-licenciados.ts`
com o SHA-256 de cada documento:

- **The POCUS Atlas** (Drs. Michael Macias e Matthew David Riscinti) — CC BY-NC
  4.0 com exceção expressa à cláusula NonCommercial para a DomineAqui e seus
  domínios.
- **Radiopaedia.org** (Radiopaedia Australia Pty Ltd / Dr. Frank Gaillard) — CC
  BY-NC-SA 3.0 com a mesma exceção, mais tradução integral.

As duas liberam o acervo completo — imagens, clipes, casos, textos — inclusive em
produto pago. Leia `permissoes` e `restricoes` antes de agir.

O caso real **acompanha** o esquema, nunca o substitui. O esquema ensina o
padrão; a fotografia ensina a variação (a otite que não parece a do livro, a
janela ruim entre costelas, o ganho mal ajustado). Competências distintas.

## Passos

1. `npm run semiologia:acervo:esboco` — regenera
   `scripts/semiologia/curadoria.json` com uma entrada por cena sem caso, já com
   `janela`, `cena`, fonte provável, legenda rascunhada e os campos `_alvo` /
   `_procurar` dizendo o que buscar.

2. Preencha cada entrada:
   - `caso` (URL ou id do caso no Radiopaedia — o script resolve as imagens) **ou**
     `urlOrigem` (URL direta; obrigatório no POCUS Atlas)
   - `urlDoCaso` — a página do caso na fonte. É a proveniência, é obrigatória.
   - `legenda` — revise o rascunho. Português, descrevendo o que se vê.

   Escolha casos didaticamente claros. Caso ambíguo é pior que nenhum: o aluno
   aprende o ruído junto com o sinal.

3. `npm run semiologia:acervo:verificar` até zerar as falhas. Entrada sem link é
   ignorada, não é erro — a curadoria acontece em lotes.

4. `npm run semiologia:acervo:gerar` — baixa, confere o content-type, calcula o
   SHA-256, salva os bytes em `.semiologia/midia/` e escreve
   `lib/semiologia/acervo.gerado.ts`.

## Ordem sugerida

Comece pelo **ultrassom** (`pulmao-linhas`, `fast-morrison`,
`veia-cava-inferior`, `subxifoide-pericardio` — 11 cenas). É onde o esquema tem a
maior lacuna: deslizamento pleural, ponto pulmonar e swinging heart são achados
de **movimento** que desenho nenhum reproduz, e o POCUS Atlas tem clipes.

Depois `otoscopia` (6), `fundoscopia` (5), `orofaringoscopia` (4),
`rinoscopia-anterior` (3).

---

# Regras que valem para as duas frentes

- **Nunca invente URL.** Se a resolução automática falhar, o script diz o que veio
  da API. Investigue ou preencha à mão — jamais chute um caminho. URL inventada
  não quebra no script: quebra em produção, com o crédito apontando para um caso
  que talvez não exista.
- **Não edite `lib/semiologia/acervo.gerado.ts` à mão.** É saída de máquina.
- **Não toque na prosa.** `vistas.ts`, `ultrassom.ts`, `sinais.ts` e
  `comparadores.ts` são texto clínico revisado. O acervo é arquivo separado e o
  merge acontece na leitura (`acervo.ts`).
- **Host rejeitado ≠ contornar a allowlist.** Se o script recusar um host
  legítimo, acrescente-o em `dominiosDeMidia` (`lib/acervos-licenciados.ts`) **e**
  em `HOSTS` (`scripts/semiologia/curar-acervo.mjs`). Um teste compara as duas
  listas e falha se divergirem. Nunca remova a checagem.
- **Crédito é obrigação contratual.** Não altere os textos de `credito` — eles
  reproduzem o que a autorização pede, palavra por palavra. O rodapé sai uma vez
  por rota, pelo portão do módulo: as autorizações pedem atribuição permanente e
  explicitamente **não** repetitiva.
- **Conteúdo clínico exige fonte.** Todo número de desempenho diagnóstico carrega
  `fonte`; cifra sem procedência é pior que ausência de cifra, porque parece
  autoridade.

## Antes de commitar

```
npm test            # 35 testes do módulo; 1 falha pré-existente em
                    # __tests__/histopatologia/webpath-utah.test.ts não é sua
npx tsc --noEmit
npm run build
```

Commits em português, explicando a decisão e não o diff. Veja
`git log --oneline -6` para o tom.

## Ao terminar

Reporte o que mudou de fato: quais figuras ganharam controle, quais foram
redesenhadas, quantas cenas ganharam caso real, o que ficou de fora e por quê, e
quais hosts precisaram entrar na allowlist. A página
`/manual-clinico/semiologia/creditos` publica a cobertura da curadoria
automaticamente — confira se o número bate.

## Uma decisão que é do dono do projeto

Onde servir a mídia: espelho em CDN nosso
(`NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE`) ou origem no servidor deles
(`NEXT_PUBLIC_SEMIOLOGIA_MIDIA_ORIGEM=1`). Em desenvolvimento a origem já está
ativa, então dá para revisar sem espelhar nada. **Pergunte antes de configurar** —
servir da origem em produção faz o tráfego dos nossos alunos bater no servidor de
quem nos fez um favor.
