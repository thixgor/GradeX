import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 146, caso 7 — lobectomia com tuberculose fibrocaseosa
# (o índice do PathologyBites registra o diagnóstico clínico de suspeita, carcinoma epidermoide).
salvar('tuberculose-2', [
    pat('caseo', 'necrose-caseosa', seta(0.7400, 0.3500, 225),
        rotulo='Necrose caseosa: área rosa, granular, sem arquitetura',
        nota='Uma grande área de material eosinofílico, granular e amorfo — nem células nem contornos de alvéolos sobram. É a necrose caseosa ("de queijo"), típica da tuberculose: a resposta imune celular mata os macrófagos infectados e o tecido em volta, e os lipídios da parede da micobactéria deixam o resíduo esbranquiçado e friável na peça. As fendas são artefato de corte do material ressecado.',
        vista=(0.700, 0.300, 0.780, 0.380)),
    pat('granulomas', 'granuloma-epitelioide', seta(0.4300, 0.1650, 315),
        rotulo='Granulomas confluentes de histiócitos epitelioides',
        nota='Nódulos de macrófagos ativados, de citoplasma pálido e núcleo alongado ("epitelioides" porque se encostam como células de epitélio), cada um com uma coroa de linfócitos. Formam-se quando os linfócitos T CD4 produzem interferon-γ e os macrófagos tentam cercar a micobactéria que não conseguem matar.',
        vista=(0.400, 0.140, 0.460, 0.200)),
    pat('langhans', 'celula-gigante-de-langhans', seta(0.4155, 0.1540, 315),
        rotulo='Célula gigante de Langhans: núcleos dispostos na periferia',
        nota='Uma célula enorme, de citoplasma rosa, com muitos núcleos enfileirados na borda em ferradura. É a fusão de vários macrófagos epitelioides — uma "célula gigante" que tenta englobar o que um macrófago só não dá conta.',
        vista=(0.414, 0.150, 0.426, 0.160)),
    pat('langhans-2', 'celula-gigante-de-langhans', seta(0.4260, 0.1530, 225),
        rotulo='Outra célula gigante no granuloma',
        vista=(0.415, 0.145, 0.440, 0.165)),
    pat('linfocitos', 'infiltrado-linfoplasmocitario', seta(0.6250, 0.1950, 45),
        rotulo='Coroa de linfócitos e fibrose ao redor da lesão',
        vista=(0.600, 0.160, 0.660, 0.220)),
    pat('fibrose', 'fibrose-cicatricial', seta(0.7100, 0.3250, 135),
        rotulo='Faixa fibrosa e granulomatosa que encapsula a necrose',
        nota='Entre o caseo e o pulmão há uma parede de granulomas e colágeno: a lesão está sendo isolada. A cicatriz fibrosa (às vezes calcificada) é a forma como a tuberculose "cura" — e onde o bacilo pode ficar latente por décadas.',
        vista=(0.690, 0.290, 0.740, 0.340)),
    est('alveolos', 'alveolo-pulmonar', seta(0.1500, 0.2000, 45),
        rotulo='Pulmão em volta, com alvéolos preservados',
        vista=(0.050, 0.100, 0.300, 0.300)),
    est('arteria', 'arteria-muscular', seta(0.6900, 0.1880, 135),
        rotulo='Artéria pulmonar com hemácias na luz',
        vista=(0.670, 0.170, 0.700, 0.210)),
], achados=[
    achado('necrose-caseosa', 'presente', ['caseo'],
           'Grandes áreas de necrose caseosa no centro da lesão.'),
    achado('granuloma-epitelioide', 'presente', ['granulomas'],
           'Granulomas epitelioides confluentes em volta da necrose e espalhados pelo parênquima.'),
    achado('celula-gigante-de-langhans', 'presente', ['langhans', 'langhans-2'],
           'Várias células gigantes multinucleadas, de núcleos periféricos, nos granulomas.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfocitos'],
           'Linfócitos em coroa ao redor dos granulomas.'),
    achado('fibrose-cicatricial', 'presente', ['fibrose'],
           'Fibrose em torno das áreas caseosas — lesão fibrocaseosa, antiga e ativa.'),
], conferencias=3, resumo='Tuberculose pulmonar fibrocaseosa em lobectomia: grandes áreas de necrose caseosa cercadas por granulomas epitelioides confluentes, células gigantes de Langhans, coroa de linfócitos e fibrose, com pulmão preservado em volta. O paciente foi operado com suspeita de carcinoma — a lesão vista na radiografia era a tuberculose.')
print('ok')
