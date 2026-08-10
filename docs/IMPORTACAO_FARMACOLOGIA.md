# Formato de Importação de Farmacologia — Manual Clínico

## O que é este formato?

Este documento descreve o formato padrão de texto para importar **fármacos** (medicamentos) na seção de **Farmacologia** do Manual Clínico do Domine Aqui. Cada fármaco pertence a uma **classe principal** e a uma **subclasse**. Ao seguir este formato, você pode colar o texto (ou enviar um arquivo `.txt`) e importar um ou vários fármacos de uma só vez.

Este arquivo também serve de guia para um LLM gerar conteúdo de importação automaticamente.

---

## Como funciona?

1. Acesse o painel administrativo: `/admin/manual-clinico` → seção **Farmacologia** → **Importar Fármacos**
   (ou diretamente em `/admin/farmacologia/importar`)
2. Escolha **colar texto** ou **upload de arquivo .txt**
3. Clique em **Pré-visualizar** para validar
4. Corrija eventuais erros indicados
5. Clique em **Importar** para salvar no banco de dados

> A importação de farmacologia é **separada** da importação de patologias. Cada uma tem sua própria seção no painel.

---

## Formato dos campos

Cada campo começa com `##CAMPO:` seguido do conteúdo, que pode ocupar várias linhas até o próximo campo (`##`).

### Campos obrigatórios

| Campo | Descrição | Exemplo |
|---|---|---|
| `##NOME:` | Nome do fármaco (DCB/genérico) | Paracetamol |
| `##CLASSE:` | Classe principal (ver lista abaixo) | Analgésicos, Anti-inflamatórios e Antitérmicos |

### Campos recomendados

| Campo | Descrição |
|---|---|
| `##SINONIMOS:` | Nomes alternativos/genéricos, separados por `;` |
| `##NOMES_COMERCIAIS:` | **Seção inicial independente.** Principais marcas/apresentações comerciais (ex.: Tylenol®, Dôrico®). Exibida no topo da ficha, separada das demais seções e fora do navegador de seções. |
| `##SUBCLASSE:` | Subclasse dentro da classe (ver lista) |
| `##TIPO:` | Tipo do fármaco: `Fármaco ativo`, `Pró-fármaco`, `Metabólito ativo`, `Fármaco ativo com metabólito ativo` ou `Outro` |
| `##CLASSIFICACAO:` | Classificação detalhada. **Diga se é pró-fármaco, fármaco ativo etc.** |
| `##PRINCIPAIS_FUNCOES:` | Principais funções / indicações |
| `##MECANISMO_COMPACTO:` | Mecanismo de ação resumido (1–3 frases) |
| `##MECANISMO_DETALHADO:` | Mecanismo de ação aprofundado |
| `##METABOLISMO:` | Como é metabolizado (ex.: CYP450, fígado) |
| `##EXCRECAO:` | Via de excreção (renal, biliar, meia-vida) |
| `##EFEITOS_COLATERAIS:` | Lista separada por `;` ou uma por linha |
| `##EFEITOS_ADVERSOS:` | Lista separada por `;` ou uma por linha |
| `##CONTRAINDICACOES:` | Condição + motivo (ver formato abaixo) |
| `##INTERACOES_MEDICAMENTOSAS:` | Principais fármacos/situações que geram interação **e o que cada interação causa**. Uma interação por linha (ver formato abaixo). |
| `##POSOLOGIA:` | Dose, frequência, duração de uso, ajustes |
| `##CALCULO_DOSE:` | Configuração da calculadora de dose (ver abaixo) |
| `##FLUXOGRAMA_USO:` | Fluxo decisório de uso (uma etapa por linha) |
| `##OBSERVACOES_CLINICAS:` | Perlas clínicas e alertas |
| `##REFERENCIAS:` | Referências bibliográficas |

> A diferença entre **Efeitos Colaterais** e **Efeitos Adversos** já é exibida automaticamente (texto fixo) na ficha, antes das duas listas. Você só precisa fornecer as listas.

> **Nomes comerciais** é uma seção **independente** que abre no topo da ficha (não faz parte do navegador de seções). Já **Interações Medicamentosas** é uma seção normal, listada no navegador junto com Mecanismo, Contraindicações, Posologia etc.

---

## Classes e subclasses válidas

Use exatamente um dos nomes de **classe** abaixo no campo `##CLASSE:`. A comparação ignora acentos e maiúsculas. Classes fora da lista são aceitas (criadas como personalizadas), mas geram um aviso.

- **Antimicrobianos** → Penicilinas; Cefalosporinas; Carbapenêmicos; Monobactâmicos; Macrolídeos; Aminoglicosídeos; Quinolonas e Fluoroquinolonas; Tetraciclinas; Sulfonamidas; Glicopeptídeos; Lincosamidas; Nitroimidazólicos; Antifúngicos; Antivirais; Antiparasitários; Antituberculosos
- **Sistema Cardiovascular** → Inibidores da ECA (IECA); Bloqueadores do Receptor de Angiotensina (BRA); Bloqueadores dos Canais de Cálcio (BCC); Betabloqueadores; Diuréticos; Antiarrítmicos; Nitratos e Antianginosos; Hipolipemiantes (Estatinas e Fibratos); Inotrópicos e Digitálicos; Vasopressores e Vasodilatadores
- **Sistema Nervoso Central** → Antidepressivos (ISRS); Antidepressivos (IRSN); Antidepressivos Tricíclicos; IMAO; Ansiolíticos e Benzodiazepínicos; Antipsicóticos Típicos; Antipsicóticos Atípicos; Anticonvulsivantes e Antiepilépticos; Estabilizadores do Humor; Antiparkinsonianos; Hipnóticos e Sedativos; Psicoestimulantes
- **Analgésicos, Anti-inflamatórios e Antitérmicos** → Analgésicos não-opioides; Opioides; Anti-inflamatórios não esteroidais (AINEs); Antitérmicos; Antienxaqueca; Agentes para Gota
- **Sistema Endócrino e Metabólico** → Biguanidas; Sulfonilureias; Insulinas; Inibidores da DPP-4; Inibidores do SGLT2; Agonistas do GLP-1; Hormônios Tireoidianos e Antitireoidianos; Corticosteroides; Hormônios Sexuais e Contraceptivos; Agentes para Osteoporose
- **Sistema Respiratório** → Beta-2 agonistas; Anticolinérgicos inalatórios; Xantinas; Corticoides inalatórios; Anti-histamínicos; Antitussígenos e Expectorantes; Antileucotrienos
- **Sistema Digestório** → Inibidores da Bomba de Prótons (IBP); Antagonistas H2; Antiácidos; Antieméticos; Procinéticos; Laxantes; Antidiarreicos; Anti-inflamatórios intestinais
- **Sistema Hematológico** → Anticoagulantes; Antiagregantes Plaquetários; Fibrinolíticos; Hematopoéticos e Antianêmicos
- **Sistema Geniturinário** → Diuréticos; Agentes para Hiperplasia Prostática (HPB); Antiespasmódicos Urinários; Disfunção Erétil
- **Antineoplásicos e Imunomoduladores** → Quimioterápicos; Imunossupressores; Imunobiológicos
- **Anestésicos** → Anestésicos Locais; Anestésicos Gerais; Bloqueadores Neuromusculares
- **Vitaminas, Eletrólitos e Suplementos** → Vitaminas; Eletrólitos e Minerais; Soluções e Reposição

---

## Formato das Contraindicações (com o porquê)

No campo `##CONTRAINDICACOES:`, cada contraindicação tem uma **Condição** e um **Motivo** (o porquê). Separe múltiplas contraindicações com `---`:

```
##CONTRAINDICACOES:
Condição: Insuficiência hepática grave
Motivo: Risco de hepatotoxicidade fatal por acúmulo do metabólito NAPQI
---
Condição: Alergia ao paracetamol
Motivo: Reações de hipersensibilidade / anafilaxia
```

Também é aceito o formato compacto, uma por linha: `Condição | Motivo` (ou `Condição - Motivo`).

---

## Formato das Interações Medicamentosas

No campo `##INTERACOES_MEDICAMENTOSAS:`, descreva os **principais fármacos ou situações** que interagem com o medicamento e, sempre, **o que a interação causa** (o desfecho clínico). Use uma interação por linha. O conteúdo é texto livre (Markdown simples), então prefira o padrão **`Fármaco/Situação`** seguido do efeito:

```
##INTERACOES_MEDICAMENTOSAS:
- Varfarina: potencializa o efeito anticoagulante → maior risco de sangramento.
- Álcool / etilismo crônico: induz CYP2E1 e depleta glutationa → maior hepatotoxicidade.
- Indutores enzimáticos (carbamazepina, fenitoína, rifampicina): aumentam a formação de NAPQI → risco hepático.
- Isoniazida: eleva a toxicidade hepática.
```

Não há campo de "motivo" estruturado aqui (diferente das contraindicações): escreva o porquê/efeito na mesma linha, após `→`, `:` ou `-`.

---

## Formato da Calculadora de Dose

O campo `##CALCULO_DOSE:` configura a calculadora interativa. O usuário informa **sexo, idade e peso**, marca **condições (checks)** e recebe uma dose estimada. Se marcar uma condição que é contraindicação, o app **avisa que o medicamento é contraindicado para a pessoa** (e ainda mostra a dose de referência).

Linhas suportadas (chave: valor):

```
##CALCULO_DOSE:
Unidade: mg
Via: VO
Dose por kg: 15
Dose fixa:
Dose mínima:
Dose máxima: 4000
Frequência: 6/6h
Ajuste idoso (%): -25
Fator masculino: 1
Fator feminino: 1
Observação: Não exceder 4 g/dia
Check: Doença hepática | contraindica | Risco de hepatotoxicidade
Check: Etilismo crônico | contraindica
Check: Gestação | seguro
```

Regras de cálculo:

- Base = `Dose por kg × peso` (se houver) **ou** `Dose fixa`.
- Multiplica pelo `Fator masculino`/`Fator feminino` conforme o sexo (default 1).
- Se idade ≥ 65 e houver `Ajuste idoso (%)`, aplica o ajuste (ex.: `-25` reduz 25%).
- Limita ao intervalo `Dose mínima`–`Dose máxima`.

Sobre os **Check:**

- Formato: `Check: <rótulo> | <flag> | [motivo opcional]`
- `flag` = `contraindica` (a condição é uma contraindicação) ou `seguro` (apenas informativa).
- Se o `motivo` for omitido em um check `contraindica`, o app tenta casar o rótulo com a lista de `##CONTRAINDICACOES:` para exibir o porquê.

A calculadora só aparece na ficha quando há `Dose por kg` ou `Dose fixa`.

---

## Exemplo completo: Paracetamol

```
##NOME: Paracetamol
##SINONIMOS: Acetaminofeno
##NOMES_COMERCIAIS: Tylenol®; Dôrico®; Parador®; Tylflex® (associações). Apresentações: comprimidos 500/750 mg, gotas 200 mg/mL, solução oral.
##CLASSE: Analgésicos, Anti-inflamatórios e Antitérmicos
##SUBCLASSE: Analgésicos não-opioides
##TIPO: Fármaco ativo
##CLASSIFICACAO: Analgésico e antipirético de ação predominantemente central. É um **fármaco ativo** (não é pró-fármaco), porém parte de seu metabolismo gera o metabólito tóxico NAPQI.
##PRINCIPAIS_FUNCOES: Tratamento de dor leve a moderada e da febre. Não possui ação anti-inflamatória clinicamente relevante.
##MECANISMO_COMPACTO: Inibe fracamente a COX no SNC e modula a via serotoninérgica descendente, reduzindo dor e febre com pouca ação periférica.
##MECANISMO_DETALHADO: Atua sobre a cicloxigenase central (possível ação sobre variante COX), reduzindo a síntese de prostaglandinas no hipotálamo (efeito antitérmico). Há contribuição de metabólitos (AM404) sobre receptores canabinoides e TRPV1 e modulação das vias serotoninérgicas descendentes da dor. A baixa atividade periférica explica a ausência de efeito anti-inflamatório e a melhor tolerância gástrica.
##METABOLISMO: Hepático. Conjugação com glicuronídeo e sulfato (vias majoritárias). Cerca de 5–10% via CYP2E1 gera NAPQI, normalmente neutralizado pela glutationa.
##EXCRECAO: Renal, na forma de conjugados. Meia-vida de 2–3 h (prolongada na hepatopatia).
##EFEITOS_COLATERAIS: Náusea leve; Rash cutâneo discreto
##EFEITOS_ADVERSOS: Hepatotoxicidade dose-dependente; Necrose hepática aguda em superdosagem; Reações cutâneas graves (raras)
##CONTRAINDICACOES:
Condição: Insuficiência hepática grave
Motivo: Redução da glutationa e da capacidade de conjugação aumenta o acúmulo de NAPQI e o risco de necrose hepática
---
Condição: Hipersensibilidade ao paracetamol
Motivo: Risco de reações alérgicas / anafilaxia
##INTERACOES_MEDICAMENTOSAS:
- Varfarina: uso regular potencializa o efeito anticoagulante → maior risco de sangramento (monitorar INR).
- Álcool / etilismo crônico: induz CYP2E1 e depleta glutationa → maior formação de NAPQI e hepatotoxicidade.
- Indutores enzimáticos (carbamazepina, fenitoína, fenobarbital, rifampicina): aumentam o metabolismo via CYP → mais NAPQI e risco hepático.
- Isoniazida: eleva a toxicidade hepática.
- Metoclopramida/domperidona: aceleram a absorção do paracetamol (pico mais rápido).
##POSOLOGIA: Adultos: 500–1000 mg por dose, a cada 6 h, máximo 4 g/dia (3 g/dia em hepatopatas ou idosos frágeis). Crianças: 10–15 mg/kg/dose a cada 4–6 h.
##CALCULO_DOSE:
Unidade: mg
Via: VO
Dose por kg: 15
Dose máxima: 1000
Frequência: 6/6h
Ajuste idoso (%): -25
Fator masculino: 1
Fator feminino: 1
Observação: Não exceder 4 g/dia (3 g/dia em hepatopatas/idosos)
Check: Doença hepática | contraindica | Maior risco de hepatotoxicidade por acúmulo de NAPQI
Check: Etilismo crônico | contraindica | Indução de CYP2E1 e depleção de glutationa
Check: Gestação | seguro
##FLUXOGRAMA_USO: Dor leve/moderada ou febre
↓
Sem doença hepática e sem etilismo?
↓
Sim: iniciar 500–1000 mg VO 6/6h
↓
Reavaliar em 48–72h
↓
Dor persistente: associar/ trocar conforme protocolo
##OBSERVACOES_CLINICAS: - Antídoto da intoxicação: N-acetilcisteína (repõe glutationa).
- Cuidado com associações de venda livre que contêm paracetamol (risco de superdosagem cumulativa).
##REFERENCIAS: Goodman & Gilman, As Bases Farmacológicas da Terapêutica, 13ª ed.; Bulário ANVISA.
```

---

## Vários fármacos no mesmo arquivo

Separe cada fármaco com a linha:

```
---NOVO_FARMACO---
```

Exemplo:

```
##NOME: Paracetamol
##CLASSE: Analgésicos, Anti-inflamatórios e Antitérmicos
...

---NOVO_FARMACO---

##NOME: Losartana
##CLASSE: Sistema Cardiovascular
##SUBCLASSE: Bloqueadores do Receptor de Angiotensina (BRA)
##TIPO: Pró-fármaco
...
```

---

## Erros comuns e como corrigi-los

| Erro | Causa | Solução |
|---|---|---|
| "Nome é obrigatório" | `##NOME:` ausente ou vazio | Adicione `##NOME:` com o nome do fármaco |
| "Classe principal é obrigatória" | `##CLASSE:` ausente | Adicione `##CLASSE:` com uma classe válida |
| "Classe não está na taxonomia padrão" (aviso) | Nome da classe diferente da lista | Use exatamente um nome de classe da lista (acentos são ignorados) |
| Contraindicação sem motivo | Faltou a linha `Motivo:` | Adicione `Motivo:` abaixo de cada `Condição:` |
| Calculadora não aparece | Sem `Dose por kg` nem `Dose fixa` | Informe ao menos um dos dois em `##CALCULO_DOSE:` |
| Check não vira contraindicação | flag diferente de `contraindica` | Use `Check: <rótulo> | contraindica` |
