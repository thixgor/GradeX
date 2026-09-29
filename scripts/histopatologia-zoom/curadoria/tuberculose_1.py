import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('tuberculose-1', [
    pat('caseose', 'necrose-caseosa', seta(0.6255, 0.2555, 45),
        rotulo='Necrose caseosa: material amorfo, sem arquitetura',
        nota='Material eosinofílico granular, sem contorno de célula nem de vaso, com raros fragmentos nucleares.',
        vista=(0.620, 0.250, 0.632, 0.262)),
    pat('caseose-panoramica', 'necrose-caseosa', seta(0.50, 0.30, 45),
        rotulo='Áreas confluentes de caseose substituindo o linfonodo',
        vista=(0.22, 0.12, 0.82, 0.70)),
    pat('langhans', 'celula-gigante-de-langhans', seta(0.5728, 0.2748, 0),
        rotulo='Célula gigante de Langhans (núcleos em ferradura)',
        vista=(0.568, 0.268, 0.580, 0.280)),
    pat('epitelioides', 'granuloma-epitelioide', seta(0.5875, 0.2655, 45),
        rotulo='Macrófagos epitelioides na borda da necrose',
        nota='Células de citoplasma pálido e núcleo alongado ou "em sola de sapato", com limites mal definidos, entre a caseose e os linfócitos.',
        vista=(0.584, 0.262, 0.596, 0.274)),
    pat('granuloma-inicial', 'granuloma-epitelioide', seta(0.3535, 0.2552, 45),
        rotulo='Granuloma em formação no tecido linfoide',
        vista=(0.32, 0.23, 0.37, 0.28)),
    pat('linfocitos', 'infiltrado-linfoplasmocitario', seta(0.5775, 0.2735, 180),
        rotulo='Coroa de linfócitos em torno do granuloma',
        vista=(0.568, 0.264, 0.584, 0.280)),
    est('capsula', 'capsula-do-linfonodo', seta(0.40, 0.145, 90), rotulo='Cápsula do linfonodo',
        vista=(0.34, 0.10, 0.46, 0.20)),
], achados=[
    achado('necrose-caseosa', 'presente', ['caseose', 'caseose-panoramica'], 'Caseose extensa e confluente ocupa a maior parte do linfonodo.'),
    achado('granuloma-epitelioide', 'presente', ['epitelioides', 'granuloma-inicial'],
           'Macrófagos epitelioides em torno da necrose e granulomas menores, ainda sem necrose, no tecido linfoide residual.'),
    achado('celula-gigante-de-langhans', 'presente', ['langhans'], 'Numerosas células de Langhans na borda das áreas caseosas.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfocitos'], 'Linfócitos em volta dos granulomas.'),
    achado('fibrose-cicatricial', 'ausente', [], 'Não há fibrose nem calcificação significativas: lesão ativa, não cicatrizada.'),
], conferencias=3, resumo='Linfonodo cervical com linfadenite granulomatosa caseosa (tuberculose): grande parte do órgão substituída por necrose caseosa confluente, cercada por macrófagos epitelioides, células gigantes de Langhans e linfócitos; granulomas em formação no tecido linfoide restante.')
print('ok')
