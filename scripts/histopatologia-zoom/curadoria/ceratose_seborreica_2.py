import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 52, caso 1 — "Seborrheic keratosis". O corte foi montado
# com a epiderme para baixo e a gordura subcutânea para cima.
salvar('ceratose-seborreica-2', [
    pat('acantose', 'acantose-basaloide-exofitica', seta(0.4000, 0.5650, 315),
        rotulo='Epiderme muito espessada por células basaloides uniformes',
        nota='A lesão é um platô de epiderme espessada que se projeta para fora do nível da pele vizinha (à direita, a epiderme normal é fina). Ela é feita quase só de células basaloides — pequenas, de núcleo oval regular e pouco citoplasma —, todas parecidas entre si. Atenção à orientação: neste corte a superfície da pele está embaixo.',
        vista=(0.050, 0.400, 0.950, 0.650)),
    pat('basaloides', 'acantose-basaloide-exofitica', seta(0.4060, 0.5370, 225),
        rotulo='Células basaloides monótonas, sem atipia',
        nota='Núcleos ovais, do mesmo tamanho, cromatina fina, sem nucléolos grandes nem mitoses atípicas. A uniformidade é o que separa a ceratose seborreica (proliferação benigna de queratinócitos) do carcinoma basocelular e do espinocelular.',
        vista=(0.395, 0.530, 0.415, 0.545)),
    pat('pseudocisto', 'pseudocistos-corneos', seta(0.3200, 0.5450, 45),
        rotulo='Pseudocisto córneo: queratina lamelar dentro da lesão',
        nota='Um espaço redondo cheio de queratina em lamelas, aprisionado no meio da massa epitelial. Não é cisto verdadeiro: são invaginações da superfície cortadas transversalmente — a queratina que deveria descamar fica presa entre as cristas. É o achado mais característico da lesão.',
        vista=(0.280, 0.500, 0.360, 0.580)),
    pat('pseudocisto-2', 'pseudocistos-corneos', seta(0.5900, 0.4700, 135),
        rotulo='Outros pseudocistos córneos',
        vista=(0.540, 0.440, 0.680, 0.530)),
    est('derme', 'derme-reticular', seta(0.4500, 0.3500, 90),
        rotulo='Derme com infiltrado linfocitário discreto e vasos',
        vista=(0.300, 0.300, 0.600, 0.450)),
    est('epiderme-normal', 'epiderme', seta(0.8500, 0.4050, 270),
        rotulo='Epiderme normal vizinha, fina',
        vista=(0.780, 0.380, 0.950, 0.430)),
    est('gordura', 'adipocito-unilocular', seta(0.6500, 0.1300, 45),
        rotulo='Gordura subcutânea (no alto, por causa da orientação do corte)',
        vista=(0.500, 0.020, 0.900, 0.250)),
], achados=[
    achado('acantose-basaloide-exofitica', 'presente', ['acantose', 'basaloides'],
           'Platô de epiderme espessada por células basaloides uniformes, acima do nível da pele vizinha.'),
    achado('pseudocistos-corneos', 'presente', ['pseudocisto', 'pseudocisto-2'],
           'Vários pseudocistos córneos de queratina lamelar espalhados pela lesão.'),
    achado('pigmento-melanico', 'ausente', [],
           'As células basaloides não mostram melanina visível neste corte (forma não pigmentada).'),
], conferencias=3, resumo='Ceratose seborreica acantótica: platô de epiderme muito espessada por células basaloides monótonas, sem atipia, com pseudocistos córneos de queratina lamelar, acima do nível da epiderme vizinha. O corte foi montado de cabeça para baixo — a superfície da pele está embaixo e a gordura subcutânea, em cima.')
print('ok')
