# Cronogramas, avaliações e lembretes

Guia da área de cronogramas: o que existe, onde mora e o que precisa estar
configurado para os lembretes saírem.

## Mapa

| Peça | Onde |
| --- | --- |
| Leitor do markdown da ementa | `lib/cronogramas/analisar-ementa.ts` |
| Ementa no banco | `lib/cronogramas/ementa.ts` |
| Importação (painel) | `components/cronogramas/importar-ementa.tsx` |
| Vocabulário compartilhado | `lib/cronogramas/tipos.ts` |
| Calendário de Brasília | `lib/cronogramas/brasilia.ts` |
| Geração do plano | `lib/cronogramas/gerador.ts` |
| Agenda e texto dos lembretes | `lib/cronogramas/lembretes.ts` |
| Acesso ao banco | `lib/cronogramas/avaliacoes-servidor.ts` |
| Tela do aluno | `app/cronogramas/` |
| Painel | `app/admin/cronogramas/` |
| Disparo dos lembretes | `app/api/cron/avaliacoes-lembretes/` |
| Testes | `__tests__/cronogramas/` |

## Ementa

A ementa é **conteúdo, não código**: o admin importa em `/admin/cronogramas`,
aba **Ementas**, e passa a valer na hora — sem editar arquivo, sem build, sem
deploy. Cada (seção, período) é um documento em `cronograma_ementas`.

Na tela dá para arrastar vários `.md` de uma vez; a seção e o período saem do
nome de cada arquivo e podem ser corrigidos antes de gravar. A tela mostra o
que o parser leu de cada arquivo (tópicos, módulos, quantos itens com
prioridade declarada) **antes** de importar — ler antes de gravar é o que evita
descobrir que um arquivo veio truncado depois de ele já ter substituído um
período inteiro.

Os arquivos em `public/*.md` continuam no repositório como material de origem
para copiar e colar, mas o app não os lê mais.

Dois formatos são aceitos, e o parser decide o nível pelo rótulo escrito na
linha, não pela indentação:

```
# Árvore (Medicina)
TÓPICO: SOI I:
1. Subtópico: BASES CELULARES (Prioridade: Alta)
├─ Módulo: Ciclo celular (Prioridade: Alta)
│   ├─ Submódulo: Interfase e fase M (Prioridade: Alta)

# Citação (Psicologia, Biomedicina, Odontologia)
## 1º PERÍODO
**TÓPICO: Competência Relacional**
> SUBTÓPICO: Comunicação Interpessoal
> > MÓDULO: Escuta ativa e empatia
> > > SUBMÓDULO: Técnicas de escuta sem julgamento
```

`(Prioridade: Alta | Média | Baixa)` é opcional em qualquer nível. Quem não
declara nada entra como **normal** — a regra combinada: se não estiver
estabelecido, trate como normal.

**Vários arquivos no mesmo período.** Em Medicina, SOI I e HAM I são os dois o
1º período. Suba os dois juntos e eles viram uma ementa só; para acrescentar um
a um período já importado depois, marque *"Somar aos tópicos já importados"* —
sem isso a importação substitui o período inteiro. Tópico de mesmo nome é
atualizado, nunca duplicado.

**Ids são derivados do nome**, não da posição. Reimportar com um tópico a mais
no topo não renumera o resto, então as avaliações que apontam para um subtópico
continuam apontando para o mesmo assunto.

## Geração do plano

`gerarCronograma()` produz duas correntes de atividade:

- **Conteúdo novo**, na ordem da ementa, com prioridade Alta puxada para
  frente e blocos de no máximo 2h. Conteúdo cobrado por uma avaliação nas
  próximas três semanas fura a fila, ordenado pela data da prova.
- **Revisões**, agendadas quando o módulo fecha, em intervalos crescentes.
  A escada sai da prioridade — Alta percorre `1-3-7-16-35` dias, a do meio
  `1-5-14`, Baixa `2-12`. Revisão tem precedência sobre conteúdo novo quando o
  dia aperta.

A véspera de cada avaliação vira bloco de reta final (revisão geral +
questões). `dataTermino` limita só o conteúdo novo: as revisões podem passar
dela, e o que não coube volta em `horasNaoAlocadas`, que a tela de criação
mostra antes de salvar.

## Avaliações e lembretes

Coleções:

- `cronograma_ementas` — um documento por (seção, período), com os tópicos
  inteiros dentro. Índice único no par.
- `cronograma_avaliacoes` — a avaliação, com a config de lembrete dentro.
  Pertence a uma **seção** e um **período**, não a um aluno.
- `cronograma_preferencias` — a seção que o aluno acompanha e o opt-in
  (`lembretesAtivos`).
- `cronograma_lembretes_enviados` — registro de disparos, com índice único em
  `(avaliacaoId, userId, dia)` e TTL de 90 dias.

O admin configura, por avaliação, em `/admin/cronogramas`: quando começar a
lembrar (dias antes), a frequência (N dias ou N semanas), o horário do envio e
o interruptor de liga/desliga. Tudo em **America/Sao_Paulo**. A tela mostra a
prévia dos próximos envios usando a mesma função que o cron usa.

### Regras de envio

O lembrete só sai quando **todas** valem:

1. A avaliação está publicada e com `lembrete.ativo`.
2. Hoje (em Brasília) é um dos dias da agenda e já passou do horário.
3. O aluno ativou "Quero receber lembretes das minhas avaliações" no próprio
   calendário.
4. O aluno acompanha aquela seção e período.
5. Não existe registro de envio dessa avaliação para ele hoje.

A contagem de dias sai do dia da prova para trás, então o último lembrete cai
sempre no dia dela.

### Configuração

O gatilho é **externo**: cron-job.org batendo em
`/api/cron/avaliacoes-lembretes` a cada 5 minutos. Passo a passo em
[`docs/LEMBRETES_AVALIACOES_CRONJOB.md`](docs/LEMBRETES_AVALIACOES_CRONJOB.md).

A rota não entra em `crons` no `vercel.json` de propósito: o plano Hobby roda
cron 1x por dia e o teto de jobs já está tomado. Uma execução diária não
serviria, porque o horário de envio é escolhido por avaliação, com precisão de
minuto — um lembrete das 19:30 sairia às 20:00.

A rota exige `CRON_SECRET` via `Authorization: Bearer`, header
`x-cron-secret` ou query `?secret=`/`?token=`. Sem o segredo responde 401 e
ninguém é lembrado.

Bater de 5 em 5 minutos é seguro: da segunda chamada do dia em diante, toda
tentativa esbarra no índice único e o relatório volta com `enviados: 0` e
`duplicadosEvitados` no lugar.

## Testes

```bash
npx vitest run __tests__/cronogramas
```

Cobrem o calendário de Brasília, a agenda e o texto dos lembretes, o gerador
(capacidade dos dias, ordem das revisões, prazo das avaliações) e o parser da
ementa — este último contra os arquivos reais de `public/`, que é onde moram os
casos que quebram de verdade: indentação inconsistente, `└─` fora de lugar,
negrito no meio do rótulo.
