# Ferramentas Clínicas — 200 escores e calculadoras ausentes

Análise de lacunas do catálogo atual (`lib/ferramentas-clinicas/conteudo/`), que hoje tem
**201 ferramentas em 15 categorias**. Nenhum item abaixo existe no catálogo — a checagem foi
feita contra `nome`, `sigla` e `sinonimos` de todas as 201 ferramentas.

## Leitura rápida da lacuna

O catálogo é forte onde a conta é de beira de leito (gasometria, ventilação, eletrólitos,
diluição de droga) e nos escores de emergência e UTI. As lacunas se concentram em quatro
frentes:

1. **Especialidades sem nenhuma representação** — psiquiatria, reumatologia,
   geriatria/paliativo, urologia, dermatologia, oftalmo/ORL e ortopedia. São 4 categorias
   novas (seções 15 a 18 abaixo).
2. **Oncologia e hematologia de estadiamento** — há hemograma e coagulação, mas nenhum
   escore prognóstico de neoplasia (IPSS-R, R-ISS, IPI, Binet/Rai, ELN, ECOG).
3. **Regras de decisão de imagem e de alta** — Ottawa, NEXUS, Canadian CT Head, PECARN.
   São as ferramentas de maior impacto em emergência e não existe nenhuma.
4. **Escalas funcionais e de rastreio** — Barthel, Katz, Braden, MMSE/MoCA, PHQ-9, GAD-7.
   Alto uso ambulatorial e implementação simples: questionário mais ponto de corte.

**[P1]** = maior volume de uso clínico e implementação direta · **[P2]** = completa a
especialidade · **[P3]** = nicho.

Vários itens agrupam escores irmãos numa ferramenta só (por exemplo "ORBIT, ATRIA e ABC
bleeding"), seguindo o padrão já usado no catálogo em `LDL calculado: Friedewald,
Martin-Hopkins e Sampson` e `MUST e MNA`. Somados, os 200 itens correspondem a mais de 400
escores individuais.

---

## 1. Pediatria e neonatologia (16)

1. **UTICalc — probabilidade de ITU em lactentes** — 2 a 23 meses, em duas etapas (pré e pós-urinálise), definindo quem precisa de coleta por sondagem. **[P1]**
2. **PECARN — regras de TC no TCE pediátrico e de lesão intra-abdominal** — algoritmos para < 2 anos e ≥ 2 anos e quem dispensa TC de abdome após trauma fechado. **[P1]**
3. **Escore de Westley para crupe** — gravidade da laringotraqueíte e indicação de adrenalina nebulizada. **[P1]**
4. **PRAM — Pediatric Respiratory Assessment Measure** — gravidade da crise asmática na criança. **[P1]**
5. **Escore de Kocher e critério de Caird** — artrite septica do quadril vs. sinovite transitória. **[P1]**
6. **Febre no lactente < 60 dias: Rochester, Filadélfia, Boston e algoritmo AAP 2021** — risco de infecção bacteriana invasiva e necessidade de punção lombar. **[P1]**
7. **PEWS — Pediatric Early Warning Score** — deterioração clínica em enfermaria pediátrica. **[P1]**
8. **PIM-3 e PRISM III** — mortalidade predita em UTI pediátrica. **[P2]**
9. **SNAPPE-II e CRIB-II** — gravidade e mortalidade em UTI neonatal. **[P2]**
10. **Calculadora de sepse neonatal precoce (Kaiser Permanente)** — risco de sepse de início precoce e conduta em RN ≥ 34 semanas. **[P1]**
11. **Escore de Finnegan (NAS)** — síndrome de abstinência neonatal e indicação de morfina. **[P2]**
12. **Escalas de dor pediátrica: NIPS, PIPP, FLACC e escala de faces** — dor por faixa etária. **[P1]**
13. **Escore de Downes e escore de Tal** — desconforto respiratório do neonato e do lactente. **[P2]**
14. **Pediatric Appendicitis Score (Samuel)** — apendicite na criança, alternativa ao Alvarado. **[P1]**
15. **Estadiamento de Tanner** — maturação sexual: mamas, genitália e pilificação. **[P1]**
16. **Previsão de estatura final e altura-alvo parental** — canal familiar e velocidade de crescimento. **[P2]**

## 2. Cardiologia (16)

17. **Classificação de Killip-Kimball** — gravidade hemodinâmica e mortalidade no IAM. Hoje o Killip existe apenas como campo de entrada dentro do GRACE (`cardiologia.ts:704`), sem ferramenta própria nem estimativa de mortalidade por classe. **[P1]**
18. **TIMI para IAM com supra de ST** — escore prognóstico próprio do STEMI, distinto do TIMI de SCA sem supra já existente. **[P1]**
19. **CRUSADE** — risco de sangramento maior intra-hospitalar na síndrome coronariana aguda. **[P1]**
20. **Sgarbossa, Sgarbossa modificado (Smith), Wellens e de Winter** — IAM com BRE ou marcapasso e padrões de oclusão proximal de DA. **[P1]**
21. **Critérios de Brugada, Vereckei e algoritmo de aVR** — taquicardia ventricular vs. supraventricular com QRS largo. **[P1]**
22. **Critérios de sobrecarga atrial e de hipertrofia ventricular direita** — complemento eletrocardiográfico do módulo de HVE. **[P2]**
23. **Critérios de Framingham e de Boston para IC, com classificação NYHA e angina pela CCS** — diagnóstico clínico de insuficiência cardíaca e graduação sintomática. **[P1]**
24. **MAGGIC e GWTG-HF** — mortalidade na IC crônica e na descompensação intra-hospitalar. **[P2]**
25. **EuroSCORE II e STS score** — mortalidade em cirurgia cardíaca. **[P2]**
26. **ORBIT, ATRIA e ABC bleeding** — risco de sangramento na fibrilação atrial, alternativas ao HAS-BLED. **[P2]**
27. **EDACS e Marburg Heart Score** — dor torácica de baixo risco na emergência e na atenção primária. **[P1]**
28. **Canadian Syncope Risk Score, OESIL e EGSYS** — risco de evento grave após síncope. **[P1]**
29. **ADD-RS, com classificação de Stanford e DeBakey** — probabilidade pré-teste de dissecção aórtica. **[P1]**
30. **YEARS, PEGeD e D-dímero ajustado à idade** — estratégias de exclusão de TEP sem imagem. **[P1]**
31. **Hestia, BOVA e modelos de recorrência (Vienna, DASH, HERDOO2)** — tratamento ambulatorial do TEP, risco intermediário-alto e decisão de suspender a anticoagulação. **[P2]**
32. **Índice tornozelo-braquial, Fontaine e Rutherford** — diagnóstico e estadiamento da doença arterial periférica. **[P1]**

## 3. Emergência, trauma e terapia intensiva (16)

33. **Regras de Ottawa para tornozelo e para joelho** — necessidade de radiografia. **[P1]**
34. **Canadian C-Spine Rule e NEXUS** — liberação de coluna cervical sem imagem. **[P1]**
35. **Canadian CT Head Rule, New Orleans Criteria e Ottawa SAH Rule** — indicação de TC no TCE leve e investigação de hemorragia subaracnóidea na cefaleia aguda. **[P1]**
36. **Escore de Marshall e escore de Rotterdam** — classificação tomográfica do TCE e prognóstico. **[P2]**
37. **RTS, ISS/AIS e TRISS** — gravidade fisiológica e anatômica do trauma e probabilidade de sobrevida. **[P1]**
38. **Classificação AAST de lesão de órgãos** — graduação de lesão esplênica, hepática e renal. **[P2]**
39. **Superfície queimada e prognóstico: regra dos nove, Lund-Browder, índice de Baux e ABSI** — cálculo de área por faixa etária (complementa o módulo de Parkland) e mortalidade no grande queimado. **[P1]**
40. **CIWA-Ar, PAWSS e COWS** — abstinência alcoólica, risco de delirium tremens e abstinência de opioides. **[P1]**
41. **Índice de Charlson (CCI) e Charlson ajustado pela idade** — carga de comorbidade e mortalidade em 10 anos. **[P1]**
42. **Clinical Frailty Scale, FRAIL e fenótipo de Fried** — fragilidade como modificador de prognóstico e de conduta. **[P1]**
43. **Escalas de risco de enfermagem: Braden, Norton, Morse e Downton** — lesão por pressão e queda intra-hospitalar. **[P1]**
44. **Escore de Aldrete e Aldrete modificado** — alta da sala de recuperação pós-anestésica. **[P1]**
45. **Vasoactive-Inotropic Score (VIS)** — quantificação objetiva da carga vasoativa. **[P2]**
46. **Escore de Murray, RESP score e SAVE score** — lesão pulmonar aguda e indicação/prognóstico de ECMO. **[P2]**
47. **GO-FAR, CASPRI e MIRACLE₂, com Cerebral Performance Category** — prognóstico neurológico após parada cardiorrespiratória. **[P2]**
48. **Escore de McMahon para rabdomiólise** — risco de necessidade de terapia renal substitutiva. **[P2]**

## 4. Neurologia (11)

49. **MMSE, MoCA, teste do desenho do relógio e fluência verbal** — rastreio cognitivo com ajuste por escolaridade. **[P1]**
50. **CDR e GDS de Reisberg** — estadiamento da demência. **[P2]**
51. **4AT e ICDSC** — rastreio de delirium fora da UTI e alternativa ao CAM-ICU. **[P1]**
52. **ABCD3-I** — refinamento do ABCD² com imagem e estenose carotídea. **[P2]**
53. **DRAGON, THRIVE, SEDAN e HAT** — prognóstico funcional e risco de hemorragia após trombólise. **[P2]**
54. **CPSSS, RACE e LAMS** — triagem pré-hospitalar de oclusão de grande vaso. **[P1]**
55. **Escore FUNC e fórmula ABC/2 (Kothari)** — desfecho funcional e volume do hematoma intracerebral. **[P1]**
56. **STESS e EMSE** — prognóstico do estado de mal epiléptico. **[P2]**
57. **EGRIS, EGOS de Erasmus e escala de incapacidade de Hughes** — risco de insuficiência respiratória e desfecho na síndrome de Guillain-Barré. **[P2]**
58. **EDSS e critérios de McDonald 2017** — incapacidade e diagnóstico de esclerose múltipla. **[P2]**
59. **DN4, LANSS e painDETECT** — caracterização de dor neuropática. **[P1]**

## 5. Pneumologia e sono (11)

60. **Interpretação de espirometria (GLI/LLN) e pico de fluxo expiratório previsto** — padrão obstrutivo, restritivo e misto, resposta a broncodilatador e gravidade da crise asmática. **[P1]**
61. **CAT — COPD Assessment Test e grupos GOLD A/B/E** — classificação atual da DPOC. **[P1]**
62. **DECAF e BAP-65** — mortalidade na exacerbação da DPOC. **[P2]**
63. **SMART-COP e SMRT-CO** — necessidade de suporte ventilatório ou vasopressor na pneumonia. **[P1]**
64. **Critérios ATS/IDSA de pneumonia grave e DRIP score** — indicação de UTI e risco de patógeno resistente. **[P1]**
65. **CPIS — Clinical Pulmonary Infection Score** — probabilidade de pneumonia associada à ventilação. **[P2]**
66. **RAPID score e LENT score** — prognóstico no empiema e no derrame pleural maligno. **[P2]**
67. **STOP-BANG, NoSAS, questionário de Berlim e interpretação da polissonografia** — risco de apneia obstrutiva do sono, IAH e classificação de gravidade. **[P1]**
68. **Escala de sonolência de Epworth e índice de gravidade da insônia (ISI)** — sonolência diurna e insônia. **[P1]**
69. **Teste de caminhada de 6 minutos: distância prevista e interpretação, com escala de Borg** — capacidade funcional. **[P1]**
70. **GAP index na FPI e estratificação de risco na hipertensão pulmonar (ESC/ERS, REVEAL 2.0)** — mortalidade em doenças pulmonares raras. **[P2]**

## 6. Nefrologia e eletrólitos (9)

71. **KFRE (Tangri) — equação de risco de falência renal** — risco de diálise em 2 e 5 anos na DRC. **[P1]**
72. **Interpretação do EAS e do sedimento urinário** — cilindros, dismorfismo eritrocitário, leucocitúria estéril e diferencial entre padrão nefrítico, nefrótico e tubular. **[P1]**
73. **Kt/V, URR e nPCR** — adequação de hemodiálise e de diálise peritoneal. **[P2]**
74. **Reposição de magnésio, fósforo e cálcio** — déficit, via e velocidade; o catálogo só cobre potássio e bicarbonato. **[P1]**
75. **TTKG — gradiente transtubular de potássio** — origem renal vs. extrarrenal da discalemia. **[P2]**
76. **Ânion gap urinário, cloro urinário e diagnóstico das acidoses tubulares renais** — diferencial da acidose hiperclorêmica, pH urinário e resposta ao bicarbonato. **[P2]**
77. **ROKS, STONE score, relação cálcio/creatinina urinária e sódio de 24 h** — recorrência de litíase, probabilidade de cálculo ureteral, hipercalciúria e estimativa de ingestão de sal. **[P1]**
78. **Cleveland Clinic AKI score e teste de estresse com furosemida** — lesão renal aguda após cirurgia cardíaca e resposta tubular. **[P2]**
79. **Relação aldosterona/renina e algoritmo da hipertensão secundária** — rastreio de hiperaldosteronismo primário. **[P2]**

## 7. Gastroenterologia e hepatologia (11)

80. **AIMS65 e Oakland score** — mortalidade na hemorragia digestiva alta (mais simples que o Rockall) e alta segura na hemorragia digestiva baixa. **[P1]**
81. **Índice de gravidade tomográfica da pancreatite (Balthazar/CTSI)** — complemento radiológico ao BISAP e ao Ranson. **[P1]**
82. **Truelove-Witts, escore de Mayo, UCEIS e critérios de Lichtiger** — atividade da retocolite ulcerativa. **[P1]**
83. **CDAI, Harvey-Bradshaw, SES-CD e escore de Rutgeerts** — atividade da doença de Crohn e recorrência pós-operatória. **[P1]**
84. **West Haven e critérios de encefalopatia hepática** — graduação clínica e diferencial. **[P1]**
85. **Critérios de Baveno VII** — rastreio de varizes e hipertensão portal clinicamente significativa. **[P2]**
86. **CLIF-C ACLF e CLIF-SOFA** — insuficiência hepática aguda sobre crônica. **[P2]**
87. **Glasgow Alcoholic Hepatitis Score e ABIC** — prognóstico na hepatite alcoólica, ao lado de Maddrey e Lille. **[P2]**
88. **BCLC, ALBI grade e critérios de Milão** — estadiamento do hepatocarcinoma e elegibilidade a transplante. **[P1]**
89. **Escore de Leipzig (Wilson) e RUCAM** — doença de Wilson e causalidade em hepatotoxicidade medicamentosa. **[P2]**
90. **Escala de Bristol, EAT-10 e GerdQ** — forma das fezes, rastreio de disfagia e probabilidade de DRGE. **[P1]**

## 8. Infectologia (10)

91. **4C Mortality Score** — mortalidade na COVID-19 hospitalizada. **[P1]**
92. **Dengue pela OMS com sinais de alarme, critérios de malária grave e critérios de Faine** — classificação e conduta nas principais doenças tropicais. **[P1]**
93. **MASCC e CISNE** — risco na neutropenia febril e elegibilidade a tratamento ambulatorial. **[P1]**
94. **PITT bacteremia score** — gravidade da bacteremia. **[P2]**
95. **Candida score e regra de Ostrosky-Zeichner** — risco de candidíase invasiva na UTI. **[P2]**
96. **Escore de Giannella e INCREMENT-CPE** — risco de ESBL/carbapenemase e mortalidade na bacteremia por enterobactéria resistente. **[P2]**
97. **LRINEC** — probabilidade de fasciíte necrosante. **[P1]**
98. **Pé diabético: Wagner, Texas, WIfI, SINBAD e PEDIS** — estadiamento da úlcera e risco de amputação. **[P1]**
99. **Regra de Shapiro e MEDS score** — probabilidade de bacteremia e mortalidade na sepse do departamento de emergência. **[P2]**
100. **Escore de tuberculose na criança (Ministério da Saúde)** — diagnóstico sem confirmação bacteriológica. **[P1]**

## 9. Hematologia e oncologia (12)

101. **ECOG e Karnofsky** — performance status, pré-requisito de quase todo protocolo oncológico. **[P1]**
102. **PLASMIC score, escore francês, HScore e critérios HLH-2004** — probabilidade de PTT antes da ADAMTS13 e linfo-histiocitose hemofagocítica. **[P1]**
103. **Escore de Khorana** — risco de TEV no paciente oncológico e indicação de tromboprofilaxia. **[P1]**
104. **IPSS-R e IPSS-M** — prognóstico na síndrome mielodisplásica. **[P2]**
105. **Linfomas: IPI, R-IPI, NCCN-IPI, FLIPI, FLIPI-2, MIPI, IPS de Hasenclever e escore de Deauville** — prognóstico por subtipo e resposta metabólica ao PET. **[P2]**
106. **ISS, R-ISS e R2-ISS, com critérios CRAB/SLiM** — estadiamento e diagnóstico do mieloma múltiplo. **[P2]**
107. **Rai, Binet e CLL-IPI** — leucemia linfocítica crônica. **[P2]**
108. **Estratificação ELN de risco na LMA e critérios de Camitta** — risco citogenético/molecular e gravidade da aplasia de medula. **[P2]**
109. **Graduação ASTCT de CRS e ICANS, com Glucksberg/MAGIC** — toxicidade de CAR-T e doença do enxerto contra hospedeiro. **[P2]**
110. **RECIST 1.1, iRECIST e graduação CTCAE v5** — resposta tumoral e toxicidade de tratamento. **[P1]**
111. **Índice de Mentzer, Green & King e índice de saturação de transferrina** — talassemia vs. ferropenia e estoques de ferro. **[P1]**
112. **Critérios de Sydney para SAAF e aGAPSS** — síndrome antifosfolípide e risco de recorrência trombótica. **[P2]**

## 10. Endocrinologia e metabolismo (10)

113. **FRAX e interpretação do T-score e do TBS** — risco de fratura maior em 10 anos e limiar de tratamento. **[P1]**
114. **Burch-Wartofsky, critérios da JTA, Clinical Activity Score (EUGOGO) e NOSPECS** — tempestade tireoidiana e orbitopatia de Graves. **[P1]**
115. **TI-RADS (ACR e ATA) e classificação de Bethesda** — nódulo tireoidiano e indicação de punção. **[P1]**
116. **Interpretação do teste de estímulo com cortrosina e dose de estresse de glicocorticoide** — insuficiência adrenal e cobertura perioperatória. **[P1]**
117. **Rastreio de síndrome de Cushing e PASS para feocromocitoma** — testes de triagem e potencial de malignidade. **[P2]**
118. **Critérios de síndrome metabólica: IDF, NCEP-ATP III e harmonizado** — diagnóstico e comparação entre definições. **[P1]**
119. **Índice TyG, QUICKI e índice de Matsuda** — resistência insulínica além do HOMA. **[P2]**
120. **MNSI e escore de Michigan** — rastreio de neuropatia diabética periférica. **[P1]**
121. **Reposição e conversão de vitamina D** — dose de ataque, manutenção e alvos por faixa de 25-OH-D. **[P1]**
122. **Interpretação do TOTG, do teste de tolerância à insulina e escore de Ferriman-Gallwey** — curva glicêmica, eixo somatotrófico e hirsutismo. **[P2]**

## 11. Obstetrícia e ginecologia (12)

123. **Critérios de Rotterdam e fenótipos da SOP** — diagnóstico da síndrome dos ovários policísticos. **[P1]**
124. **Peso fetal estimado (Hadlock), percentis Intergrowth-21st e critérios Delphi de RCF** — biometria, PIG/GIG e restrição de crescimento precoce e tardia. **[P1]**
125. **Vitalidade fetal: Doppler (IP umbilical, ACM, relação cerebroplacentária), perfil biofísico de Manning e categorias I–III de cardiotocografia** — vigilância antenatal e intraparto. **[P1]**
126. **Risco de parto prematuro: comprimento cervical e fibronectina fetal** — indicação de progesterona e de cerclagem. **[P1]**
127. **Calculadora de VBAC (Grobman)** — probabilidade de parto vaginal após cesárea. **[P1]**
128. **Rastreio combinado do 1º trimestre e interpretação de NIPT** — risco de aneuploidia com valor preditivo ajustado pela prevalência. **[P2]**
129. **Teste de Kleihauer-Betke e dose de imunoglobulina anti-D** — hemorragia feto-materna e profilaxia da aloimunização. **[P1]**
130. **EPDS — Escala de Depressão Pós-Parto de Edimburgo** — rastreio no puerpério. **[P1]**
131. **Modelo de Gail, Tyrer-Cuzick, BOADICEA e categorias BI-RADS** — risco de câncer de mama e conduta por categoria de imagem. **[P1]**
132. **Estadiamento FIGO (colo, endométrio, ovário) e ROMA score** — estadiamento ginecológico e risco de malignidade ovariana por HE4. **[P1]**
133. **rASRM, Endometriosis Fertility Index e subclassificação FIGO de mioma (0–8)** — estadiamento da endometriose e do leiomioma. **[P2]**
134. **POP-Q e ICIQ** — prolapso genital e incontinência urinária. **[P2]**

## 12. Cirurgia e perioperatório (10)

135. **Clavien-Dindo e Comprehensive Complication Index** — gravidade da complicação pós-operatória. **[P1]**
136. **ARISCAT e escore de Gupta para insuficiência respiratória** — risco de complicação pulmonar pós-operatória. **[P1]**
137. **ACS NSQIP Surgical Risk Calculator** — risco multidesfecho por procedimento, complementa o Gupta MICA. **[P2]**
138. **mFI-5, NELA, Nottingham Hip Fracture Score e risco de delirium pós-operatório** — fragilidade cirúrgica, laparotomia de urgência e o idoso operado. **[P2]**
139. **RIPASA e escore de Tzanakis** — apendicite, alternativas a Alvarado e AIR. **[P2]**
140. **Classificação de Hinchey e classificação WSES de diverticulite** — estadiamento e conduta. **[P1]**
141. **Grading de Parkland, escore de Nassar e probabilidade de coledocolitíase (ASGE/ESGE)** — dificuldade da colecistectomia e indicação de CPRE ou colangio-RM. **[P1]**
142. **Escore de Boey e índice de peritonite de Mannheim** — mortalidade na úlcera perfurada e na peritonite. **[P2]**
143. **MESS e classificação de Gustilo-Anderson** — viabilidade do membro e fratura exposta. **[P2]**
144. **Classificação de Goligher, classificação de Parks e escore de Wexner** — hemorroidas, fístula anal e incontinência fecal. **[P2]**

## 13. Farmacologia, toxicologia e prescrição (10)

145. **Nomograma de Rumack-Matthew e antidotário com diluição e repique** — paracetamol/NAC, naloxona, flumazenil, fomepizol, azul de metileno, glucagon, emulsão lipídica e hidroxicobalamina. **[P1]**
146. **Correção de fenitoína pela albumina (Sheiner-Tozer) e ajuste em uremia** — nível livre estimado. **[P1]**
147. **Heparinas: nomograma de HNF por peso, ajuste por TTPa/anti-Xa e enoxaparina em obesidade, DRC e gestação** — dose profilática e terapêutica com monitoramento. **[P1]**
148. **Dose estendida de aminoglicosídeo e nomograma de Hartford** — intervalo por nível sérico e função renal. **[P2]**
149. **Critérios de Beers, STOPP/START e escala de carga anticolinérgica (ACB)** — desprescrição no idoso. **[P1]**
150. **Tisdale score** — risco de QT longo induzido por fármaco no paciente internado. **[P1]**
151. **Escore de Naranjo** — probabilidade de reação adversa a medicamento. **[P2]**
152. **Critérios de Hunter para síndrome serotoninérgica e critérios de síndrome neuroléptica maligna** — diferencial da hipertermia por fármaco. **[P1]**
153. **Protocolo de insulina intravenosa contínua** — taxa inicial, ajuste horário e transição para subcutânea. **[P1]**
154. **Sedação e analgesia contínuas: propofol, midazolam, dexmedetomidina, quetamina e fentanil, com PCA** — mcg/kg/min, faixas-alvo e bomba de analgesia controlada. **[P1]**

## 14. Nutrição clínica (8)

155. **Critérios GLIM e Avaliação Subjetiva Global (ASG e ASG-PPP)** — diagnóstico de desnutrição em duas etapas. **[P1]**
156. **SARC-F e critérios EWGSOP2** — rastreio e diagnóstico de sarcopenia com força de preensão. **[P1]**
157. **NUTRIC score** — risco nutricional no paciente crítico, onde o NRS-2002 tem baixo desempenho. **[P1]**
158. **GNRI, NRI de Buzby, PNI de Onodera e índice CONUT** — índices prognósticos nutricionais laboratoriais. **[P2]**
159. **Composição corporal: circunferência muscular do braço, prega tricipital, MUAC, bioimpedância e ângulo de fase** — reserva proteica e massa magra. **[P2]**
160. **Nutrição parenteral: osmolaridade, relação caloria-nitrogênio e limites de glicose e lipídio** — segurança da formulação e escolha da via de acesso. **[P1]**
161. **Desnutrição infantil: Gomez, índice de Waterlow, escore-z peso/altura, preparo de fórmula e volume por mamada** — classificação e prescrição no lactente. **[P1]**
162. **EOSS, OS-MRS e DiaRem** — estadiamento da obesidade, risco cirúrgico bariátrico e probabilidade de remissão do diabetes. **[P2]**

## 15. Psiquiatria e saúde mental — categoria nova (11)

163. **PHQ-9, PHQ-2 e GAD-7** — rastreio e monitoramento de depressão e ansiedade na atenção primária. **[P1]**
164. **HAM-D, HAM-A, MADRS e inventários de Beck (BDI-II, BAI)** — gravidade aplicada pelo clínico e autoavaliação. **[P1]**
165. **C-SSRS (Columbia) e SAD PERSONS** — risco de suicídio. **[P1]**
166. **MDQ, HCL-32 e YMRS** — rastreio de bipolaridade e gravidade da mania. **[P1]**
167. **AUDIT, AUDIT-C, CAGE, ASSIST e teste de Fagerström** — rastreio de álcool, multissubstância e dependência de nicotina. **[P1]**
168. **Y-BOCS** — gravidade do transtorno obsessivo-compulsivo. **[P2]**
169. **ASRS-18 e SNAP-IV** — rastreio de TDAH no adulto e na criança. **[P1]**
170. **M-CHAT-R/F** — rastreio de autismo entre 16 e 30 meses. **[P1]**
171. **PCL-5** — rastreio e gravidade do transtorno de estresse pós-traumático. **[P2]**
172. **PANSS e BPRS** — sintomas positivos, negativos e gerais na esquizofrenia. **[P2]**
173. **AIMS e escala de Barnes** — discinesia tardia e acatisia induzidas por antipsicótico. **[P2]**

## 16. Reumatologia e imunologia — categoria nova (10)

174. **Critérios ACR/EULAR 2010 para artrite reumatoide, com DAS28, SDAI, CDAI e HAQ** — diagnóstico e atividade de doença. **[P1]**
175. **Critérios ACR/EULAR 2019 e SLICC para LES, com SLEDAI-2K** — classificação e atividade do lúpus. **[P1]**
176. **Critérios ASAS, BASDAI e ASDAS** — espondiloartrite axial. **[P1]**
177. **CASPAR, PASI e DLQI** — artrite psoriásica, extensão da psoríase e impacto na qualidade de vida. **[P1]**
178. **Critérios ACR/EULAR 2015 para gota** — classificação com e sem identificação de cristais. **[P1]**
179. **Critérios ACR/EULAR para Sjögren (ESSDAI) e para esclerose sistêmica (escore de Rodnan modificado)** — classificação e atividade. **[P2]**
180. **Vasculites: critérios ACR/EULAR 2022 para ANCA, BVAS, Five Factor Score e critérios de arterite de células gigantes e polimialgia reumática** — classificação, atividade e prognóstico. **[P2]**
181. **Critérios ACR 2016 para fibromialgia, com WPI/SS e FIQ** — diagnóstico e impacto funcional. **[P1]**
182. **Critérios ILAR/ACR-EULAR para artrite idiopática juvenil e JADAS** — classificação e atividade na criança. **[P2]**
183. **WOMAC, Lequesne e classificação de Kellgren-Lawrence** — osteoartrite clínica e radiográfica. **[P1]**

## 17. Geriatria e cuidados paliativos — categoria nova (8)

184. **Índice de Barthel, índice de Katz e escala de Lawton-Brody** — atividades básicas e instrumentais de vida diária. **[P1]**
185. **GDS-15 e escala de Cornell** — depressão no idoso e no idoso com demência. **[P1]**
186. **Timed Up and Go, escala de Tinetti e escala de equilíbrio de Berg** — mobilidade e risco de queda. **[P1]**
187. **VES-13, G8, índice de Lee e índice de Schonberg** — vulnerabilidade em oncogeriatria e mortalidade em 4 e 10 anos para individualizar rastreamento. **[P2]**
188. **Palliative Performance Scale (PPS), PPI e PaP score** — prognóstico em cuidados paliativos. **[P1]**
189. **ESAS-r** — avaliação multidimensional de sintomas. **[P1]**
190. **SPICT, NECPAL e pergunta surpresa** — identificação de necessidade paliativa. **[P1]**
191. **Escala de Zarit** — sobrecarga do cuidador. **[P2]**

## 18. Urologia, dermatologia, oftalmologia, ORL e ortopedia — categoria nova (9)

192. **IPSS e escore de qualidade de vida na HPB** — sintomas do trato urinário inferior e indicação de tratamento. **[P1]**
193. **IIEF-5/SHIM e NIH-CPSI** — disfunção erétil e prostatite crônica. **[P2]**
194. **Próstata: densidade e velocidade do PSA, relação livre/total, Gleason/ISUP grade group, risco de D'Amico e nomograma de Partin** — indicação de biópsia e estratificação do câncer de próstata. **[P1]**
195. **TWIST score** — probabilidade de torção testicular. **[P1]**
196. **SCORAD e EASI** — gravidade da dermatite atópica. **[P1]**
197. **SCORTEN e ALDEN** — mortalidade na necrólise epidérmica tóxica e causalidade medicamentosa. **[P1]**
198. **Melanoma: Breslow, Clark, regra ABCDE, escore de 7 pontos de Glasgow e fototipos de Fitzpatrick** — estadiamento e risco fotobiológico. **[P1]**
199. **Conversão de acuidade visual (Snellen ↔ logMAR ↔ decimal), classificação ETDRS de retinopatia diabética e estadiamento da ROP** — leitura oftalmológica objetiva. **[P1]**
200. **HINTS/HINTS-plus, escala de House-Brackmann, SNOT-22, média tonal e classificação OMS de perda auditiva** — vertigem central vs. periférica, paralisia facial, rinossinusite e audiometria. **[P1]**

---

## Como isso se encaixa no catálogo

- As 14 primeiras seções expandem categorias existentes; as seções 15 a 18 são **categorias
  novas** e exigiriam entradas em `lib/ferramentas-clinicas/categorias.ts`, novos módulos em
  `conteudo/` e ícones/cores em `components/ferramentas-clinicas/tema.ts`.
- Ao adicionar ferramentas, atualizar o campo `total` de cada categoria e a constante
  `TOTAL_FERRAMENTAS` em `lib/ferramentas-clinicas/index.ts` — a verificação
  `conferirTotais()` reclama no console em desenvolvimento se divergirem. O script
  `scripts/contar-ferramentas.js` recalcula.
- Nenhum item repete ferramenta existente. Os casos de vizinhança próxima foram escolhidos
  deliberadamente por serem escores distintos: TIMI STEMI vs. TIMI de SCA sem supra, AIMS65
  vs. Rockall, PAS pediátrico vs. Alvarado, CAT vs. mMRC, Lund-Browder (área queimada) vs.
  Parkland (volume de reposição), Oakland (hemorragia digestiva baixa) vs. Blatchford (alta).
- Três itens ficaram **fora** da lista por já estarem cobertos, apesar de não terem ferramenta
  própria: a TFG combinada creatinina + cistatina C (já é campo opcional do módulo de CKD-EPI,
  `nefrologia.ts:85`), a classificação de Forrest (descrita na prosa do escore de Rockall,
  `gastroenterologia.ts:354`) e os critérios GLIM citados no NRS-2002 — este último entrou como
  item 155 porque a citação não traz a conta nem os cortes fenotípicos.
