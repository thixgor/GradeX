import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('condrossarcoma-1', [
    pat('lobulos', 'condrocitos-atipicos', seta(0.4500, 0.6000, 45),
        rotulo='Tumor lobulado de matriz cartilaginosa',
        vista=(0.000, 0.000, 1.000, 1.070)),
    pat('hipercelular', 'condrocitos-atipicos', seta(0.3700, 0.5450, 45),
        rotulo='Cartilagem hipercelular',
        vista=(0.300, 0.500, 0.400, 0.600)),
    pat('atipicos', 'condrocitos-atipicos', seta(0.3450, 0.5455, 45),
        rotulo='Condrócitos grandes e hipercromáticos',
        vista=(0.340, 0.540, 0.360, 0.560)),
    pat('periferia', 'condrocitos-atipicos', seta(0.3350, 0.5750, 45),
        rotulo='Periferia do lóbulo mais celular',
        vista=(0.300, 0.500, 0.400, 0.600)),
], achados=[
    achado('condrocitos-atipicos', 'presente', ['lobulos', 'hipercelular', 'atipicos', 'periferia'], 'Lóbulos de cartilagem com celularidade aumentada, condrócitos de núcleos grandes, hipercromáticos e irregulares, mais densos na periferia dos lóbulos.'),
    achado('invasao-estromal', 'nao-avaliavel', [], 'Não há osso trabecular incluído nesta secção, então a permeação do osso não pode ser avaliada.'),
    achado('necrose-coagulativa', 'ausente', [], 'Sem necrose nos campos examinados.'),
], conferencias=3, resumo='Condrossarcoma do fêmur de mulher de 45 anos com dor: tumor lobulado de cartilagem hipercelular com condrócitos atípicos.')
print('ok')
