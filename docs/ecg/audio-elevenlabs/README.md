# Áudios da Área de Aprender — Manual de Eletrocardiograma

Roteiros de narração prontos para colar no **ElevenLabs**, um para cada lição da
trilha de ensino que aparece na aba **Aprender** do Manual de Eletrocardiograma
do **Domine Aqui** (`/manual-clinico/eletrocardiograma` → aba "Aprender").

São **11 módulos e 27 lições**, e existe **um arquivo de roteiro por lição**, na
mesma ordem em que a trilha desbloqueia os nós. O conteúdo de cada roteiro é
fiel ao currículo em `lib/ecg/course/modules/*.ts` — mesmos números, mesmos
macetes, mesmos casos clínicos —, só que reescrito para ser **ouvido**, não
lido: frases curtas, uma ideia por vez, tudo explicado do começo, sem supor que
quem escuta já sabe cardiologia.

---

## Como usar (passo a passo)

1. Abra o arquivo da lição que você quer narrar (índice no fim deste
   documento).
2. Copie **todo o conteúdo do bloco "Roteiro"** — é um bloco único, feito para
   uma única colagem.
3. No ElevenLabs, vá em **Text to Speech**, escolha a voz e o modelo indicados
   na "Ficha de produção" do arquivo, cole o texto e gere.
4. Salve o áudio com o mesmo nome do arquivo (ex.: `M01-L1-o-que-e-ecg.mp3`).

O roteiro **não contém marcações entre colchetes**. Isso é proposital: no
modelo Multilingual v2 qualquer coisa entre colchetes corre o risco de ser lida
em voz alta. O ritmo é controlado por pontuação e por quebras de parágrafo, que
funcionam em qualquer modelo. Quem quiser usar o **Eleven v3** encontra, no fim
de cada arquivo, uma seção opcional com as tags de entonação sugeridas e onde
inseri-las.

---

## Ficha de produção padrão

| Parâmetro | Valor recomendado | Por quê |
| --- | --- | --- |
| Modelo | `Eleven Multilingual v2` | Estabilidade em português do Brasil e leitura previsível de números. Use `Eleven v3` só se for inserir tags de entonação. |
| Idioma | Português (Brasil) | Os roteiros usam vocabulário e prosódia de pt-BR. |
| Voz | Voz masculina ou feminina adulta, timbre médio, dicção limpa | É aula, não locução publicitária. Evite vozes muito graves ou muito "narrador de documentário". |
| Stability | **50%** | Abaixo disso a voz inventa entonação em cima de números e siglas. |
| Similarity | **75%** | |
| Style exaggeration | **0% a 10%** | Estilo alto distorce a pronúncia de termos técnicos. |
| Speaker boost | Ligado | |
| Speed | **0.95** | Levemente abaixo do normal: é conteúdo denso e cheio de valores numéricos. |
| Formato de saída | MP3 128 kbps, 44.1 kHz | Suficiente para reprodução no app. |

**Mantenha a mesma voz e as mesmas configurações nas 27 lições.** Trilha é uma
experiência contínua; trocar de voz no meio quebra a sensação de curso.

---

## As três regras de escrita que os roteiros seguem

Quem for editar, traduzir ou criar novas lições precisa manter estas regras,
porque são elas que fazem o áudio sair bom na primeira tentativa.

### 1. Nenhum número aparece como símbolo

Sintetizador de voz erra abreviação. Então tudo vai escrito por extenso, do
jeito que se fala:

| Nunca escreva | Escreva assim |
| --- | --- |
| `120 ms` | cento e vinte milissegundos |
| `0,04 s` | zero vírgula zero quatro segundo |
| `25 mm/s` | vinte e cinco milímetros por segundo |
| `10 mm/mV` | dez milímetros por milivolt |
| `0,1 mV` | zero vírgula um milivolt |
| `60–100 bpm` | de sessenta a cem batimentos por minuto |
| `4 m/s` | quatro metros por segundo |
| `≥ 2,5 mm` | maior ou igual a dois vírgula cinco milímetros |
| `K⁺ 2,9 mEq/L` | potássio de dois vírgula nove miliequivalentes por litro |
| `32 °C` | trinta e dois graus |
| `−90 mV` | menos noventa milivolts |
| `2:1` | dois para um |

### 2. Derivações, ondas e siglas vão soletradas em português

O aparelho lê "aVR" como uma palavra estranha; escrito como se fala, sai
perfeito.

| Sigla | Como aparece no roteiro |
| --- | --- |
| D1, D2, D3 | dê um, dê dois, dê três |
| aVR, aVL, aVF | a vê érre, a vê ele, a vê éfe |
| V1 … V6 | vê um … vê seis |
| V4R, V7–V9 | vê quatro érre, vê sete, vê oito e vê nove |
| QRS | quê érre esse |
| Segmento ST | segmento esse tê |
| Intervalo PR | intervalo pê érre |
| QT / QTc | quê tê / quê tê cê |
| Intervalo RR / segmento TP | intervalo érre érre / segmento tê pê |
| Onda P, Q, R, S, T, U, J | onda pê, quê, érre, esse, tê, u, jota |
| ECG | eletrocardiograma (por extenso, sempre) |

Siglas de diagnóstico **nunca** aparecem como sigla: escreve-se "bloqueio de
ramo direito", "bloqueio divisional ântero-superior", "bloqueio átrio
ventricular total", "atividade elétrica sem pulso". A sigla é dita depois, entre
vírgulas, só quando o aluno precisa reconhecê-la na prova.

### 3. Uma ideia por frase, e o mecanismo antes do número

A ordem pedagógica de todos os roteiros é a mesma:

> **gancho** → **o que é** → **por que é assim (mecanismo)** → **o número** →
> **o macete** → **o erro clássico** → **o que fazer no app** → **recapitulação**

O número só entra depois que o mecanismo foi explicado. É o que permite ao aluno
reconstruir o valor esquecido em vez de simplesmente perdê-lo.

---

## Dicionário de pronúncia (nomes próprios)

Se a voz escolhida tropeçar em algum nome, substitua no texto pela grafia
fonética da direita, ou cadastre o par no **Pronunciation Dictionary** do
ElevenLabs (Voice Lab → Pronunciation Dictionaries, formato `.pls`, com regra do
tipo *alias*). O dicionário funciona nos modelos v2.

| Nome | Grafia fonética sugerida (pt-BR) |
| --- | --- |
| Einthoven | Aint-ôven |
| Goldberger | Gold-bérguer |
| Wilson | Uílson |
| Waller | Uóler |
| Keith-Flack | Kif-Flék |
| Aschoff-Tawara | Áchof-Tauára |
| Bachmann | Bákman |
| Wenckebach | Vênque-bak |
| Thorel | Torél |
| Purkinje | Purkínje |
| His | Hiss |
| Kent | Kent |
| Mobitz | Móbitz |
| Osborn | Ózborn |
| Wellens | Uélens |
| Sgarbossa | Zgarbóssa |
| Brugada | Brugáda |
| Sokolow-Lyon | Sokolôv-Láion |
| Cornell | Cornél |
| Bazett | Bazét |
| Fridericia | Friderícia |
| Stokes-Adams | Stóuks-Ádams |
| Frank-Starling | Frénk-Stárling |
| Bowditch | Bâu-ditch |
| Wolff-Parkinson-White | Uólf-Párkinson-Uáit |
| Nernst | Nérnst |
| Morrow | Mórrou |
| Bayés | Baiés |
| torsades de pointes | torsád de puant |

---

## Onde cada áudio entra no produto

Cada roteiro foi escrito para tocar **antes** da lição interativa correspondente
— funciona como a "aula expositiva" que prepara o aluno para os laboratórios e
as questões daquele nó da trilha. Por isso todo roteiro termina mandando a
pessoa de volta para a tela: é lá que estão o laboratório, o quiz e o XP.

Os identificadores de lição (`lesson.id`) citados nas fichas são os mesmos de
`lib/ecg/course/modules/*.ts`, então dá para amarrar arquivo de áudio a nó da
trilha sem ambiguidade.

---

## Índice das 27 lições

### Módulo 1 — A faísca *(onde nasce o impulso e por onde ele corre)*
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 1.1 | O que o ECG realmente mede | `o-que-e-ecg` | [`M01-L1-o-que-e-ecg.md`](./M01-L1-o-que-e-ecg.md) |
| 1.2 | O sistema de condução, peça por peça | `sistema-conducao` | [`M01-L2-sistema-conducao.md`](./M01-L2-sistema-conducao.md) |
| 1.3 | Frequências intrínsecas e a hierarquia | `frequencias-intrinsecas` | [`M01-L3-frequencias-intrinsecas.md`](./M01-L3-frequencias-intrinsecas.md) |
| 1.4 | Velocidades de condução | `velocidades-conducao` | [`M01-L4-velocidades-conducao.md`](./M01-L4-velocidades-conducao.md) |

### Módulo 2 — A célula *(potencial de ação e refratariedade)*
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 2.1 | O potencial de ação cardíaco | `potencial-acao` | [`M02-L1-potencial-acao.md`](./M02-L1-potencial-acao.md) |
| 2.2 | Períodos refratários | `refratariedade` | [`M02-L2-refratariedade.md`](./M02-L2-refratariedade.md) |
| 2.3 | Por que o coração não faz tetania | `tetania` | [`M02-L3-tetania.md`](./M02-L3-tetania.md) |

### Módulo 3 — As ondas *(construa o traçado do zero)*
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 3.1 | Por que P, Q, R, S, T? | `por-que-pqrst` | [`M03-L1-por-que-pqrst.md`](./M03-L1-por-que-pqrst.md) |
| 3.2 | Construindo o eletro, onda por onda | `construindo-o-eletro` | [`M03-L2-construindo-o-eletro.md`](./M03-L2-construindo-o-eletro.md) |
| 3.3 | Nomenclatura do QRS | `nomenclatura-qrs` | [`M03-L3-nomenclatura-qrs.md`](./M03-L3-nomenclatura-qrs.md) |
| 3.4 | Ondas com nome e sobrenome | `ondas-especiais` | [`M03-L4-ondas-especiais.md`](./M03-L4-ondas-especiais.md) |

### Módulo 4 — O papel *(tempo, voltagem, calibração e artefatos)*
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 4.1 | Ler o papel milimetrado | `papel-milimetrado` | [`M04-L1-papel-milimetrado.md`](./M04-L1-papel-milimetrado.md) |

### Módulo 5 — Intervalos e segmentos
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 5.1 | Intervalo não é segmento | `intervalo-vs-segmento` | [`M05-L1-intervalo-vs-segmento.md`](./M05-L1-intervalo-vs-segmento.md) |
| 5.2 | Valores normais e o que os altera | `medidas-normais` | [`M05-L2-medidas-normais.md`](./M05-L2-medidas-normais.md) |

### Módulo 6 — As derivações *(doze câmeras, um coração)*
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 6.1 | Plano frontal: Einthoven e Goldberger | `plano-frontal` | [`M06-L1-plano-frontal.md`](./M06-L1-plano-frontal.md) |
| 6.2 | Precordiais: o plano horizontal | `precordiais` | [`M06-L2-precordiais.md`](./M06-L2-precordiais.md) |
| 6.3 | O eixo elétrico | `eixo-eletrico` | [`M06-L3-eixo-eletrico.md`](./M06-L3-eixo-eletrico.md) |

### Módulo 7 — Frequência cardíaca
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 7.1 | Como medir a frequência cardíaca | `medir-fc` | [`M07-L1-medir-fc.md`](./M07-L1-medir-fc.md) |

### Módulo 8 — Quando a onda dá errado
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 8.1 | Onda P alterada | `onda-p-alterada` | [`M08-L1-onda-p-alterada.md`](./M08-L1-onda-p-alterada.md) |
| 8.2 | QRS alterado | `qrs-alterado` | [`M08-L2-qrs-alterado.md`](./M08-L2-qrs-alterado.md) |
| 8.3 | ST e onda T alterados | `st-e-t` | [`M08-L3-st-e-t.md`](./M08-L3-st-e-t.md) |

### Módulo 9 — Bloqueios
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 9.1 | Bloqueios atrioventriculares | `bloqueios-av` | [`M09-L1-bloqueios-av.md`](./M09-L1-bloqueios-av.md) |
| 9.2 | Bloqueios de ramo e fasciculares | `bloqueios-ramo` | [`M09-L2-bloqueios-ramo.md`](./M09-L2-bloqueios-ramo.md) |

### Módulo 10 — Eletrólitos e temperatura
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 10.1 | Potássio: o íon que manda no repouso | `potassio` | [`M10-L1-potassio.md`](./M10-L1-potassio.md) |
| 10.2 | Cálcio, magnésio e temperatura | `calcio-temperatura` | [`M10-L2-calcio-temperatura.md`](./M10-L2-calcio-temperatura.md) |

### Módulo 11 — A leitura sistemática
| # | Lição | `lesson.id` | Arquivo |
| --- | --- | --- | --- |
| 11.1 | Laudo em dez passos | `dez-passos` | [`M11-L1-dez-passos.md`](./M11-L1-dez-passos.md) |
| 11.2 | Caderno de macetes | `caderno-macetes` | [`M11-L2-caderno-macetes.md`](./M11-L2-caderno-macetes.md) |

---

## Aviso de conteúdo

Os roteiros são material educacional do **Domine Aqui** para estudantes e
profissionais de saúde. Condutas citadas (doses, ordem de tratamento,
indicações de marca-passo, reperfusão) servem ao aprendizado da leitura do
eletrocardiograma e não substituem protocolo institucional nem julgamento
clínico à beira do leito.
