import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('dermatofibroma-1', [
    pat('lesao', 'proliferacao-fusocelular-com-colageno-aprisionado', seta(0.4200, 0.8800, 45),
        rotulo='Área dérmica mais celular',
        vista=(0.300, 0.820, 0.500, 0.970)),
    pat('fusiformes', 'proliferacao-fusocelular-com-colageno-aprisionado', seta(0.4055, 0.8836, 45),
        rotulo='Células fusiformes entre fibras de colágeno',
        vista=(0.400, 0.880, 0.412, 0.892)),
    pat('epiderme-espessa', 'hiperplasia-epidermica-sobrejacente', seta(0.3200, 0.8533, 45),
        rotulo='Epiderme espessada sobre a lesão',
        vista=(0.300, 0.820, 0.360, 0.870)),
], achados=[
    achado('proliferacao-fusocelular-com-colageno-aprisionado', 'presente', ['lesao', 'fusiformes'], 'Proliferação de células fusiformes sem atipia na derme reticular, entremeada ao colágeno, que fica isolado em feixes na periferia.'),
    achado('hiperplasia-epidermica-sobrejacente', 'presente', ['epiderme-espessa'], 'Cristas epidérmicas alongadas e mais pigmentadas acima da lesão.'),
    achado('celulas-espumosas', 'ausente', [], 'Não há macrófagos espumosos nem hemossiderina: variante fibrosa comum.'),
], conferencias=3, resumo='Dermatofibroma do braço: proliferação dérmica de células fusiformes sem atipia que aprisionam o colágeno, com hiperplasia da epiderme sobrejacente.')
print('ok')
