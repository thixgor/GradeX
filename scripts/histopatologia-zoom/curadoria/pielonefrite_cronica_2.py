import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 257, caso 8 — "Pyelonephritis".
salvar('pielonefrite-cronica-2', [
    pat('tireoidizacao', 'tireoidizacao-tubular', seta(0.1700, 0.4350, 225),
        rotulo='Túbulos atróficos cheios de cilindros eosinofílicos homogêneos',
        nota='Túbulos de epitélio achatado, dilatados por cilindros rosa, homogêneos e vítreos (proteína de Tamm-Horsfall concentrada), lado a lado — parecem folículos de tireoide com coloide. É a "tireoidização" da pielonefrite crônica: néfrons destruídos pela infecção e pela obstrução atrofiam e retêm o material.',
        vista=(0.160, 0.425, 0.180, 0.445)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.1200, 0.4350, 45),
        rotulo='Interstício tomado por linfócitos e plasmócitos, em faixas',
        nota='Entre os túbulos, faixas densas de linfócitos e plasmócitos afastam e destroem os néfrons. A inflamação crônica é irregular, em placas, e acompanha as cicatrizes — típico da infecção ascendente recorrente.',
        vista=(0.100, 0.420, 0.140, 0.460)),
    pat('neutrofilos', 'infiltrado-neutrofilico', seta(0.1640, 0.4400, 315),
        rotulo='Neutrófilos no interstício e em túbulos (surto agudo)',
        vista=(0.160, 0.432, 0.175, 0.445)),
    pat('fibrose', 'fibrose-intersticial', seta(0.1500, 0.4700, 135),
        rotulo='Colágeno afastando túbulos atróficos',
        vista=(0.130, 0.455, 0.170, 0.485)),
    pat('arteria', 'espessamento-arterial', seta(0.1100, 0.4800, 45),
        rotulo='Artéria de parede muito espessada',
        nota='Artérias com a íntima e a média espessadas e a luz reduzida — esclerose vascular que acompanha a cicatriz renal e a hipertensão secundária que a pielonefrite crônica costuma causar.',
        vista=(0.100, 0.460, 0.130, 0.495)),
    est('tubulos', 'tubulo-contorcido-proximal', seta(0.1800, 0.4950, 135),
        rotulo='Túbulos menos acometidos',
        vista=(0.165, 0.480, 0.200, 0.500)),
], achados=[
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado'],
           'Infiltrado intersticial denso de linfócitos e plasmócitos, em faixas irregulares.'),
    achado('tireoidizacao-tubular', 'presente', ['tireoidizacao'],
           'Grupos de túbulos atróficos dilatados por cilindros eosinofílicos homogêneos.'),
    achado('fibrose-intersticial', 'presente', ['fibrose'],
           'Fibrose intersticial entre túbulos atróficos.'),
    achado('espessamento-arterial', 'presente', ['arteria'],
           'Artérias de parede espessada nas áreas cicatriciais.'),
    achado('infiltrado-neutrofilico', 'presente', ['neutrofilos'],
           'Neutrófilos no interstício e em luzes tubulares — atividade aguda sobre o processo crônico.'),
], conferencias=3, resumo='Pielonefrite crônica em atividade: interstício tomado por faixas densas de linfócitos e plasmócitos, com neutrófilos, fibrose, túbulos atróficos dilatados por cilindros eosinofílicos homogêneos ("tireoidização") e artérias de parede espessada.')
print('ok')
