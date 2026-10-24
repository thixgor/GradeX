import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1124, caso 7 — "Angiomyolipoma".
salvar('angiomiolipoma-renal-2', [
    pat('vasos', 'vasos-de-parede-espessa-dismorficos', seta(0.3050, 0.2550, 225),
        rotulo='Vaso de parede muito espessa, hialina, com luz excêntrica e pequena',
        nota='A parede é um anel grosso de músculo liso e colágeno hialino, desproporcional à luz estreita, sem a lâmina elástica bem organizada de uma artéria normal. As células musculares parecem "descolar" da parede do vaso para o tecido vizinho — é dali que nasce o componente muscular do tumor (células PEComa, perivasculares epitelioides).',
        vista=(0.290, 0.240, 0.340, 0.290)),
    pat('vasos-2', 'vasos-de-parede-espessa-dismorficos', seta(0.3240, 0.2630, 315),
        rotulo='Grupo de vasos dismórficos',
        vista=(0.310, 0.240, 0.340, 0.275)),
    pat('gordura', 'tecido-adiposo-no-tumor', seta(0.3900, 0.4500, 225),
        rotulo='Ilha de adipócitos maduros dentro do tumor',
        nota='Lóbulos de células adiposas maduras, iguais às da gordura comum, estão no meio do tumor, sem nenhuma fronteira. Essa gordura é parte da neoplasia (as mesmas células PEComa se diferenciam em adipócitos) e é ela que dá o diagnóstico na tomografia: densidade negativa de gordura dentro de uma massa renal.',
        vista=(0.360, 0.420, 0.400, 0.470)),
    pat('musculo', 'vasos-de-parede-espessa-dismorficos', seta(0.3600, 0.4000, 135),
        rotulo='Componente de músculo liso fusocelular, em feixes',
        nota='Células fusiformes de citoplasma rosa, em feixes que se cruzam, como num leiomioma — o terceiro componente do tumor.',
        vista=(0.340, 0.380, 0.390, 0.430)),
    pat('trombo', 'hemorragia-intersticial', seta(0.5120, 0.4860, 225),
        rotulo='Vaso calibroso com trombo e hemorragia',
        nota='Os vasos dismórficos não têm parede elástica bem formada, formam aneurismas e se rompem. Este vaso está ocupado por trombo misto; em tumores maiores que 4 cm a hemorragia pode ser maciça (síndrome de Wunderlich) — razão para tratar os grandes.',
        vista=(0.480, 0.460, 0.540, 0.520)),
], achados=[
    achado('vasos-de-parede-espessa-dismorficos', 'presente', ['vasos', 'vasos-2', 'musculo'],
           'Vasos de parede espessa e hialina espalhados por toda a massa, com músculo liso que se desprende deles.'),
    achado('tecido-adiposo-no-tumor', 'presente', ['gordura'],
           'Várias ilhas de gordura madura espalhadas pelo tumor.'),
    achado('hemorragia-intersticial', 'presente', ['trombo'],
           'Vaso calibroso trombosado e focos de hemorragia, inclusive na borda direita.'),
], conferencias=3, resumo='Angiomiolipoma renal clássico (trifásico): feixes de músculo liso fusocelular, ilhas de gordura madura e vasos de parede muito espessa e hialina espalhados pela massa, um deles trombosado. A cápsula fibrosa contorna o tumor à esquerda.')
print('ok')
