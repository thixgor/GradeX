import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pneumonia-bacteriana-1', [
    pat('exsudato', 'exsudato-alveolar-neutrofilico', seta(0.6660, 0.2950, 45),
        rotulo='Alvéolo cheio de neutrófilos e fibrina',
        nota='Cada alvéolo está preenchido por neutrófilos presos numa rede de fibrina, com hemácias entre eles — o ar foi substituído por exsudato.',
        vista=(0.660, 0.290, 0.675, 0.305)),
    pat('consolidacao', 'exsudato-alveolar-neutrofilico', seta(0.68, 0.32, 45),
        rotulo='Consolidação uniforme de todo o parênquima',
        nota='Todos os alvéolos do campo estão na mesma fase: é o aspecto homogêneo da pneumonia lobar (hepatização).',
        vista=(0.62, 0.25, 0.72, 0.35)),
    pat('hemacias', 'hiperemia-e-congestao', seta(0.6700, 0.3015, 45),
        rotulo='Hemácias no exsudato (hepatização vermelha)',
        vista=(0.664, 0.296, 0.676, 0.308)),
    pat('pleurite', 'exsudato-fibrinopurulento', seta(0.8850, 0.1150, 180),
        rotulo='Pleura espessada com fibrina (pleurite)',
        vista=(0.83, 0.06, 0.93, 0.16)),
    pat('antracose', 'antracose', seta(0.8570, 0.0870, 45),
        rotulo='Antracose perivascular',
        vista=(0.83, 0.06, 0.93, 0.16)),
    est('septo', 'septo-alveolar', seta(0.7060, 0.2860, 90), rotulo='Septo alveolar preservado', vista=(0.695, 0.270, 0.715, 0.290)),
    est('arteriola', 'vaso-sanguineo', seta(0.7065, 0.2795, 0), rotulo='Ramo arterial pulmonar', vista=(0.695, 0.270, 0.715, 0.290)),
], achados=[
    achado('exsudato-alveolar-neutrofilico', 'presente', ['exsudato', 'consolidacao'], 'Consolidação difusa: alvéolos cheios de neutrófilos, fibrina e hemácias, com septos íntegros.'),
    achado('hiperemia-e-congestao', 'presente', ['hemacias'], 'Hemácias abundantes no exsudato e septos congestos.'),
    achado('exsudato-fibrinopurulento', 'presente', ['pleurite'], 'Pleura espessada por fibrina e células inflamatórias sobre o parênquima consolidado.'),
    achado('abscesso', 'ausente', [], 'Os septos estão preservados em todo o corte: não há necrose com formação de abscesso.'),
    achado('tecido-de-granulacao', 'ausente', [], 'Não há organização do exsudato (sem fibroblastos dentro dos alvéolos).'),
    achado('antracose', 'presente', ['antracose'], 'Antracose perivascular e subpleural, incidental.'),
], conferencias=3, resumo='Pulmão com pneumonia bacteriana do padrão lobar: consolidação uniforme de todo o corte, com alvéolos cheios de neutrófilos, fibrina e hemácias (hepatização), septos preservados e pleurite fibrinosa. Lâmina da coleção de graduação de Leeds sem diagnóstico registrado; a classificação foi feita pelo exame microscópico.')
print('ok')
