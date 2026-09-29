import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('aterosclerose-1', [
    pat('fendas', 'fendas-de-colesterol', seta(0.3158, 0.1791, 45),
        rotulo='Fendas de colesterol (cristais dissolvidos)',
        vista=(0.310, 0.165, 0.335, 0.190)),
    pat('nucleo', 'fendas-de-colesterol', seta(0.345, 0.10, 45),
        rotulo='Núcleo lipídico-necrótico cheio de fendas',
        nota='Grande área com centenas de fendas em agulha: é o núcleo da placa, onde o colesterol extracelular se acumulou.',
        vista=(0.28, 0.08, 0.46, 0.22)),
    pat('espumosas', 'celulas-espumosas', seta(0.3263, 0.1352, 45),
        rotulo='Células espumosas (citoplasma vacuolado)',
        vista=(0.320, 0.130, 0.335, 0.145)),
    pat('capa', 'fibrose-cicatricial', seta(0.345, 0.2005, 45),
        rotulo='Capa fibrosa voltada para a luz',
        nota='Colágeno denso entre o núcleo da placa e a luz: é o que impede a placa de romper.',
        vista=(0.28, 0.14, 0.46, 0.24)),
    pat('hemorragia', 'hemorragia-intersticial', seta(0.3195, 0.1395, 45),
        rotulo='Hemácias extravasadas dentro da placa',
        vista=(0.305, 0.125, 0.335, 0.155)),
    est('media', 'tunica-media', seta(0.915, 0.34, 180), rotulo='Túnica média em parede sem placa',
        vista=(0.86, 0.30, 0.95, 0.39)),
], achados=[
    achado('fendas-de-colesterol', 'presente', ['fendas', 'nucleo'], 'Núcleo necrótico extenso com fendas de colesterol.'),
    achado('celulas-espumosas', 'presente', ['espumosas'], 'Macrófagos vacuolados junto ao núcleo necrótico.'),
    achado('fibrose-cicatricial', 'presente', ['capa'], 'Capa fibrosa de colágeno entre o núcleo e a luz.'),
    achado('hemorragia-intersticial', 'presente', ['hemorragia'], 'Focos de hemorragia dentro da placa.'),
    achado('trombo-com-linhas-de-zahn', 'nao-avaliavel', [],
           'Há uma massa de hemácias compactadas aderida à parede, compatível com o trombo mural do aneurisma, mas fragmentada e sem linhas de Zahn nítidas; não se separa com segurança da hemorragia da placa.'),
], conferencias=3, resumo='Aorta abdominal com aneurisma e placa aterosclerótica complicada: núcleo lipídico-necrótico com fendas de colesterol, células espumosas, hemorragia intraplaca e capa fibrosa; na parede oposta, túnica média preservada.')

salvar('trombose-arterial-1', [
    pat('zahn', 'trombo-com-linhas-de-zahn', seta(0.62, 0.185, 45),
        rotulo='Trombo com faixas de fibrina alternadas com hemácias',
        nota='Faixas rosa-pálidas de plaquetas e fibrina alternam com faixas vermelhas de hemácias: as linhas de Zahn, que mostram que o trombo se formou com sangue circulando.',
        vista=(0.56, 0.12, 0.80, 0.30)),
    pat('fibrina', 'trombo-com-linhas-de-zahn', seta(0.6525, 0.1795, 45),
        rotulo='Fibrina e hemácias no trombo',
        vista=(0.640, 0.170, 0.660, 0.190)),
    pat('organizacao', 'organizacao-do-trombo', seta(0.6665, 0.1575, 45),
        rotulo='Organização a partir da parede',
        nota='No ponto em que o trombo se prende à íntima, células fusiformes e mononucleares penetram a massa de fibrina: organização inicial.',
        vista=(0.64, 0.125, 0.72, 0.175)),
    pat('trombo-2', 'trombo-com-linhas-de-zahn', seta(0.34, 0.37, 45),
        rotulo='Segundo trombo ocluindo outra artéria',
        vista=(0.20, 0.26, 0.48, 0.50)),
    pat('intima', 'espessamento-arterial', seta(0.40, 0.46, 270),
        rotulo='Parede arterial espessada em torno da luz',
        vista=(0.20, 0.26, 0.48, 0.50)),
], achados=[
    achado('trombo-com-linhas-de-zahn', 'presente', ['zahn', 'fibrina', 'trombo-2'], 'Trombos ocluindo a luz de duas artérias, com camadas de fibrina e hemácias.'),
    achado('organizacao-do-trombo', 'presente', ['organizacao'], 'Organização inicial no ponto de fixação.'),
    achado('espessamento-arterial', 'presente', ['intima'], 'Parede espessada de forma concêntrica (a separação entre íntima e média exigiria coloração para fibras elásticas).'),
    achado('fendas-de-colesterol', 'ausente', [], 'Não há núcleo ateromatoso com fendas de colesterol sob os trombos neste corte.'),
], conferencias=3, resumo='Artérias de médio calibre com trombos ocluindo a luz: camadas alternadas de fibrina/plaquetas e hemácias, fixação à íntima espessada e organização inicial a partir da parede. As faixas escuras em cunha são dobras do corte.')
print('ok')
