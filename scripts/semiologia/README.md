# Curadoria do acervo do Manual de Semiologia

O **The POCUS Atlas** e o **Radiopaedia.org** autorizaram, por escrito, o uso do
acervo completo de cada um pela DomineAqui — imagens, clipes, casos e textos,
inclusive em produto pago. Os termos estão em `lib/acervos-licenciados.ts`.

Autorização, porém, não é curadoria. A permissão diz *o que podemos usar*; ela
não escolhe qual caso ensina bem uma otite média aguda. Isso é julgamento
clínico e continua sendo trabalho de gente.

Este diretório divide esse trabalho em duas partes.

## Quem faz o quê

**Pessoa** — abre `curadoria.json` e acrescenta uma entrada por mídia:

```json
{
  "janela": "otoscopia",
  "cena": "otite-media-aguda",
  "fonte": "radiopaedia",
  "tipo": "imagem",
  "caso": "https://radiopaedia.org/cases/00000",
  "legenda": "Membrana timpânica abaulada, opaca, com o cabo do martelo obscurecido."
}
```

`janela` e `cena` são os mesmos identificadores que aparecem na URL do módulo
(`?cena=otite-media-aguda`). Em vez de `caso`, dá para informar `urlOrigem` com
a URL direta do arquivo — obrigatório para o POCUS Atlas, opcional para o
Radiopaedia, onde o script tenta resolver o caso pela API pública.

**Script** — verifica, baixa, confere o tipo, calcula o SHA-256 e gera
`lib/semiologia/acervo.gerado.ts`. Ninguém digita hash e nenhuma URL entra no
acervo sem ter respondido 200 pelo menos uma vez.

## Comandos

```bash
npm run semiologia:acervo:esboco      # monta o formulário com as cenas que faltam
npm run semiologia:acervo:verificar   # checa e relata, sem escrever nada
npm run semiologia:acervo:gerar       # baixa, hasheia e escreve o acervo
npm run semiologia:acervo:espelhar    # sobe os bytes ao Vercel Blob e imprime a base
```

Comece pelo esboço. Ele lê o próprio acervo, descobre quais cenas ainda não têm
caso e escreve uma entrada por cena em `curadoria.json` — já com `janela`,
`cena`, a fonte provável e a legenda rascunhada a partir do diagnóstico que a
ficha declara. Cada entrada traz também `_alvo` e `_procurar`, que dizem o que
ir buscar:

```json
{
  "_alvo": "Otoscopia → Otite média aguda",
  "_procurar": "Infecção bacteriana do ouvido médio com efusão sob pressão.",
  "janela": "otoscopia",
  "cena": "otite-media-aguda",
  "fonte": "radiopaedia",
  "tipo": "imagem",
  "caso": "",
  "urlDoCaso": "",
  "legenda": "Infecção bacteriana do ouvido médio com efusão sob pressão."
}
```

Sobra colar o link e revisar a legenda. Entrada sem link é ignorada, não é
erro — dá para curar dez cenas hoje e vinte na semana que vem sem apagar nada.

O modo verificação não toca em disco de propósito: é o que roda em CI para
pegar link podre antes de o aluno encontrar o quadrado quebrado.

## As regras que o script não abre mão

- **Host autorizado.** Só os domínios que as autorizações cobrem, e só HTTPS.
  A mesma allowlist é reaplicada na renderização, e um teste vigia as duas para
  que não divirjam.
- **Proveniência obrigatória.** Toda mídia carrega o link do caso original. É o
  que torna o crédito verificável por quem quiser conferir.
- **Tudo ou nada.** Uma falha e nenhum arquivo é escrito. Gerar um acervo
  parcial em silêncio faria alguém acreditar que curou 40 casos quando 12
  falharam.
- **Nunca inventar URL.** Se a resolução automática de um caso não encontrar
  imagem em host autorizado, a entrada falha dizendo o que veio da API — em vez
  de adivinhar um caminho. URL inventada não quebra aqui: quebra em produção,
  com o crédito apontando para um caso que pode não existir.

## Onde as imagens são servidas

`lib/semiologia/midia.ts` tem três estratégias, herdadas do Manual da
Histologia:

| Estratégia | Quando | Variável |
|---|---|---|
| `espelho` | CDN nosso, endereçado por hash — o modo robusto | `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE` |
| `origem` | servidor da própria fonte; sempre ativo fora de produção | `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_ORIGEM=1` |
| `indisponivel` | produção sem espelho e sem opt-in — mostra só o esquema | — |

Servir da origem em produção é uma decisão com consequência: o tráfego dos
nossos alunos passa a bater no servidor de um terceiro que nos fez um favor, e
uma mudança de URL do lado deles quebra a cena. Por isso exige opt-in explícito.

Os bytes baixados por `--baixar` ficam em `.semiologia/midia/`, prontos para
subir ao espelho.

## Subindo ao espelho

```bash
BLOB_READ_WRITE_TOKEN=... npm run semiologia:acervo:espelhar
```

Com `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE` também definida no ambiente, o script
pergunta ao espelho (HEAD) antes de cada envio e pula o que já está lá com o
tamanho certo — uma leva nova sobe só o que é novo. `--forcar` reenvia tudo.

`enviar-espelho.mjs` lê o acervo gerado, confere o SHA-256 de cada arquivo
em `.semiologia/midia/`, envia para `semiologia/<2 hex>/<sha>.<ext>` no
Vercel Blob (o mesmo caminho que `caminhoNoEspelho` monta na leitura) e
confere que o objeto responde com o tamanho certo. No fim imprime o valor de
`NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE`.

A ordem importa: **envie primeiro, configure a variável depois.** Ela é um
interruptor sem meio-termo — assim que existe, a interface deixa de servir da
origem e passa a montar a URL do espelho para toda mídia hasheada. Definida
antes do envio, quebra o acervo inteiro de uma vez, em produção.

## Curadoria em lote: como a segunda leva foi feita

A segunda leva (232 cenas de ultrassom e 150 sinais com fotografia) não foi
curada link a link. O fluxo, reproduzível para uma próxima leva:

1. **Listar a fonte.** O POCUS Atlas é Squarespace: `GET /<coleção>?format=json`
   devolve título, `assetUrl` e autor de cada item. As coleções com galeria
   estão em `scripts/semiologia/BACKLOG.md`. Para o Commons, a API
   (`list=search` com `filetype:bitmap`, e `list=categorymembers` nas
   categorias médicas) devolve candidatos com licença em `extmetadata`.
2. **Mapear cena → título.** Um arquivo mestre por leva (cena, título PT e os
   títulos da fonte que a ilustram, até dois). O casamento é por igualdade e
   depois por substring; o que não casa é listado para revisão manual.
3. **Olhar.** Folhas de contato (`grade.py`) com os 12 melhores candidatos de
   cada sinal, filtrados por licença (PD, CC0, CC BY, CC BY-SA — nunca NC ou
   ND), largura mínima e sem histologia, mapa ou diagrama. Cada foto escolhida
   foi vista por uma pessoa antes de entrar. Sinais sem candidato honesto
   ficam sem foto — a lacuna é visível no catálogo.
4. **Gerar `curadoria.json`** a partir das escolhas, com legenda derivada da
   primeira frase da ficha e o crédito (autor · licença) vindo da API.
5. `npm run semiologia:acervo:gerar -- --baixar` e `espelhar`, como sempre.

O Commons devolve 429 com facilidade; o script já espera. Uma leva de ~800
arquivos leva algumas horas de download.

## O que o caso real acrescenta ao esquema

Ele não substitui. As figuras esquemáticas do módulo ensinam o **padrão** —
mesma geometria, mesmo código, duas otites que diferem só no que importa.
Fotografia ensina a **variação**: a otite que não parece a do livro, a janela
ruim entre costelas, o ganho mal ajustado. São competências distintas, e a
interface mostra as duas lado a lado.
