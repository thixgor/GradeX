# Formato de Importacao de Patologias — Manual Clinico

## O que e este formato?

Este documento descreve o formato padrao de texto para importar patologias no Manual Clinico do Domine Aqui. Ao seguir este formato, voce pode criar um arquivo `.txt` (ou colar o texto diretamente no painel) e importar uma ou varias patologias de uma so vez.

---

## Como funciona?

1. Acesse o painel administrativo: `/admin/manual-clinico/importar`
2. Escolha entre **colar texto** ou **upload de arquivo .txt**
3. Clique em **Pre-visualizar** para verificar se tudo esta correto
4. Corrija eventuais erros indicados na pre-visualizacao
5. Clique em **Importar** para salvar as patologias no banco de dados

---

## Formato dos campos

Cada campo deve comecar com `##CAMPO:` seguido do conteudo. O conteudo pode ocupar varias linhas, ate o proximo campo (`##`).

### Campos obrigatorios

| Campo | Descricao | Exemplo |
|---|---|---|
| `##NOME:` | Nome completo da patologia | Hipertensao Arterial Sistemica |
| `##AREAS:` | Areas de saude, separadas por `;` | Medicina; Biomedicina |
| `##SISTEMA:` | Sistema fisiologico (ver lista abaixo) | Sistema Cardiovascular |
| `##CID10:` | Codigo CID-10 | I10 |
| `##CLASSIFICACAO:` | Classificacao clinica/etiologica | (texto livre) |
| `##FISIOPATOLOGIA:` | Mecanismo fisiopatologico detalhado | (texto livre) |
| `##DIAGNOSTICO_SEMIOLOGICO:` | Sinais, sintomas e exame fisico | (texto livre) |
| `##DIAGNOSTICOS_DIFERENCIAIS:` | Diagnosticos diferenciais | (texto livre) |
| `##GRAVIDADE:` | Escala de gravidade | Leve / Moderada / Grave |
| `##TRATAMENTO:` | Abordagem terapeutica geral | (texto livre) |
| `##FARMACOLOGIA_PRIMEIRA_LINHA:` | Farmacos de 1a linha (ver formato abaixo) | (formato especifico) |
| `##FARMACOLOGIA_SEGUNDA_LINHA:` | Farmacos de 2a linha | (formato especifico) |
| `##FLUXOGRAMA_TRATAMENTO:` | Fluxo decisorio de tratamento | (texto livre) |

### Campos opcionais

| Campo | Descricao |
|---|---|
| `##SINONIMOS:` | Nomes alternativos separados por `;` |
| `##FARMACOLOGIA_TERCEIRA_LINHA:` | Farmacos de 3a linha |
| `##OBSERVACOES_CLINICAS:` | Perlas clinicas e alertas |
| `##REFERENCIAS:` | Referencias bibliograficas |
| `##IMAGENS_MECANISMO:` | URLs de imagens, separadas por `;` ou quebra de linha |
| `##LEGENDA_IMAGENS:` | Legendas das imagens, separadas por `;` |

---

## Sistemas fisiologicos validos

Use exatamente um dos nomes abaixo no campo `##SISTEMA:`:

- Sistema Cardiovascular
- Sistema Respiratorio
- Sistema Nervoso Central e Periferico
- Sistema Digestivo e Hepatobiliar
- Sistema Endocrino e Metabolico
- Sistema Renal e Urinario
- Sistema Musculoesqueletico
- Sistema Imunologico e Reumatologico
- Sistema Hematologico
- Sistema Dermatologico
- Sistema Reprodutor e Ginecologico
- Saude Mental e Transtornos Psiquiatricos
- Sistema Estomatognatico e Saude Bucal
- Doencas Infecciosas e Parasitarias
- Oncologia Geral

## Areas de saude validas

Use uma ou mais, separadas por `;`:

- Medicina
- Psicologia
- Odontologia
- Biomedicina

---

## Formato dos farmacos

Dentro de cada campo de farmacologia (`##FARMACOLOGIA_PRIMEIRA_LINHA:`, etc.), cada farmaco deve seguir este formato:

```
Medicamento: Nome do farmaco
Classe: Classe farmacologica
Mecanismo de Acao: Descricao do mecanismo
Dose Usual: Dose e posologia
Efeitos Colaterais: efeito1; efeito2; efeito3
Contraindicacoes: contra1; contra2
```

Para incluir **varios farmacos** na mesma linha, separe-os com `---`:

```
Medicamento: Losartana
Classe: BRA
Mecanismo de Acao: Bloqueia receptores AT1 da angiotensina II
Dose Usual: 50-100mg/dia
Efeitos Colaterais: Tontura; Hipercalemia
Contraindicacoes: Gestantes; Estenose bilateral de arteria renal
---
Medicamento: Enalapril
Classe: IECA
Mecanismo de Acao: Inibe a enzima conversora de angiotensina
Dose Usual: 5-40mg/dia
Efeitos Colaterais: Tosse seca; Hipercalemia; Angioedema
Contraindicacoes: Gestantes; Hipercalemia
```

---

## Exemplo completo: Hipertensao Arterial Sistemica

```
##NOME: Hipertensao Arterial Sistemica
##SINONIMOS: HAS; hipertensao; pressao alta
##AREAS: Medicina; Biomedicina
##SISTEMA: Sistema Cardiovascular
##CID10: I10
##CLASSIFICACAO: Primaria (essencial) - 90-95% dos casos, sem causa identificavel
Secundaria - 5-10%, causas identificaveis: renovascular, endocrina, farmacologica, apneia do sono
Classificacao por estagio (SBC 2020):
- PA otima: <120/80 mmHg
- PA normal: 120-129/80-84 mmHg
- Pre-hipertensao: 130-139/85-89 mmHg
- Estagio 1: 140-159/90-99 mmHg
- Estagio 2: 160-179/100-109 mmHg
- Estagio 3: >=180/>=110 mmHg
##FISIOPATOLOGIA: A HAS resulta da interacao entre fatores geneticos e ambientais que levam ao aumento sustentado da resistencia vascular periferica (RVP) e/ou do debito cardiaco (DC).

Mecanismos principais:
1. Ativacao do SRAA: Aumento de angiotensina II causa vasoconstricao, retencao de sodio e remodelamento vascular
2. Hiperatividade simpatica: Excesso de catecolaminas aumenta FC e RVP
3. Disfuncao endotelial: Reducao de oxido nitrico (NO) e aumento de endotelina-1
4. Retencao renal de sodio: Expansao volemica por disfuncao dos mecanismos de natriurese
5. Rigidez arterial: Remodelamento da parede com deposito de colageno e perda de elastina
##DIAGNOSTICO_SEMIOLOGICO: Sintomas: A maioria e assintomatica (assassina silenciosa). Quando sintomatica: cefaleia occipital matinal, tontura, zumbido, epistaxe, dispneia aos esforcos.

Exame fisico:
- Medicao da PA em ambos os bracos (considerar maior valor)
- Fundoscopia: classificacao de Keith-Wagener (graus I a IV)
- Ausculta cardiaca: B4 (sobrecarga de VE), sopro aortico
- Pulsos perifericos: assimetria sugere coarctacao ou doenca vascular
- Palpacao abdominal: sopro em flancos (renovascular)
- Avaliacao de edema periferico
##DIAGNOSTICOS_DIFERENCIAIS: - Hipertensao do jaleco branco: PA elevada apenas no consultorio (MAPA/MRPA normais)
- Hipertensao mascarada: PA normal no consultorio mas elevada fora dele
- HAS secundaria renovascular: sopro abdominal, hipocalemia, piora com IECA
- Feocromocitoma: crises hipertensivas paroxisticas + cefaleia + sudorese + palpitacoes
- Hiperaldosteronismo primario: hipocalemia + alcalose metabolica
- Sindrome de Cushing: facies cushingoide + estrias violaceas + obesidade central
- Coarctacao de aorta: hipertensao em MMSS + pulsos femorais diminuidos
##GRAVIDADE: Leve (Estagio 1): PA 140-159/90-99 mmHg, sem lesao de orgao-alvo
Moderada (Estagio 2): PA 160-179/100-109 mmHg, pode ter LOA inicial
Grave (Estagio 3): PA >=180/>=110 mmHg ou com LOA estabelecida (HVE, retinopatia III-IV, DRC, AVE previo)
Emergencia hipertensiva: PA muito elevada + LOA aguda (encefalopatia, EAP, disseccao aortica)
##TRATAMENTO: Nao-farmacologico:
- Restricao de sodio (<2g/dia)
- Dieta DASH (rica em frutas, vegetais, laticinios desnatados)
- Exercicio aerobico regular (150 min/semana)
- Controle de peso (IMC <25)
- Moderacao do consumo de alcool
- Cessacao do tabagismo
- Controle do estresse

Farmacologico:
- Monoterapia para estagio 1 com risco CV baixo
- Combinacao de 2 farmacos para estagio 2 ou risco CV alto
- Preferir combinacoes sinergicas: IECA/BRA + BCC ou IECA/BRA + diuretico tiazidico
##FARMACOLOGIA_PRIMEIRA_LINHA: Medicamento: Losartana
Classe: Bloqueador do Receptor de Angiotensina II (BRA)
Mecanismo de Acao: Bloqueia seletivamente os receptores AT1 da angiotensina II no musculo liso vascular, impedindo vasoconstricao e retencao de sodio
Dose Usual: 50-100mg/dia, 1-2x ao dia
Efeitos Colaterais: Tontura; Hipercalemia; Cefaleia
Contraindicacoes: Gestantes; Hipercalemia; Estenose bilateral de arteria renal
---
Medicamento: Anlodipino
Classe: Bloqueador dos Canais de Calcio (BCC) diidropiridinico
Mecanismo de Acao: Bloqueia canais de calcio tipo L no musculo liso vascular, reduzindo a entrada de Ca2+ e promovendo vasodilatacao arterial
Dose Usual: 5-10mg/dia, 1x ao dia
Efeitos Colaterais: Edema maleolar; Cefaleia; Rubor facial
Contraindicacoes: Estenose aortica grave; IC descompensada
##FARMACOLOGIA_SEGUNDA_LINHA: Medicamento: Hidroclorotiazida
Classe: Diuretico tiazidico
Mecanismo de Acao: Inibe o cotransportador Na+/Cl- no tubulo contorcido distal, promovendo natriurese e reducao do volume plasmatico
Dose Usual: 12.5-25mg/dia, 1x ao dia pela manha
Efeitos Colaterais: Hipocalemia; Hiperuricemia; Hiperglicemia; Hiponatremia
Contraindicacoes: Gota; Insuficiencia renal grave (TFG <30)
##FLUXOGRAMA_TRATAMENTO: 1. Confirmar diagnostico (>=2 medicoes em >=2 ocasioes ou MAPA/MRPA)
2. Estratificar risco cardiovascular (Framingham, SCORE)
3. Se estagio 1 + risco baixo/moderado:
   -> Iniciar MEV por 3-6 meses
   -> Se nao atingir meta: monoterapia (IECA/BRA ou BCC ou tiazidico)
4. Se estagio 1 + risco alto OU estagio 2:
   -> MEV + combinacao de 2 farmacos (preferir IECA/BRA + BCC)
5. Se estagio 3:
   -> MEV + combinacao de 3 farmacos
6. Se PA nao controlada com 3 farmacos em doses otimas (incluindo diuretico):
   -> Diagnostico de HAS resistente
   -> Adicionar espironolactona 25-50mg/dia
   -> Investigar causas secundarias
7. Meta pressórica: <140/90 mmHg (geral), <130/80 mmHg (alto risco, DM, DRC)
##OBSERVACOES_CLINICAS: - Nunca associar IECA + BRA (risco de hipercalemia e IRA sem beneficio adicional)
- BCC diidropiridinicos (anlodipino) sao preferidos em idosos e negros
- Beta-bloqueadores nao sao mais primeira linha, exceto se IC ou arritmia associada
- Em gestantes: metildopa, nifedipina e labetalol sao opcoes seguras
- Crise hipertensiva vs urgencia: presenca de LOA aguda define emergencia
##REFERENCIAS: Sociedade Brasileira de Cardiologia. Diretrizes Brasileiras de Hipertensao Arterial 2020.
ESC/ESH Guidelines for the management of arterial hypertension, 2018.
Harrison's Principles of Internal Medicine, 21st Edition.
```

---

## Exemplo com multiplas patologias

Para importar mais de uma patologia em um unico arquivo, separe cada uma com a linha:

```
---NOVA_PATOLOGIA---
```

Exemplo:

```
##NOME: Hipertensao Arterial Sistemica
##AREAS: Medicina; Biomedicina
##SISTEMA: Sistema Cardiovascular
##CID10: I10
##CLASSIFICACAO: ...
(demais campos)

---NOVA_PATOLOGIA---

##NOME: Diabetes Mellitus Tipo 2
##AREAS: Medicina; Biomedicina
##SISTEMA: Sistema Endocrino e Metabolico
##CID10: E11
##CLASSIFICACAO: ...
(demais campos)
```

---

## Erros comuns e como corrigi-los

| Erro | Causa | Solucao |
|---|---|---|
| "Nome e obrigatorio" | Campo `##NOME:` ausente ou vazio | Adicione `##NOME:` com o nome da patologia |
| "Pelo menos uma area de saude e obrigatoria" | Campo `##AREAS:` ausente | Adicione `##AREAS:` com pelo menos uma area valida |
| "Sistema invalido" | Nome do sistema nao corresponde a lista | Copie o nome exato da lista de sistemas validos acima |
| "Campo desconhecido ignorado" | Nome do campo com erro de digitacao | Verifique a grafia do campo (##NOME, ##AREAS, etc.) |
| Farmaco nao detectado | Formato incorreto dentro da farmacologia | Cada farmaco deve comecar com `Medicamento:` |

---

## Sobre imagens

As imagens de mecanismo de acao devem ser **enviadas separadamente** pelo formulario de edicao no painel administrativo (botao "Upload de imagens"). No formato TXT, voce pode incluir URLs ja existentes:

```
##IMAGENS_MECANISMO: /uploads/manual-clinico/sraa-mecanismo.png; /uploads/manual-clinico/bcc-canais.png
##LEGENDA_IMAGENS: Mecanismo do SRAA; Bloqueio dos canais de calcio
```

Fluxo recomendado:
1. Importe a patologia via TXT (sem imagens)
2. Acesse a patologia no painel: `/admin/manual-clinico/{id}/editar`
3. Use o botao "Upload de imagens" para enviar os arquivos
4. Adicione as legendas correspondentes
5. Salve a patologia
