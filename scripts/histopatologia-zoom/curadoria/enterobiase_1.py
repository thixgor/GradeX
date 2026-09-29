import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('enterobiase-1', [
    pat('vermes', 'enterobius-vermicularis', seta(0.2950, 0.5150, 45),
        rotulo='Vários vermes cortados na luz do apêndice',
        vista=(0.230, 0.460, 0.370, 0.560)),
    pat('verme', 'enterobius-vermicularis', seta(0.2700, 0.4960, 45),
        rotulo='Verme com cutícula espessa',
        vista=(0.255, 0.485, 0.285, 0.515)),
    pat('asa-lateral', 'enterobius-vermicularis', seta(0.2666, 0.4918, 45),
        rotulo='Asa lateral da cutícula',
        vista=(0.255, 0.485, 0.285, 0.515)),
    pat('intestino-do-verme', 'enterobius-vermicularis', seta(0.3185, 0.5164, 45),
        rotulo='Tubo intestinal do verme',
        vista=(0.300, 0.505, 0.330, 0.535)),
    est('criptas', 'cripta-de-lieberkuhn', seta(0.2450, 0.5250, 45), rotulo='Mucosa do apêndice preservada',
        vista=(0.230, 0.460, 0.370, 0.560)),
], achados=[
    achado('enterobius-vermicularis', 'presente', ['vermes', 'verme', 'asa-lateral', 'intestino-do-verme'], 'Muitos cortes transversais do verme na luz, com cutícula eosinofílica, asas laterais pontiagudas, musculatura e tubo intestinal.'),
    achado('inflamacao-aguda-transmural', 'ausente', [], 'Mucosa íntegra, sem úlcera nem neutrófilos na muscular: não há apendicite aguda.'),
    achado('eosinofilos-teciduais', 'nao-avaliavel', [], 'A lâmina própria tem o tecido linfoide abundante próprio da criança; não se identifica aumento claro de eosinófilos nesta resolução.'),
], conferencias=3, resumo='Apêndice de menina de 6 anos com dor na fossa ilíaca direita: luz com muitos Enterobius vermicularis (asas laterais evidentes), sem apendicite aguda.')
print('ok')
