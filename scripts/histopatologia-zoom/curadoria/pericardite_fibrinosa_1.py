import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pericardite-fibrinosa-1', [
    pat('fibrina', 'exsudato-fibrinopurulento', seta(0.8775, 0.3605, 45),
        rotulo='Fibrina em rede sobre o epicárdio',
        nota='Material eosinofílico em rede e em placas, sem estrutura própria, com células inflamatórias presas na malha: é o exsudato fibrinoso ("pão com manteiga").',
        vista=(0.870, 0.355, 0.890, 0.375)),
    pat('fibrina-panoramica', 'exsudato-fibrinopurulento', seta(0.883, 0.375, 180),
        rotulo='Camada de exsudato na superfície do coração',
        vista=(0.80, 0.30, 0.90, 0.40)),
    pat('organizacao', 'tecido-de-granulacao', seta(0.8765, 0.3195, 45),
        rotulo='Tecido de granulação organizando o exsudato',
        nota='Sob a fibrina, fibroblastos, capilares novos e células inflamatórias: a fibrina está sendo substituída por tecido conjuntivo (organização).',
        vista=(0.866, 0.310, 0.886, 0.330)),
    pat('inflamatorias', 'infiltrado-linfoplasmocitario', seta(0.8805, 0.3135, 45),
        rotulo='Linfócitos e macrófagos subepicárdicos',
        vista=(0.872, 0.305, 0.890, 0.323)),
    est('gordura', 'adipocito-unilocular', seta(0.8518, 0.3665, 45), rotulo='Gordura epicárdica', vista=(0.84, 0.34, 0.86, 0.36)),
    est('miocardio', 'fibra-muscular-cardiaca', seta(0.8425, 0.3505, 45), rotulo='Miocárdio subjacente preservado',
        vista=(0.84, 0.34, 0.86, 0.36)),
], achados=[
    achado('exsudato-fibrinopurulento', 'presente', ['fibrina', 'fibrina-panoramica'], 'Camada contínua de fibrina na superfície epicárdica.'),
    achado('tecido-de-granulacao', 'presente', ['organizacao'], 'Organização inicial por tecido de granulação sob a fibrina.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['inflamatorias'], 'Células mononucleares no tecido subepicárdico.'),
    achado('infiltrado-neutrofilico', 'nao-avaliavel', [], 'A lâmina está desbotada e os núcleos são pálidos; não é possível contar neutrófilos com segurança no exsudato.'),
    achado('hiperemia-e-congestao', 'nao-avaliavel', [], 'Poucos vasos subepicárdicos no plano do corte.'),
], conferencias=3, resumo='Parede ventricular com pericardite fibrinosa: fibrina em rede e em placas recobre o epicárdio, com células inflamatórias presas e tecido de granulação organizando o exsudato; miocárdio subjacente preservado. A coloração da lâmina é pálida e há um artefato escuro na borda inferior.')
print('ok')
