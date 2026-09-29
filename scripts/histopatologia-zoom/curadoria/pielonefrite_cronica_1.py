import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pielonefrite-cronica-1', [
    pat('tireoidizacao', 'tireoidizacao-tubular', seta(0.3900, 0.3890, 45),
        rotulo='Túbulo atrófico com cilindro eosinofílico ("tireoidização")',
        vista=(0.380, 0.380, 0.400, 0.400)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.3715, 0.3485, 45),
        rotulo='Interstício tomado por linfócitos e plasmócitos',
        vista=(0.360, 0.340, 0.375, 0.355)),
    pat('faixa-inflamatoria', 'infiltrado-linfoplasmocitario', seta(0.785, 0.375, 0),
        rotulo='Faixa de inflamação crônica e fibrose',
        vista=(0.75, 0.35, 0.85, 0.45)),
    pat('fibrose', 'fibrose-intersticial', seta(0.3635, 0.3445, 45),
        rotulo='Túbulos afastados por fibrose e células inflamatórias',
        vista=(0.355, 0.335, 0.375, 0.355)),
    pat('arteria', 'espessamento-arterial', seta(0.8015, 0.3740, 0),
        rotulo='Artéria com parede espessada',
        vista=(0.78, 0.35, 0.83, 0.40)),
    est('glomerulo', 'corpusculo-renal', seta(0.7762, 0.4025, 0), rotulo='Glomérulo relativamente preservado',
        vista=(0.76, 0.39, 0.80, 0.42)),
    est('tubulo', 'tubulo-contorcido-proximal', seta(0.8285, 0.4035, 45), rotulo='Túbulos preservados em área menos acometida',
        vista=(0.80, 0.38, 0.85, 0.43)),
], achados=[
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado', 'faixa-inflamatoria'], 'Infiltrado intersticial intenso e difuso, com faixas mais densas.'),
    achado('tireoidizacao-tubular', 'presente', ['tireoidizacao'], 'Túbulos atróficos com cilindros hialinos homogêneos no meio do infiltrado.'),
    achado('fibrose-intersticial', 'presente', ['fibrose'], 'Interstício alargado por fibrose e inflamação.'),
    achado('espessamento-arterial', 'presente', ['arteria'], 'Artérias interlobulares de parede espessada.'),
    achado('infiltrado-neutrofilico', 'nao-avaliavel', [],
           'A história (febre, vômitos, dor lombar) sugere surto agudo, mas nos campos examinados predominam linfócitos e plasmócitos; não se identificaram cilindros de neutrófilos inequívocos.'),
], conferencias=3, resumo='Rim com pielonefrite crônica: interstício intensamente inflamado (linfócitos e plasmócitos) e fibroso, túbulos atróficos com cilindros eosinofílicos (tireoidização), artérias de parede espessada e glomérulos relativamente preservados em áreas menos acometidas. Pelve e cálice com a mucosa urotelial na parte superior do corte.')
print('ok')
