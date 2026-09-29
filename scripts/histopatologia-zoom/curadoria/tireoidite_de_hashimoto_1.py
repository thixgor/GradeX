import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('tireoidite-de-hashimoto-1', [
    pat('centro-germinativo', 'hiperplasia-linfoide-reativa', seta(0.475, 0.282, 45),
        rotulo='Folículo linfoide com centro germinativo na tireoide',
        nota='Tecido linfoide organizado, com centro germinativo claro — não existe na tireoide normal.',
        vista=(0.455, 0.265, 0.495, 0.300)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.4463, 0.2907, 45),
        rotulo='Linfócitos e plasmócitos entre os folículos',
        vista=(0.440, 0.290, 0.455, 0.305)),
    pat('hurthle', 'metaplasia-oncocitica', seta(0.4865, 0.2955, 45),
        rotulo='Células de Hürthle: citoplasma rosa-granular abundante',
        vista=(0.483, 0.287, 0.495, 0.299)),
    pat('atrofia', 'atrofia-folicular', seta(0.438, 0.273, 45),
        rotulo='Folículos pequenos, com pouco coloide',
        vista=(0.40, 0.25, 0.50, 0.35)),
    est('foliculo', 'foliculo-tireoidiano', seta(0.0805, 0.3175, 180), rotulo='Folículo tireoidiano grande, com coloide (periferia menos acometida)',
        vista=(0.05, 0.25, 0.15, 0.35)),
    est('coloide', 'coloide', seta(0.068, 0.318, 45), rotulo='Coloide', vista=(0.05, 0.28, 0.12, 0.35)),
], achados=[
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado'], 'Infiltrado denso e difuso em quase todo o órgão.'),
    achado('hiperplasia-linfoide-reativa', 'presente', ['centro-germinativo'], 'Folículos linfoides com centros germinativos.'),
    achado('metaplasia-oncocitica', 'presente', ['hurthle'], 'Grupos de células de Hürthle revestindo folículos pequenos.'),
    achado('atrofia-folicular', 'presente', ['atrofia'], 'Folículos pequenos e esparsos entre o infiltrado; na periferia, folículos maiores com coloide.'),
    achado('fibrose-cicatricial', 'nao-avaliavel', [], 'Há septos entre lóbulos, mas a fibrose não foi avaliada com coloração específica; não é proeminente em H&E.'),
], conferencias=3, resumo='Tireoide com tireoidite de Hashimoto: infiltrado linfoplasmocitário denso com folículos linfoides e centros germinativos, folículos tireoidianos atróficos e metaplasia oncocítica (células de Hürthle); folículos com coloide preservados na periferia.')
print('ok')
