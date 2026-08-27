# Cronogramas, avaliações e lembretes

Guia da área de cronogramas: o que existe, onde mora e o que precisa estar
configurado para os lembretes saírem.

## Mapa

| Peça | Onde |
| --- | --- |
| Ementa (dados gerados) | `data/cronogramas/ementas/*.json` |
| Gerador da ementa | `scripts/cronogramas/construir-ementas.mjs` |
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

A fonte de verdade são os arquivos em `public/*.md`, mantidos à mão. Depois de
editar qualquer um deles:

```bash
npm run cronogramas:ementas
```

O script regrava `data/cronogramas/ementas/` (um JSON por curso mais um
`indice.json`) e imprime a conciliação. **O JSON gerado vai para o
repositório** — o build não roda o script, e a rota `/api/cronogramas/ementa`
serve exatamente esses arquivos.

Dois formatos de markdown são aceitos, e o parser decide o nível pelo rótulo
escrito na linha, não pela indentação:

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

Quando dois arquivos descrevem o mesmo bloco (`MEDICINA SOI I.md` e
`MEDICINA - SOI I.md`), vence o que tem prioridade declarada; contagem de nós
desempata.

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

`/api/cron/avaliacoes-lembretes` roda de hora em hora (`vercel.json`). Fora da
Vercel — que envia `x-vercel-cron` —, a rota exige `CRON_SECRET` via
`Authorization: Bearer`, header `x-cron-secret` ou query `?secret=`/`?token=`.
Sem o segredo a rota responde 401 e ninguém é lembrado.

Cadência de hora em hora, e não uma vez por dia, porque o horário de envio é
por avaliação: um lembrete marcado para 07:00 e outro para 21:00 precisam dos
dois momentos.

## Testes

```bash
npx vitest run __tests__/cronogramas
```

Cobrem o calendário de Brasília, a agenda e o texto dos lembretes, o gerador
(capacidade dos dias, ordem das revisões, prazo das avaliações) e a integridade
da ementa gerada — inclusive que as prioridades declaradas em SOI I e HAM I
chegaram ao JSON.
