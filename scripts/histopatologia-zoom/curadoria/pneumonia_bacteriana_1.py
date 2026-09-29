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

salvar('pneumonia-bacteriana-2', [
    pat('pus', 'abscesso', seta(0.7115, 0.2530, 45),
        rotulo='Pus: neutrófilos compactados na cavidade',
        nota='Grumos densos formados quase só por neutrófilos e restos celulares, dentro de uma cavidade: conteúdo do abscesso e do brônquio cheio de pus.',
        vista=(0.700, 0.240, 0.740, 0.280)),
    pat('cavidade', 'abscesso', seta(0.75, 0.30, 45),
        rotulo='Cavidade de abscesso com conteúdo purulento',
        vista=(0.60, 0.10, 0.90, 0.40)),
    pat('parede', 'tecido-de-granulacao', seta(0.6550, 0.3920, 45),
        rotulo='Parede do abscesso: granulação sob o pus',
        nota='O pus se apoia sobre tecido de granulação e fibrose, que tentam isolar a coleção.',
        vista=(0.640, 0.370, 0.680, 0.400)),
    pat('broncopneumonia', 'exsudato-alveolar-neutrofilico', seta(0.8230, 0.5975, 45),
        rotulo='Alvéolos com exsudato, macrófagos e neutrófilos',
        nota='No parênquima em volta, os alvéolos contêm exsudato proteináceo com macrófagos e neutrófilos: broncopneumonia e edema ao redor do abscesso.',
        vista=(0.815, 0.590, 0.830, 0.605)),
], achados=[
    achado('exsudato-alveolar-neutrofilico', 'presente', ['broncopneumonia'], 'Broncopneumonia em focos no parênquima em volta do abscesso, com exsudato proteináceo e macrófagos.'),
    achado('hiperemia-e-congestao', 'nao-avaliavel', [], 'Congestão não é proeminente nos campos examinados.'),
    achado('exsudato-fibrinopurulento', 'nao-avaliavel', [], 'A pleura não está incluída de forma avaliável neste corte.'),
    achado('abscesso', 'presente', ['pus', 'cavidade'], 'Abscesso pulmonar com cavidade cheia de pus, associado a brônquio purulento (bronquiectasia).'),
    achado('tecido-de-granulacao', 'presente', ['parede'], 'Parede de granulação e fibrose envolvendo a cavidade.'),
    achado('antracose', 'nao-avaliavel', [], 'Pigmento escasso; não é relevante neste caso.'),
], conferencias=3, resumo='Lobo superior ressecado com abscesso pulmonar e bronquiectasia: cavidade preenchida por pus (neutrófilos compactados), parede de tecido de granulação e fibrose, e broncopneumonia com edema no parênquima ao redor.')
print('ok2')
