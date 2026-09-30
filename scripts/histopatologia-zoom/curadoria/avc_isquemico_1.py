import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('avc-isquemico-1', [
    pat('panorama', 'hemorragia-intersticial', seta(0.4000, 0.4000, 45),
        rotulo='Tronco encefálico salpicado de hemorragias petequiais',
        vista=(0.000, 0.000, 1.000, 0.700)),
    pat('petequias', 'hemorragia-intersticial', seta(0.6760, 0.2640, 45),
        rotulo='Hemácias extravasadas no neurópilo',
        vista=(0.670, 0.258, 0.680, 0.268)),
    pat('perivascular', 'hemorragia-intersticial', seta(0.4015, 0.4010, 45),
        rotulo='Hemorragia em volta de um vaso',
        vista=(0.395, 0.395, 0.405, 0.405)),
    pat('neuropilo', 'infarto-cerebral-agudo', seta(0.6245, 0.3075, 45),
        rotulo='Neurópilo pálido, vacuolado, desintegrando-se',
        vista=(0.620, 0.300, 0.640, 0.320)),
    pat('area-infarto', 'infarto-cerebral-agudo', seta(0.6400, 0.3050, 45),
        rotulo='Área infartada com edema e hemorragia',
        vista=(0.600, 0.250, 0.700, 0.350)),
    pat('vasos', 'hiperemia-e-congestao', seta(0.5270, 0.2020, 45),
        rotulo='Capilares congestos',
        vista=(0.520, 0.200, 0.530, 0.210)),
], achados=[
    achado('infarto-cerebral-agudo', 'presente', ['neuropilo', 'area-infarto'], 'Neurópilo rarefeito, vacuolado e fragmentado no território infartado do tronco, sem macrófagos espumosos — infarto recente.'),
    achado('neuronios-vermelhos', 'nao-avaliavel', [], 'Há neurônios com citoplasma mais eosinofílico, mas nenhum com a retração angulosa e o núcleo picnótico típicos nos campos examinados; não se afirma.'),
    achado('hemorragia-intersticial', 'presente', ['panorama', 'petequias', 'perivascular'], 'Numerosas hemorragias petequiais e perivasculares por todo o corte (transformação hemorrágica).'),
    achado('hiperemia-e-congestao', 'presente', ['vasos'], 'Capilares e vênulas dilatados e cheios de hemácias.'),
], conferencias=3, resumo='Tronco encefálico de homem de 63 anos com AVC após dissecção de artéria vertebral e trombose da basilar: infarto isquêmico agudo com neurópilo pálido e vacuolado e extensas hemorragias petequiais.')
print('ok')
