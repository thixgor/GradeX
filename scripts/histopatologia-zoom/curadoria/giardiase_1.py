import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('giardiase-1', [
    pat('trofozoitos', 'trofozoitos-de-giardia', seta(0.1900, 0.2636, 45),
        rotulo='Trofozoítos em forma de foice na luz',
        vista=(0.183, 0.258, 0.193, 0.268)),
    pat('trofozoito-isolado', 'trofozoitos-de-giardia', seta(0.1332, 0.2885, 45),
        rotulo='Trofozoíto isolado',
        vista=(0.128, 0.283, 0.140, 0.295)),
    pat('superficie', 'trofozoitos-de-giardia', seta(0.1886, 0.2630, 45),
        rotulo='Parasitas junto à superfície das vilosidades',
        vista=(0.180, 0.255, 0.196, 0.271)),
    est('vilosidade', 'vilosidade-intestinal', seta(0.1720, 0.2260, 45), rotulo='Vilosidade de altura normal',
        vista=(0.125, 0.215, 0.205, 0.295)),
    est('criptas', 'cripta-de-lieberkuhn', seta(0.1720, 0.2650, 45), rotulo='Criptas',
        vista=(0.125, 0.215, 0.205, 0.295)),
], achados=[
    achado('trofozoitos-de-giardia', 'presente', ['trofozoitos', 'trofozoito-isolado', 'superficie'], 'Grupos de trofozoítos em forma de foice ou folha curva na luz, perto da borda em escova; não invadem a mucosa.'),
    achado('atrofia-vilositaria', 'ausente', [], 'Vilosidades altas e delgadas, com relação vilo:cripta normal.'),
    achado('infiltrado-linfoplasmocitario', 'ausente', [], 'Lâmina própria com população inflamatória normal, incluindo plasmócitos.'),
], conferencias=3, resumo='Biópsias duodenais de mulher de 80 anos com anemia inexplicada: arquitetura vilositária normal e trofozoítos de Giardia na luz, junto à superfície.')
print('ok')
