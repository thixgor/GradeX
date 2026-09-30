import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('dermatite-de-contato-1', [
    pat('espongiose', 'espongiose', seta(0.6640, 0.0985, 45),
        rotulo='Espongiose: fendas claras entre os queratinócitos',
        vista=(0.655, 0.090, 0.675, 0.110)),
    pat('edema', 'edema-inflamatorio', seta(0.6125, 0.1300, 45),
        rotulo='Edema intenso da derme papilar',
        vista=(0.550, 0.050, 0.750, 0.250)),
    pat('vesicula-subepidermica', 'edema-inflamatorio', seta(0.6400, 0.0950, 45),
        rotulo='Edema levantando a epiderme (vesícula subepidérmica)',
        vista=(0.550, 0.050, 0.750, 0.250)),
    pat('infiltrado', 'infiltrado-linfocitario-perivascular', seta(0.6262, 0.2058, 45),
        rotulo='Linfócitos em volta dos vasos da derme',
        vista=(0.610, 0.195, 0.630, 0.215)),
    est('epiderme', 'epiderme', seta(0.7000, 0.1100, 45), rotulo='Epiderme',
        vista=(0.550, 0.050, 0.750, 0.250)),
], achados=[
    achado('espongiose', 'presente', ['espongiose'], 'Fendas claras entre os queratinócitos, com pontes intercelulares evidentes, na epiderme sobre a área edemaciada.'),
    achado('edema-inflamatorio', 'presente', ['edema', 'vesicula-subepidermica'], 'Edema acentuado da derme papilar, que chega a descolar a epiderme em vesículas subepidérmicas.'),
    achado('infiltrado-linfocitario-perivascular', 'presente', ['infiltrado'], 'Linfócitos e histiócitos em volta dos vasos da derme superficial e média.'),
], conferencias=3, resumo='Dermatite de contato alérgica: espongiose da epiderme, edema intenso da derme papilar com vesículas subepidérmicas e infiltrado linfocitário perivascular.')
print('ok')
