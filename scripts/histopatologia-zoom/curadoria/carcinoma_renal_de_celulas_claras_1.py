import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-renal-de-celulas-claras-1', [
    pat('claras', 'celulas-claras-neoplasicas', seta(0.6655, 0.3355, 45),
        rotulo='Células de citoplasma claro formando ácinos',
        vista=(0.662, 0.332, 0.668, 0.338)),
    pat('claras-medio', 'celulas-claras-neoplasicas', seta(0.5174, 0.0660, 45),
        rotulo='Ninhos de células claras sob a pseudocápsula',
        vista=(0.500, 0.045, 0.530, 0.075)),
    pat('capilar', 'rede-capilar-delicada', seta(0.6648, 0.3363, 45),
        rotulo='Capilar fino com hemácias entre os ninhos',
        vista=(0.662, 0.332, 0.668, 0.338)),
    pat('hemorragia', 'hemorragia-intersticial', seta(0.4700, 0.2800, 45),
        rotulo='Lagos de hemorragia dentro do tumor',
        vista=(0.380, 0.180, 0.580, 0.380)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.5120, 0.0575, 45),
        rotulo='Pseudocápsula fibrosa',
        vista=(0.500, 0.045, 0.530, 0.075)),
], achados=[
    achado('celulas-claras-neoplasicas', 'presente', ['claras', 'claras-medio'], 'Ninhos e ácinos de células poligonais de citoplasma claro e membranas nítidas; núcleos pequenos e redondos, sem nucléolos evidentes no médio aumento (baixo grau nuclear).'),
    achado('rede-capilar-delicada', 'presente', ['capilar'], 'Capilares finos cheios de hemácias contornando cada ninho, em todo o tumor.'),
    achado('hemorragia-intersticial', 'presente', ['hemorragia'], 'Grande área de hemorragia com lagos de sangue entre os ninhos, além de espaços císticos com sangue.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'], 'Faixa fibrosa na periferia do tumor. Não há parênquima renal normal nesta lâmina.'),
    achado('necrose-coagulativa', 'ausente', [], 'Não há necrose tumoral. A área central pálida é estroma hialinizado e edemaciado com hemossiderina — alteração regressiva, sem células-fantasma.'),
], conferencias=3, resumo='Carcinoma renal de células claras de baixo grau nuclear: ninhos de células claras envoltos por rede capilar delicada, com hemorragia extensa, cistos e área central de regressão hialina; pseudocápsula fibrosa na periferia.')
print('ok')
