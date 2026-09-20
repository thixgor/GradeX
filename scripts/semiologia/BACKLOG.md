# Backlog de cenas com imagem

## Estado em 2026-09-20 (quinta leva)

Entraram **112 sinais novos, só com fotografia** (`lib/semiologia/sinais-leva-5-*.ts`):
pele 24, anexos/mucosas/olho 25, tronco/abdome/genital 22, MSK/trauma 18,
neuro/pediatria 17 e 6 extras (polidactilia/sindactilia, onfalocele/gastrosquise,
mielomeningocele, anquiloglossia, rânula/mucocele, queratoacantoma). Seis temas
da lista original já existiam com outro nome (bócio, ginecomastia, mão em garra,
sinal de Trousseau, icterícia neonatal/Kramer, hipópio) — as fotos colhidas foram
para essas fichas antigas em vez de duplicar. Acervo: 2480 mídias em 895 cenas
(DermNet ~150, Commons ~215, Radiopaedia ~115 nesta leva); nenhum sinal da leva
ficou sem mídia.

**Onde a foto ainda é fraca** (1 a 2 imagens ou só imagem/radiografia): fácies
hipocrática (só a gravura da febre tifoide), Noonan/Klinefelter (só Noonan),
Prader-Willi (só o skin picking), heterocromia (só Waardenburg), dermatocálase,
unha em vidro de relógio (1 DermNet), eritrasma, cutis marmorata, língua
saburrosa, pinguécula, mão reumatoide (fotos foram para dedos-em-pescoco-de-cisne),
hemorroidas grau IV e priapismo (só Doppler e esfregaço falciforme). São os
candidatos para o material dos titulares (Stanford 25, Hawke, EyeRounds, Atlas
Dermatológico).

## Estado em 2026-09-18 (quarta leva)

Implementado da lista abaixo: **A** inteira (62 sinais com foto), **B** inteira
(31 sinais dinâmicos + vídeo do YouTube nos 49 sinais que existiam sem mídia),
**D** quase inteira (bloqueios 13 cenas, procedimentos 9, partes pequenas 11,
Doppler 6, obstétrico tardio 5, 6 cenas cardíacas; microscopia 10,
capilaroscopia 4, luz de Wood 5) e **E** (Radiopaedia com cine mp4, DermNet
em ~110 sinais de pele, POCUS Atlas Nerve Block Atlas). Os termos conjuntos
assinados em 18/09 estão em `lib/acervos-licenciados.ts`.

**Ficou sem foto** (cena existe, acervo vazio): bloqueios/procedimentos sem
caso no POCUS Atlas (jugular interna, radial, periférico difícil,
toracocentese, paracentese, punção lombar, cricotireóidea — o Radiopaedia
não tem "procedimento" como caso), doppler-vascular/doppler-transcraniano,
apical/vti-debito-cardiaco e funcao-diastolica, obstetrico-tardio/
apresentacao-cefalica, -pelvica e oligoamnio, capilaroscopia ativa e tardia
(só a precoce tem foto), e alguns sinais tropicais sem foto livre.

**Sons (C)**: nenhum entrou. A UMich Heart Sound Library saiu do ar (os mp3 do
Open Michigan dão 404 e o Deep Blue está atrás de Cloudflare); Littmann,
Thinklabs, EasyAuscultation e R.A.L.E. não são raspáveis. O tipo `audio` e o
player estão prontos: basta receber os arquivos dos titulares e registrar em
`curadoria.json` com a fonte correspondente.

## Ideias para a quarta leva (2026-09-17) — o que foi implementado está acima

Legenda: **C** Wikimedia Commons (foto livre, provável) · **P** POCUS Atlas ·
**R** Radiopaedia · **V** vídeo externo (YouTube/Commons `.webm`, sem espelho) ·
**A** áudio (precisa de acervo autorizado ou gravação própria) · **CDC** PHIL,
domínio público.

### A. Sinais do exame físico com foto — 62

Dermato-infecto (20): tinha do corpo (borda ativa) · tinha do pé/intertrigo
interdigital · onicomicose · paroníquia aguda · unha encravada · verruga
vulgar e plantar · herpes labial · furúnculo e carbúnculo · dermatite atópica
(liquenificação flexural) · dermatite seborreica · dermatite de contato
(padrão geométrico) · rosácea e rinofima · acne nódulo-cística · melasma ·
pitiríase rósea (medalhão + árvore de Natal) · líquen plano cutâneo (estrias
de Wickham) · dermografismo · queloide × cicatriz hipertrófica · pioderma
gangrenoso · pediculose (lêndeas) — todos C.

Tropical/Brasil (6): paracoccidioidomicose (estomatite moriforme) ·
esporotricose linfangítica · cromomicose · micetoma (pé de Madura) ·
elefantíase filarial · difteria (pseudomembrana) — C/CDC.

Pediatria e genética (10): manchas café-com-leite + neurofibromas (NF1) ·
angiofibromas e manchas hipomelanóticas (esclerose tuberosa) · hemangioma
infantil · mancha vinho-do-porto (Sturge-Weber) · fenda labiopalatina ·
macrocrania/hidrocefalia · microcefalia · esclera azul (osteogênese
imperfeita) · pseudo-hipertrofia de panturrilha (Duchenne) ·
hiperextensibilidade cutânea e articular (Ehlers-Danlos, Beighton) — C.

Cabeça e pescoço (5): macroglossia · cisto branquial · higroma cístico ·
escrófula (linfadenite TB fistulizada) · angina de Ludwig — C.

Tórax, abdome, genital, proctologia (12): doença de Paget do mamilo /
carcinoma inflamatório · hérnia inguinal · hérnia incisional · estomas
(normal × isquêmico × prolapsado) · fimose e parafimose · balanite ·
condiloma acuminado · herpes genital · hemorroida trombosada · fissura anal ·
prolapso retal · abscesso perianal — C.

Musculoesquelético (9): fratura exposta · fratura de clavícula (deformidade)
· luxação interfalângica · sinal de Popeye (ruptura do bíceps) · dedo em
martelo · espondilite anquilosante (postura em ponto de interrogação) ·
bursite olecraniana e pré-patelar · cisto sinovial de punho ·
Osgood-Schlatter — C.

### B. Sinais dinâmicos — precisam de vídeo — 35 (V)

Marchas: hemiparética (ceifante) · escarvante · em tesoura · anserina
(miopática) · talonante (tabética) · magnética (hidrocefalia de pressão
normal) · antálgica · Trendelenburg. (Parkinsoniana e atáxica já existem, sem
mídia.)

Movimento anormal: coreia de Sydenham e de Huntington (`coreia` existe) ·
hemibalismo · distonia cervical · mioclonias · tiques · tremor essencial ×
repouso × intencional (`tremor-de-repouso` existe) · fasciculações de língua
(ELA) · asterixe (existe) · crise tônico-clônica e crise de ausência.

Manobras: Romberg · índex-nariz e disdiadococinesia · Gowers · reflexos de
Moro, preensão e sucção · Ortolani-Barlow · Dix-Hallpike com nistagmo ·
HINTS (head impulse) · Hoffmann · clônus (existe) · Lasègue · Thompson ·
ptose fatigável e teste do gelo (miastenia) · swinging flashlight (defeito
pupilar aferente, cena sem foto) · paralisia do VI nervo (existe).

Respiração e pulso: Kussmaul · Cheyne-Stokes · pulso venoso jugular (ondas
a/v e sinal de Kussmaul) · tempo de enchimento capilar (existe).

### C. Sons — ausculta — 28 (A)

Cardíaco: B1/B2 normais · B3 (existe) · B4 (existe) · desdobramento de B2
(fisiológico, fixo, paradoxal) · estenose aórtica (existe) · insuficiência
mitral (existe) · estenose mitral (ruflar + estalido de abertura) ·
insuficiência aórtica · insuficiência tricúspide com Rivero-Carvallo ·
persistência do canal arterial (contínuo) · CIV · atrito pericárdico · click
mesossistólico do prolapso · sopro inocente de Still · CMH com Valsalva ·
prótese mecânica.

Pulmonar: crepitações finas × grossas (existe `estertores-crepitantes`) ·
sibilos (existe) · roncos · estridor (existe) · atrito pleural · sopro
tubário · egofonia e pectorilóquia · murmúrio abolido (existe).

Abdominal e vascular: ruídos metálicos (obstrução) · silêncio abdominal ·
sopro carotídeo · sopro renal · frêmito/sopro de fístula AV.

### D. Beira do leito — 46

Bloqueios guiados (10, P — Nerve Block Atlas): interescalênico ·
supraclavicular · axilar · femoral · fáscia ilíaca · PENG · poplíteo
(ciático) · serrátil anterior · eretor da espinha · plano transverso do
abdome.

Procedimentos guiados (8, P): jugular interna em plano × fora de plano ·
artéria radial · acesso periférico difícil · marcação de toracocentese ·
paracentese · artrocentese de joelho · punção lombar guiada · membrana
cricotireóidea.

Musculoesquelético e partes pequenas (10, P/R): ruptura do manguito rotador ·
tendinite calcária · tendão patelar · nervo mediano no túnel do carpo ·
nódulo tireoidiano (TI-RADS) · tireoidite · linfonodo reativo × maligno ·
mama cisto × sólido · tumor testicular · varicocele.

Doppler vascular (5, P/R/C): placa carotídea · estenose carotídea
(velocidades) · Doppler transcraniano (ACM) · índice de resistência renal ·
fluxo portal hepatofugal.

Cardíaco avançado (6, P): VTI e débito cardíaco · E/e' (função diastólica) ·
flail mitral · Doppler colorido da IM apical · PSAP pela IT · gradiente de
estenose aórtica (CW).

Obstétrico 2º/3º trimestre (4, P/C): placenta prévia · apresentação fetal ·
oligoâmnio/ILA · descolamento prematuro de placenta.

Novas "vistas" não ultrassonográficas (3 janelas, ~30 cenas, C/CDC):
- **Microscopia à beira do leito**: sedimento urinário (cilindros hialinos,
  granulosos, hemáticos; hematúria dismórfica; cristais de oxalato, urato,
  estruvita), Gram (diplococos, bacilos), KOH (hifas), exame a fresco
  (Trichomonas, clue cells), gota espessa (Plasmodium falciparum × vivax),
  Leishmania em aspirado, esfregaço (drepanócitos, esquizócitos).
- **Capilaroscopia periungueal**: normal · padrão esclerodérmico precoce ·
  ativo · tardio (megacapilares, hemorragias, áreas avasculares).
- **Luz de Wood**: versicolor · eritrasma · vitiligo · tinha do couro
  cabeludo · porfiria (urina).

### E. Reforço do acervo existente

- 182 cenas com **uma só mídia**; 49 sinais **sem mídia** — quase todos
  dinâmicos ou de ausculta (B e C acima).
- **Radiopaedia está subusada**: só 3 mídias. Tem caso ilustrado para
  praticamente todas as 278 cenas de ultrassom, com stacks/cine. Prioridade
  um da leva de reforço.
- POCUS Atlas: pegar **todos** os clipes de cada coleção, não só o primeiro.
- Commons: reabrir por categoria (não por busca) as cenas com 1 foto.

### F. Fontes que precisam de autorização

1. **Sons**: 3M Littmann, University of Michigan Heart Sound & Murmur
   Library, Thinklabs, easyauscultation.com; pulmão: R.A.L.E. Repository
   (Manitoba). Alternativa aberta: PhysioNet CirCor DigiScope (ODC-By) e
   PhysioNet/CinC 2016 — reais, sem a qualidade didática das bibliotecas.
   Melhor de todas: **gravações próprias** com estetoscópio digital.
2. **Dermatologia**: DermNet NZ (CC BY-NC-ND), Atlas Dermatológico
   (atlasdermatologico.com.br, Prof. Samuel Freire).
3. **Oftalmologia**: EyeRounds (Universidade de Iowa), Retina Image Bank
   (ASRS).
4. **Otoscopia**: Hawke Library, ENT USA (Dr. Ted).
5. **Endoscopia**: Gastrolab, Atlas of GI Endoscopy (Julio Murra-Saca).
6. **Vídeos de exame**: Stanford Medicine 25, Neurosigns.org, NEJM Videos in
   Clinical Medicine, Semiologia UFMG/UNIFESP. Embed do YouTube dispensa
   autorização (ToS do YouTube), mas o dono pode tirar o vídeo do ar.
7. **Sem autorização necessária**: CDC PHIL e MedPix (NIH) — domínio
   público; entram como nova `FonteLicenciada`.

---


## Estado em 2026-09-17 (terceira leva)

Entrou: +36 cenas em broncoscopia/laringoscopia/otoscopia/fundoscopia; três
janelas novas (dermatoscopia, segmento anterior, cavidade oral — 30 cenas);
+35 sinais. Foto curada para 21 cenas antigas que só tinham SVG.

**Ficou sem foto livre no Commons** (candidatos a clipe, a outro acervo ou a
foto própria): fossa nasal normal (rinoscopia), defeito pupilar aferente,
leucoplasia de prega vocal, laringomalácia, sangramento/tampão/TB/aspergilose
endobrônquicos, carina alargada, fístula traqueoesofágica, retinopatia
falciforme, fibras mielinizadas, dermatofibroma (dermatoscopia), leucoplasia
pilosa oral, sinal do rezador, tiragem intercostal, torcicolo congênito, sinal
de Romaña. Abscesso retrofaríngeo e drusas do disco estão com imagem
radiológica/tomográfica, que é como se diagnosticam.


Ideias para os próximos lotes do Manual de Semiologia — só o que tem fotografia
ou clipe obtível em acervo licenciado. Nada aqui está implementado; o que já
existe está em `lib/semiologia/ultrassom.ts` e `sinais*.ts`.

Fonte provável: **P** POCUS Atlas (CC BY-NC-SA) · **R** Radiopaedia
(CC BY-NC-SA, caso a caso) · **C** Wikimedia Commons · **V** precisa de vídeo.

## Ultrassom à beira do leito — 150 cenas

### Pulmão e diafragma (25)
1. Ponto pulmonar (lung point) — transição deslizamento/ausência, patognomônico de pneumotórax — P, V
2. Sinal do código de barras — M-mode do pneumotórax — P
3. Sinal da praia — M-mode normal, para comparar — P
4. Pulso pulmonar — batimento transmitido sem deslizamento (intubação seletiva) — P, V
5. Broncograma aéreo dinâmico — ar que se move na consolidação (pneumonia) — P, V
6. Broncograma aéreo estático — ar parado (atelectasia obstrutiva) — P
7. Sinal do fragmento (shred) — borda irregular da consolidação com pulmão aerado — P
8. Sinal da coluna (spine sign) — coluna visível acima do diafragma no derrame — P
9. Sinal do sinusoide — M-mode do derrame com o pulmão oscilando — P
10. Sinal do plâncton — ecos flutuando no derrame (empiema/hemotórax) — P
11. Sinal da água-viva — pulmão atelectasiado boiando no derrame — P, V
12. Derrame septado — traves de fibrina — P/R
13. Espessamento e irregularidade pleural — COVID/fibrose — P
14. Infarto pulmonar — cunha subpleural hipoecoica (TEP) — P/R
15. Perfil B bilateral do edema cardiogênico — comparação com B focal — P
16. Hepatização pulmonar — consolidação lobar com aspecto de fígado — P
17. Excursão diafragmática — M-mode com amplitude normal — P
18. Paralisia diafragmática — movimento paradoxal — P, V
19. Fração de espessamento diafragmático — desmame ventilatório — P
20. Contusão pulmonar — B focais + consolidação subpleural no trauma — P
21. Fratura de costela — degrau cortical com hematoma — P/C
22. Enfisema subcutâneo — E-lines que apagam a pleura — P
23. Massa pleural/parede torácica — lesão sólida com vascularização — R
24. Atelectasia compressiva por derrame maciço — P
25. Pneumotórax neonatal — sonda linear — P

### Coração (45)
26. Colapso diastólico do VD — tamponamento — P, V
27. Variação respiratória do fluxo mitral > 25 % — Doppler no tamponamento — P
28. Sinal do D — septo achatado no PSAX (sobrecarga de VD) — P
29. Sinal de McConnell — acinesia da parede livre com ápice preservado — P, V
30. Trombo em trânsito — massa serpiginosa em AD/VD — P, V
31. TAPSE reduzido — M-mode no anel tricúspide — P
32. TAPSE normal — comparação — P
33. MAPSE — M-mode no anel mitral — P
34. EPSS aumentado — separação ponto E-septo > 7 mm (FE baixa) — P
35. EPSS normal — comparação — P
36. Hipertrofia concêntrica do VE — parede > 12 mm (HAS, EAo) — P
37. Cardiomiopatia dilatada — cavidades globalmente aumentadas — P
38. Cardiomiopatia hipertrófica com SAM — septo assimétrico — P/R
39. Takotsubo — balonamento apical — P, V
40. Acinesia regional — parede inferior no IAM — P, V
41. Aneurisma apical com trombo — P/R
42. Vegetação mitral — endocardite — P/R
43. Vegetação aórtica — P/R
44. Estenose aórtica calcificada — abertura restrita — P
45. Estenose mitral — doming, "taco de hóquei" — P/R
46. Insuficiência mitral ao Doppler colorido — jato regurgitante — P
47. Insuficiência tricúspide — jato + estimativa de PSAP — P
48. Prolapso mitral — folheto para o AE — P/R
49. Valva aórtica bicúspide — PSAX "boca de peixe" — P/R
50. Dissecção tipo A — flap na raiz da aorta — P/R
51. Raiz de aorta dilatada — > 4 cm em PLAX — P
52. Prótese mecânica — sombra e reverberação — P
53. Eletrodo de marca-passo no VD — P
54. Ponta de cateter central na AD — P
55. Mixoma atrial — massa pediculada — R
56. Teste de bolhas — shunt intracardíaco — P, V
57. Cor pulmonale crônico — VD hipertrofiado e dilatado — P
58. Derrame pericárdico com fibrina — traves — P
59. Gordura epicárdica — o que imita derrame — P
60. Pseudo-AESP — contração organizada sem pulso — P, V
61. Assistolia ecográfica — "standstill" — P, V
62. Fibrilação ventricular — tremor da parede — P, V
63. PSAX nível da valva aórtica — "Mercedes" — P
64. PSAX apical — P
65. Apical 2 câmaras — P
66. Apical 5 câmaras — VSVE — P
67. Supraesternal — arco aórtico — P
68. VTI de VSVE — débito cardíaco — P
69. VE hiperdinâmico — paredes que se tocam (hipovolemia/sepse) — P, V
70. Ruptura de septo interventricular pós-IAM — Doppler — R

### Vasos e VExUS (21)
71. TVP poplítea — P
72. Trombo flutuante — cauda livre no lúmen — P, V
73. Trombo crônico recanalizado — P
74. Tromboflebite superficial — safena — P
75. Cisto de Baker — o que imita TVP — P
76. Hematoma muscular da panturrilha — P
77. Aneurisma poplíteo — P/R
78. Pseudoaneurisma femoral — yin-yang ao Doppler — P
79. Fístula arteriovenosa pós-punção — P
80. Trombo de jugular — cateter — P
81. Punção de jugular guiada — agulha em plano — P, V
82. Placa carotídea — P/C
83. Estenose carotídea — aliasing no Doppler — P/R
84. Dissecção carotídea — R
85. Oclusão arterial femoral aguda — ausência de fluxo — P
86. Cava com filtro — P
87. Trombo de cava — P/R
88. Índice de colapsabilidade — M-mode da cava — P
89. VExUS — veia hepática com onda S reversa — P
90. VExUS — Doppler portal pulsátil — P
91. VExUS — Doppler venoso renal monofásico — P

### Abdome (36)
92. FAST esplenorrenal positivo — P
93. Hemoperitônio coagulado — ecos no líquido — P
94. Laceração hepática — P/R
95. Laceração esplênica — P/R
96. Hidropisia vesicular — P
97. Pólipo vesicular — P
98. Lama biliar — P
99. Perfuração vesicular / abscesso perivesicular — R
100. Sinal WES — vesícula cheia de cálculos — P
101. Coledocolitíase — cálculo no ducto — R
102. Cirrose — contorno nodular — P
103. Esteatose — fígado brilhante — P
104. Metástases hepáticas — alvos — R
105. Abscesso hepático — P/R
106. Ascite septada — P
107. Paracentese guiada — agulha no líquido — P, V
108. Intussuscepção — alvo/pseudo-rim (pediatria) — P
109. Estenose hipertrófica do piloro — P/R
110. Obstrução intestinal — alças dilatadas com vaivém — P, V
111. Diverticulite — parede espessada + gordura ecogênica — P
112. Pneumoperitônio — reforço peritoneal com reverberação — P
113. Hérnia inguinal — alça que desliza com Valsalva — P, V
114. Hérnia encarcerada — alça sem peristalse — P
115. Cálculo renal — sombra + "twinkling" — P
116. Cálculo ureteral distal — via transvesical — P
117. Jato ureteral ao Doppler — normal — P, V
118. Cisto renal simples — P
119. Rins policísticos — P
120. Rim pequeno crônico — córtex fino, hiperecoico — P
121. Hidronefrose grave — "urso" — P
122. Coágulo vesical — P
123. Balão de sonda vesical — P
124. Tumor vesical — massa parietal — P/R
125. Aneurisma roto com hematoma retroperitoneal — P/R
126. Dissecção da aorta abdominal — flap — P
127. Endoprótese com endoleak — R

### Pelve, obstetrícia e escroto (11)
128. Batimentos fetais — M-mode com FCF — P
129. Gestação anembrionada — saco vazio > 25 mm — P
130. Aborto retido — embrião sem batimento — P
131. Mola hidatiforme — "tempestade de neve" — R
132. Torção ovariana — ovário aumentado sem fluxo — R
133. Placenta prévia — P
134. Descolamento de placenta — hematoma retroplacentário — R
135. Apresentação fetal no 3º trimestre — cefálica × pélvica — P
136. Torção testicular — sem fluxo ao Doppler — P
137. Epididimite — hiperemia — P
138. Hidrocele — P

### Partes moles, MSK, olho e via aérea (12)
139. Celulite — "paralelepípedo" — P
140. Fasciíte necrosante — gás na fáscia — P/R
141. Corpo estranho — vidro/madeira com sombra — P
142. Fratura de rádio distal — degrau cortical — P
143. Derrame articular do joelho — recesso suprapatelar — P
144. Luxação de ombro — cabeça umeral posterior à glenoide — P
145. Bainha do nervo óptico dilatada — HIC — P
146. Descolamento de retina — membrana ondulante — P, V
147. Hemorragia vítrea — P, V
148. Membrana cricotireóidea — marcação para cricotireoidostomia — P
149. Intubação esofágica — sinal do "duplo trato" — P
150. Antro gástrico cheio × vazio — risco de aspiração — P

## Sinais do exame físico com fotografia — 150

### Pele (46)
1. Petéquias conjuntivais — endocardite/plaquetopenia — C
2. Hemorragias em estilhaço — leito ungueal — C
3. Nódulos de Osler — polpa digital dolorosa — C
4. Lesões de Janeway — máculas palmares indolores — C
5. Xantelasma — C
6. Xantomas tendinosos — tendão de Aquiles (hipercolesterolemia familiar) — C
7. Arco corneano em jovem — C
8. Acantose nigricans — resistência insulínica — C
9. Vitiligo — C
10. Hiperpigmentação de Addison — dobras e gengiva — C
11. Estrias violáceas — Cushing — C
12. Hirsutismo — SOP — C
13. Alopecia areata — C
14. Livedo reticular — C
15. Fenômeno de Raynaud — fase branca — C
16. Esclerodactilia — C
17. Telangiectasias da esclerose sistêmica — C
18. Úlceras digitais — C
19. Calcinose — C
20. Rash malar — LES — C
21. Lúpus discoide — C
22. Pápulas de Gottron — dermatomiosite — C
23. Heliótropo — C
24. Psoríase em placas — C
25. Pitting ungueal — C
26. Coiloníquia — ferropriva — C
27. Linhas de Beau — C
28. Unhas de Terry / Muehrcke — hipoalbuminemia — C
29. Melanoma — ABCDE — C
30. Carcinoma basocelular — C
31. Carcinoma espinocelular — C
32. Ceratose actínica — C
33. Herpes zóster — dermátomo — C
34. Sarampo — exantema + Koplik — C
35. Escarlatina — língua em framboesa, Pastia — C
36. Eritema infeccioso — face esbofeteada — C
37. Mão-pé-boca — C
38. Dengue — ilhas brancas em mar vermelho — C
39. Sífilis secundária — palmo-plantar — C
40. Cancro duro — C
41. Eritema nodoso — C
42. Eritema migratório — Lyme — C
43. Stevens-Johnson / NET — Nikolsky — C
44. Pênfigo vulgar — C
45. Penfigoide bolhoso — C
46. Escabiose — túneis interdigitais — C

### Infecções, feridas e trauma de pele (20)
47. Erisipela — borda nítida elevada — C
48. Impetigo — crostas melicéricas — C
49. Abscesso cutâneo — flutuação — C
50. Hidradenite supurativa — C
51. Meningococcemia — púrpura fulminante — C
52. Púrpura de Henoch-Schönlein — palpável em MMII — C
53. Lesão por pressão — estágios — C
54. Pé diabético — mal perfurante plantar — C
55. Pé de Charcot — C
56. Gangrena de Fournier — C
57. Queimadura — profundidade 1º/2º/3º — C
58. Congelamento — C
59. Loxoscelismo — placa marmórea — C
60. Acidente botrópico — edema e equimose — C
61. Hanseníase — mancha hipocrômica anestésica, mão em garra — C
62. Leishmaniose cutânea — úlcera de bordas elevadas — C
63. Larva migrans — C
64. Miíase — C
65. Tungíase — C
66. Sarcoma de Kaposi — C

### Cabeça, pescoço e olho (44)
67. Bócio — C
68. Exoftalmia — Graves — C
69. Retração palpebral — C
70. Mixedema pré-tibial — C
71. Ptose — C
72. Síndrome de Horner — C
73. Paralisia facial periférica — C
74. Paralisia facial central — C
75. Fácies acromegálica — C
76. Fácies cushingoide — C
77. Fácies mixedematosa — C
78. Fácies parkinsoniana — C
79. Fácies leonina — C
80. Edema periorbital — síndrome nefrótica — C
81. Língua geográfica — C
82. Língua pilosa negra — C
83. Glossite atrófica — B12/ferro — C
84. Queilite angular — C
85. Leucoplasia — C
86. Líquen plano oral — C
87. Hiperplasia gengival — fenitoína — C
88. Úlcera aftosa — C
89. Adenomegalia cervical — C
90. Parotidite — C
91. Cisto tireoglosso — sobe com a deglutição — C
92. Sinal de Chvostek — V
93. Sinal de Trousseau — mão de parteiro — C
94. Mastoidite — orelha deslocada — C
95. Tofo no pavilhão — C
96. Orelha em couve-flor — C
97. Sinal de Battle — C
98. Olhos de guaxinim — C
99. Hifema — C
100. Hemorragia subconjuntival — C
101. Hipópio — uveíte — C
102. Pterígio — C
103. Catarata madura — C
104. Anel de Kayser-Fleischer — C
105. Zóster oftálmico — sinal de Hutchinson — C
106. Celulite orbitária — C
107. Estrabismo — C
108. Paralisia do III nervo — olho para baixo e fora — C
109. Paralisia do VI nervo — C
110. Pupila de Argyll Robertson — C

### Tórax, abdome e MSK (28)
111. Pectus excavatum — C
112. Pectus carinatum — C
113. Tórax em barril — C
114. Cifoescoliose — C
115. Ginecomastia — C
116. Peau d'orange / retração mamilar — C
117. Cabeça de medusa — C
118. Hérnia umbilical — C
119. Diástase de retos — C
120. Dedos em pescoço de cisne / botoeira — AR — C
121. Desvio ulnar — C
122. Nódulos de Heberden e Bouchard — C
123. Tofos nas mãos — C
124. Podagra — C
125. Contratura de Dupuytren — C
126. Atrofia tenar — túnel do carpo — C
127. Mão caída — radial — C
128. Mão em garra — ulnar — C
129. Pé caído — C
130. Hálux valgo — C
131. Genu varo / valgo — C
132. Artrite séptica do joelho — C
133. Deformidade em dorso de garfo — Colles — C
134. Luxação de ombro — sinal da dragona — C
135. Síndrome compartimental — C
136. Linfedema / elefantíase — C
137. Lipodermatoesclerose — C
138. Síndrome da veia cava superior — C

### Neurológico e pediátrico (12)
139. Postura de decorticação × descerebração — C
140. Sinal de Babinski — V
141. Clônus — V
142. Sinal de Brudzinski — C/V
143. Opistótono — C
144. Riso sardônico / trismo — C
145. Tremor de repouso — V
146. Coreia — V
147. Marcha parkinsoniana — V
148. Hidrocefalia — olhos em sol poente — C
149. Fontanela abaulada — C
150. Icterícia neonatal — zonas de Kramer — C
