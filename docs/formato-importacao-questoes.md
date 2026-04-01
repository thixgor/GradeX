# Formato de Importação de Questões via TXT

Este documento descreve o formato de arquivo `.txt` utilizado para importar questões na criação de Provas Gerais no sistema DomineAqui/GradeX.

## Estrutura Geral

Cada questão começa com um **cabeçalho** que define o tipo, seguido por campos no formato `CAMPO:"valor"`. Questões são separadas por seus cabeçalhos.

Todos os valores devem estar entre aspas duplas: `CAMPO:"valor aqui"`. Se o campo for vazio, use aspas vazias: `CAMPO:""`.

---

## Tipos de Questão

### 1. Múltipla Escolha

**Cabeçalho:** `--Q{numero}-MULTIPLA-ESCOLHA`

Exemplo: `--Q1-MULTIPLA-ESCOLHA`, `--Q2-MULTIPLA-ESCOLHA`

**Campos obrigatórios:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `ENUNCIADO` | Texto do enunciado da questão | `ENUNCIADO:"Qual é a capital do Brasil?"` |
| `ALT-A` | Texto da alternativa A | `ALT-A:"São Paulo"` |
| `ALT-B` | Texto da alternativa B | `ALT-B:"Rio de Janeiro"` |
| `ALT-C` | Texto da alternativa C | `ALT-C:"Brasília"` |
| `ALT-D` | Texto da alternativa D | `ALT-D:"Salvador"` |
| `ALT-E` | Texto da alternativa E | `ALT-E:"Belo Horizonte"` |
| `ALT-CORRETA` | Letra da alternativa correta (A-E) | `ALT-CORRETA:"C"` |

**Campos opcionais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `FONTE-ENUNCIADO` | Fonte/referência do enunciado | `FONTE-ENUNCIADO:"ENEM 2023"` |
| `URL-IMAGEM-QUESTAO` | URL de uma imagem associada | `URL-IMAGEM-QUESTAO:"https://exemplo.com/img.png"` |
| `COMANDO-QUESTÃO` | Comando/instrução da questão | `COMANDO-QUESTÃO:"Assinale a alternativa correta"` |
| `RESPOSTA-COMENTADA` | Explicação/gabarito comentado | `RESPOSTA-COMENTADA:"Brasília é a capital desde 1960..."` |
| `DISCRIMINACAO-QUESTAO-PARAMETROA-TRI` | Parâmetro A da TRI (discriminação) | `DISCRIMINACAO-QUESTAO-PARAMETROA-TRI:"1.2"` |
| `DIFICULDADE-QUESTAO-PARAMETROB-TRI` | Parâmetro B da TRI (dificuldade) | `DIFICULDADE-QUESTAO-PARAMETROB-TRI:"0.5"` |
| `ACERTOAOACASO-QUESTAO-PARAMETROC-TRI` | Parâmetro C da TRI (acerto ao acaso) | `ACERTOAOACASO-QUESTAO-PARAMETROC-TRI:"0.2"` |

**Exemplo completo:**
```
--Q1-MULTIPLA-ESCOLHA
ENUNCIADO:"Paciente de 65 anos, hipertenso, apresenta dor torácica súbita. Qual o diagnóstico mais provável?"
FONTE-ENUNCIADO:"Prova de Residência USP 2023"
URL-IMAGEM-QUESTAO:""
COMANDO-QUESTÃO:"Assinale a alternativa correta"
ALT-A:"Pneumonia"
ALT-B:"Infarto agudo do miocárdio"
ALT-C:"Embolia pulmonar"
ALT-D:"Dissecção de aorta"
ALT-E:"Pneumotórax"
ALT-CORRETA:"B"
RESPOSTA-COMENTADA:"O quadro clássico de IAM inclui dor torácica súbita em paciente com fatores de risco cardiovascular como hipertensão arterial. A dor é tipicamente precordial, em aperto, com irradiação para membro superior esquerdo."
DISCRIMINACAO-QUESTAO-PARAMETROA-TRI:"1.5"
DIFICULDADE-QUESTAO-PARAMETROB-TRI:"0.3"
ACERTOAOACASO-QUESTAO-PARAMETROC-TRI:"0.2"
```

---

### 2. Discursiva

**Cabeçalho:** `--Q{numero}-DISCURSIVA`

Exemplo: `--Q1-DISCURSIVA`, `--Q3-DISCURSIVA`

**Campos obrigatórios:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `ENUNCIADO` | Texto do enunciado da questão | `ENUNCIADO:"Descreva o mecanismo de ação dos betabloqueadores"` |

**Campos opcionais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `FONTE-ENUNCIADO` | Fonte/referência do enunciado | `FONTE-ENUNCIADO:"Prova UERJ 2024"` |
| `URL-IMAGEM-QUESTAO` | URL de uma imagem associada | `URL-IMAGEM-QUESTAO:""` |
| `COMANDO-QUESTÃO` | Comando/instrução da questão | `COMANDO-QUESTÃO:"Descreva detalhadamente"` |
| `PONTOS-CHAVE-E-SEUS-PESOS` | Pontos-chave com pesos para correção | Ver formato abaixo |
| `RESPOSTA-COMENTADA` | Resposta modelo/gabarito comentado | `RESPOSTA-COMENTADA:"Os betabloqueadores agem..."` |

**Formato de PONTOS-CHAVE-E-SEUS-PESOS:**
Os pontos são separados por `;` e cada ponto tem o formato `descrição_peso`:
```
PONTOS-CHAVE-E-SEUS-PESOS:"Mencionar receptores beta_0.3 ; Explicar bloqueio competitivo_0.4 ; Citar efeitos clínicos_0.3"
```
- Os pesos devem somar 1.0 (100%)
- O separador entre descrição e peso é `_` (underscore)
- O separador entre pontos é `;` (ponto e vírgula)

**Exemplo completo:**
```
--Q2-DISCURSIVA
ENUNCIADO:"Descreva o mecanismo de ação dos betabloqueadores e suas principais indicações clínicas."
FONTE-ENUNCIADO:"Prova de Residência UNICAMP 2024"
URL-IMAGEM-QUESTAO:""
COMANDO-QUESTÃO:"Descreva detalhadamente, incluindo mecanismo farmacológico e aplicações terapêuticas"
PONTOS-CHAVE-E-SEUS-PESOS:"Mencionar receptores beta-adrenérgicos_0.25 ; Explicar bloqueio competitivo_0.25 ; Citar indicações: HAS, ICC, arritmias_0.3 ; Mencionar contraindicações_0.2"
RESPOSTA-COMENTADA:"Os betabloqueadores são antagonistas competitivos dos receptores beta-adrenérgicos. Eles bloqueiam a ação das catecolaminas (adrenalina e noradrenalina) nos receptores beta-1 e beta-2. As principais indicações incluem hipertensão arterial, insuficiência cardíaca crônica, arritmias supraventriculares e angina pectoris."
```

---

### 3. Redação

**Cabeçalho:** `--REDAÇÃO`

(Não precisa de número, pois geralmente há apenas uma redação por prova)

**Campos obrigatórios:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `ENUNCIADO` | Contexto/texto motivador da redação | `ENUNCIADO:"Dados sobre saúde mental no Brasil..."` |

**Campos opcionais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `FONTE-ENUNCIADO` | Fonte do texto motivador | `FONTE-ENUNCIADO:"ENEM 2023"` |
| `URL-IMAGEM-REDAÇÃO` | URL de imagem de apoio | `URL-IMAGEM-REDAÇÃO:""` |
| `COMANDO-REDAÇÃO` | Instrução da redação | `COMANDO-REDAÇÃO:"Redija um texto dissertativo-argumentativo..."` |
| `TEMA-REDAÇÃO` | Tema central da redação | `TEMA-REDAÇÃO:"Os desafios para a saúde mental no Brasil"` |
| `TEXTOS DE APOIO` | Textos motivadores separados por `---` | Ver formato abaixo |
| `RESPOSTA-COMENTADA` | Comentário/orientação sobre a redação | `RESPOSTA-COMENTADA:"Uma boa redação deve abordar..."` |

**Formato de TEXTOS DE APOIO:**
Múltiplos textos são separados por `---` (três traços):
```
TEXTOS DE APOIO:"Texto 1: Dados estatísticos sobre depressão... --- Texto 2: Artigo sobre políticas públicas... --- Texto 3: Citação de especialista..."
```

**Exemplo completo:**
```
--REDAÇÃO
ENUNCIADO:"A saúde mental tem se tornado um tema cada vez mais relevante no cenário brasileiro contemporâneo."
FONTE-ENUNCIADO:"Proposta própria"
URL-IMAGEM-REDAÇÃO:""
COMANDO-REDAÇÃO:"A partir da leitura dos textos motivadores, redija um texto dissertativo-argumentativo em modalidade formal da língua portuguesa sobre o tema proposto"
TEMA-REDAÇÃO:"Os desafios para a valorização da saúde mental no Brasil"
TEXTOS DE APOIO:"Texto 1: Segundo a OMS, o Brasil é o país com maior prevalência de ansiedade no mundo. --- Texto 2: A Lei 10.216/2001 dispõe sobre a proteção dos direitos das pessoas com transtornos mentais. --- Texto 3: 'A saúde mental deve ser vista como prioridade de saúde pública' - Dr. Drauzio Varella"
RESPOSTA-COMENTADA:"Uma boa redação sobre este tema deve apresentar tese clara sobre os desafios da saúde mental, argumentar com dados e referências dos textos de apoio, e propor intervenção detalhada."
```

---

## Arquivo Misto (Múltiplos Tipos)

Você pode combinar diferentes tipos de questão no mesmo arquivo. O sistema identifica automaticamente o tipo pelo cabeçalho:

```
--Q1-MULTIPLA-ESCOLHA
ENUNCIADO:"Primeira questão objetiva..."
ALT-A:"Opção A"
ALT-B:"Opção B"
ALT-C:"Opção C"
ALT-D:"Opção D"
ALT-E:"Opção E"
ALT-CORRETA:"A"
RESPOSTA-COMENTADA:"Explicação da questão 1..."

--Q2-DISCURSIVA
ENUNCIADO:"Questão discursiva..."
COMANDO-QUESTÃO:"Explique detalhadamente"
PONTOS-CHAVE-E-SEUS-PESOS:"Ponto 1_0.5 ; Ponto 2_0.5"
RESPOSTA-COMENTADA:"Resposta modelo da questão 2..."

--Q3-MULTIPLA-ESCOLHA
ENUNCIADO:"Outra questão objetiva..."
ALT-A:"Opção A"
ALT-B:"Opção B"
ALT-C:"Opção C"
ALT-D:"Opção D"
ALT-E:"Opção E"
ALT-CORRETA:"D"

--REDAÇÃO
ENUNCIADO:"Contexto para redação..."
TEMA-REDAÇÃO:"Tema da redação"
COMANDO-REDAÇÃO:"Redija um texto..."
```

---

## Regras Importantes

1. **Cabeçalho obrigatório:** Toda questão deve começar com seu cabeçalho (`--Q{n}-MULTIPLA-ESCOLHA`, `--Q{n}-DISCURSIVA` ou `--REDAÇÃO`)
2. **Aspas duplas:** Todos os valores devem estar entre aspas duplas: `CAMPO:"valor"`
3. **Campos vazios:** Use aspas vazias para campos opcionais não preenchidos: `CAMPO:""`
4. **Numeração automática:** O sistema renumera automaticamente as questões na ordem em que aparecem
5. **Case insensitive:** Os nomes dos campos não diferenciam maiúsculas/minúsculas
6. **Linhas em branco:** Linhas em branco entre campos são ignoradas
7. **Número de alternativas:** O número de alternativas (A-E) é configurável na criação da prova (padrão: 5)
