# Importação de questões no Banco de Questões

Este documento é a especificação completa do formato de importação. Ele foi
escrito para ser lido por uma IA que precise **gerar um arquivo de questões
pronto para colar** na tela `/admin/banco-questoes/importar`.

Se você é um modelo de linguagem gerando questões: leia até o fim, use o
formato exatamente como descrito e produza **apenas o conteúdo do arquivo**, sem
cercas de código, sem comentários seus e sem texto de apresentação.

---

## 1. Como o banco é organizado

Três níveis, do maior para o menor:

```
Módulo  →  Tópico  →  Subtópico (opcional)
```

- **Módulo** — a grande área. Ex.: `Cardiologia`, `Anatomia`, `Medicina`.
- **Tópico** — o assunto dentro do módulo. Ex.: `Arritmias`, `Membros superiores`.
- **Subtópico** — o recorte fino, opcional. Ex.: `Fibrilação atrial`.

Não existe nível de "período". Ele foi removido do produto: exigia que o aluno
soubesse o nome interno da grade da faculdade antes de ver qualquer questão, e
fazia o mesmo módulo existir duas vezes em períodos diferentes sem que ninguém
percebesse. **Se você encontrar `PERÍODO:` em material antigo, ignore a linha.**

A hierarquia é criada sozinha durante a importação: se o módulo, o tópico ou o
subtópico ainda não existirem, eles são criados na hora. O casamento é por nome,
sem diferenciar maiúsculas, minúsculas nem acentos — `Cardiologia`,
`cardiologia` e `CARDIOLOGIA` são o mesmo módulo. Escreva o nome do jeito que
deve aparecer na tela.

---

## 2. Formato do arquivo

Texto puro (`.txt`). Cada questão é um bloco. Os blocos são separados por uma
linha em branco antes do marcador de tipo — o marcador é o que abre uma questão
nova.

Um separador `---` entre blocos também funciona, por compatibilidade com
arquivos antigos. Não é necessário.

### 2.1 Questão objetiva

```
[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
SUBTÓPICO: Fibrilação atrial
DIFICULDADE: medio
TAGS: eletrocardiograma, anticoagulação
FONTE: Prova de Clínica Médica 2023
ANO: 2023
ENUNCIADO: Homem de 68 anos, hipertenso, chega ao pronto-socorro com palpitações
há 6 horas. O eletrocardiograma mostra ritmo irregularmente irregular, sem ondas
P identificáveis.
Qual é a conduta inicial mais apropriada?
A) Cardioversão elétrica imediata
B) Controle de frequência com betabloqueador
C) Adenosina em bolus
D) Manobra vagal
E) Marca-passo transvenoso
CORRETA: B
EXPLICAÇÃO: O paciente está estável, então a prioridade é controle de frequência.
A cardioversão imediata (A) é reservada à instabilidade hemodinâmica. Adenosina
(C) e manobra vagal (D) atuam em taquicardias por reentrada nodal, não em
fibrilação atrial. Marca-passo (E) não tem indicação aqui.
```

### 2.2 Questão discursiva

```
[DISCURSIVA]
MÓDULO: Cardiologia
TÓPICO: Insuficiência cardíaca
ENUNCIADO: Explique o mecanismo pelo qual os inibidores da ECA reduzem a
mortalidade na insuficiência cardíaca com fração de ejeção reduzida.
RESPOSTA: Bloqueiam a conversão de angiotensina I em angiotensina II, reduzindo
vasoconstrição e a retenção de sódio, e atenuando o remodelamento ventricular.
EXPLICAÇÃO: Espera-se que o aluno cite o eixo renina-angiotensina-aldosterona e
o remodelamento ventricular. Citar apenas a queda da pressão arterial é
insuficiente.
```

---

## 3. Campos

| Campo | Obrigatório | Onde vale | Observação |
|---|---|---|---|
| `[OBJETIVA]` / `[DISCURSIVA]` | **sim** | primeira linha do bloco | abre a questão |
| `MÓDULO:` | **sim** | todas | criado se não existir |
| `TÓPICO:` | **sim** | todas | criado se não existir, dentro do módulo |
| `SUBTÓPICO:` | não | todas | criado se não existir, dentro do tópico |
| `ENUNCIADO:` | **sim** | todas | pode ocupar várias linhas |
| `A)` … `E)` | **sim** | objetiva | mínimo 2, máximo 5 alternativas |
| `CORRETA:` | **sim** | objetiva | uma letra de `A` a `E` |
| `RESPOSTA:` | **sim** | discursiva | resposta modelo, pode ocupar várias linhas |
| `EXPLICAÇÃO:` | recomendado | todas | resposta comentada, várias linhas |
| `DIFICULDADE:` | não | todas | `facil`, `medio` ou `dificil` (sem acento) |
| `TAGS:` | não | todas | separadas por vírgula |
| `FONTE:` | não | todas | de onde a questão veio |
| `ANO:` | não | todas | quatro dígitos |
| `IMAGEM:` | não | todas | URL pública e direta da imagem |

### Regras de escrita

- **Campos multilinha.** `ENUNCIADO:`, `RESPOSTA:` e `EXPLICAÇÃO:` continuam nas
  linhas seguintes até que apareça outro campo conhecido ou uma alternativa.
- **Quebra de linha explícita.** `\n` no meio do texto vira quebra de linha real.
- **Acentos nos rótulos são opcionais.** `MODULO:` = `MÓDULO:`,
  `EXPLICACAO:` = `EXPLICAÇÃO:`.
- **Alternativas** vão sempre no formato `LETRA) texto`, uma por linha, em
  ordem. Não numere; não use `a)` minúsculo.
- **Nada de markdown de cabeçalho** (`#`) nem cercas de código no arquivo.
  Negrito com `**` é aceito dentro dos textos.

---

## 4. O que faz uma questão ser recusada

O importador valida bloco a bloco e devolve a linha de cada erro. Uma questão
recusada não impede as outras de entrarem.

- tipo ausente (nem `[OBJETIVA]` nem `[DISCURSIVA]`);
- `MÓDULO:` ou `TÓPICO:` ausente;
- `ENUNCIADO:` vazio;
- objetiva com menos de 2 alternativas;
- objetiva sem `CORRETA:` ou com letra fora de `A`–`E`;
- discursiva sem `RESPOSTA:`.

---

## 5. Instruções para uma IA gerando o arquivo

Ao ser encarregado de produzir questões neste formato:

1. **Produza só o arquivo.** Nada antes, nada depois. Sem ```` ``` ````.
2. **Uma linha em branco entre blocos.** É o que separa uma questão da seguinte.
3. **Escreva a `EXPLICAÇÃO:` sempre.** Uma questão sem resposta comentada é
   metade do produto: o aluno descobre que errou e não descobre por quê.
4. **Na objetiva, comente também os distratores.** Diga por que cada alternativa
   errada é errada — é o que transforma o erro em estudo.
5. **Uma ideia por questão.** Enunciado com dois comandos vira uma questão que
   não dá para corrigir.
6. **Não invente fonte nem ano.** Se não souber, omita os campos.
7. **Não repita o comando dentro do enunciado e fora dele.**
8. **Mantenha os nomes de hierarquia estáveis** entre as questões do mesmo lote.
   `Cardiologia` em uma questão e `Cardio` na seguinte criam dois módulos.

### Molde para copiar

```
[OBJETIVA]
MÓDULO: <área>
TÓPICO: <assunto>
SUBTÓPICO: <recorte, opcional>
DIFICULDADE: <facil|medio|dificil>
ENUNCIADO: <caso ou pergunta>
A) <alternativa>
B) <alternativa>
C) <alternativa>
D) <alternativa>
E) <alternativa>
CORRETA: <letra>
EXPLICAÇÃO: <por que a correta está certa e por que cada distrator está errado>
```

---

## 6. O outro caminho: importar das Provas da Faculdade

Questões que já existem em `/provas` **não devem ser redigitadas neste formato**.
Existe uma importação direta em `/admin/banco-questoes/importar-provas`, em que o
administrador escolhe grupos de provas e as questões entram com gabarito e
resposta comentada.

O mapeamento é este:

| No banco | Vem de |
|---|---|
| Módulo | nome do grupo escolhido pelo administrador |
| Tópico | caminho do grupo da prova relativo à escolha, unido por ` › ` |
| Subtópico | título da prova |
| Fonte | título da prova |
| Ano | ano da data da prova |
| Explicação | comentário por alternativa da prova, quando houver |

Cada questão importada carrega um carimbo de origem
(`origem: { tipo: 'prova', examId, questaoId }`). É ele que faz a **segunda
importação atualizar em vez de duplicar** — reimportar o mesmo grupo depois de
corrigir um gabarito na prova corrige a questão no banco.

Ficam de fora: redações, questões sem enunciado, objetivas com menos de duas
alternativas e objetivas sem alternativa correta marcada. A tela lista o que
ficou de fora e por quê.
