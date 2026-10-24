import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 114, caso 12 — "Fibroadenoma".
salvar('fibroadenoma-da-mama-1', [
    pat('fibroepitelial', 'proliferacao-fibroepitelial', seta(0.3700, 0.1600, 225),
        rotulo='Ductos espalhados de modo uniforme num estroma abundante',
        nota='Ductos pequenos e alongados distribuídos por igual num estroma frouxo e colágeno que ocupa a maior parte do nódulo. Estroma e ductos cresceram juntos: o estroma especializado do lóbulo é o componente neoplásico, e os ductos vêm a reboque. Aqui o estroma envolve os ductos sem comprimi-los — padrão pericanalicular.',
        vista=(0.300, 0.100, 0.450, 0.250)),
    pat('estroma', 'proliferacao-fibroepitelial', seta(0.3500, 0.1450, 135),
        rotulo='Estroma de baixa celularidade, sem atipia nem mitoses',
        nota='Fibroblastos fusiformes esparsos, de núcleos pequenos, numa matriz frouxa e colágena. Estroma hipercelular, com atipia e mitoses, levantaria a suspeita de tumor filoide.',
        vista=(0.345, 0.140, 0.360, 0.153)),
    pat('dupla-camada', 'glandulas-com-dupla-camada', seta(0.3150, 0.1450, 315),
        rotulo='Ducto com epitélio luminal e camada mioepitelial',
        nota='O ducto tem células luminais cúbicas por dentro e uma camada de células mioepiteliais de núcleo achatado por fora, sobre a membrana basal — o componente epitelial é benigno.',
        vista=(0.312, 0.138, 0.326, 0.150)),
    pat('hialino', 'degeneracao-hialina', seta(0.3900, 0.1500, 90),
        rotulo='Faixas de colágeno hialino e pouco celular',
        vista=(0.360, 0.100, 0.420, 0.200)),
], achados=[
    achado('proliferacao-fibroepitelial', 'presente', ['fibroepitelial', 'estroma'],
           'Ductos e estroma proliferados juntos, em padrão pericanalicular, com estroma de baixa celularidade.'),
    achado('glandulas-com-dupla-camada', 'presente', ['dupla-camada'],
           'Os ductos mantêm a camada mioepitelial.'),
    achado('pseudocapsula-fibrosa', 'nao-avaliavel', [],
           'O corte é um fragmento do nódulo; a borda com o tecido mamário vizinho não está incluída.'),
    achado('degeneracao-hialina', 'presente', ['hialino'],
           'Faixas de colágeno hialino entre os grupos de ductos.'),
], conferencias=3, resumo='Fibroadenoma da mama (padrão pericanalicular): ductos pequenos e alongados, com epitélio luminal e camada mioepitelial preservados, distribuídos uniformemente num estroma abundante, frouxo e colágeno, de baixa celularidade e sem atipia, com faixas de hialinização.')
print('ok')
