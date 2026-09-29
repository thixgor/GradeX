import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('hiperplasia-prostatica-benigna-1', [
    pat('nodulo', 'hiperplasia-glandular', contorno((0.18, 0.33), (0.30, 0.29), (0.43, 0.30), (0.50, 0.36), (0.51, 0.45), (0.45, 0.52), (0.33, 0.53), (0.21, 0.49), (0.17, 0.41)),
        rotulo='Nódulo hiperplásico glandular',
        nota='Nódulo arredondado, cheio de glândulas de tamanhos variados, bem delimitado do estroma em volta.',
        vista=(0.12, 0.25, 0.56, 0.58)),
    pat('dupla-camada', 'glandulas-com-dupla-camada', seta(0.2065, 0.5885, 45),
        rotulo='Dupla camada: células colunares claras + células basais',
        nota='Por fora das células colunares de citoplasma claro, uma fileira de núcleos basais achatados — sinal de glândula benigna.',
        vista=(0.200, 0.580, 0.230, 0.610)),
    pat('cistos', 'dilatacao-cistica-glandular', seta(0.38, 0.385, 45),
        rotulo='Glândulas dilatadas com secreção',
        vista=(0.33, 0.34, 0.43, 0.44)),
    est('estroma', 'estroma-fibromuscular', seta(0.2175, 0.5835, 45), rotulo='Estroma fibromuscular',
        vista=(0.200, 0.575, 0.235, 0.610)),
    est('glandula', 'glandula-prostatica', seta(0.353, 0.371, 0), rotulo='Glândula com dobras papilares',
        vista=(0.33, 0.35, 0.39, 0.41)),
], achados=[
    achado('hiperplasia-glandular', 'presente', ['nodulo'], 'Vários nódulos glandulares e estromais ocupam o fragmento.'),
    achado('glandulas-com-dupla-camada', 'presente', ['dupla-camada'], 'Camada basal visível nas glândulas examinadas; sem nucléolos proeminentes.'),
    achado('dilatacao-cistica-glandular', 'presente', ['cistos'], 'Numerosas glândulas dilatadas com secreção eosinofílica.'),
    achado('infiltrado-linfoplasmocitario', 'nao-avaliavel', [], 'Há pequenos agregados linfoides na periferia, mas a prostatite crônica não foi graduada.'),
], conferencias=3, resumo='Próstata com hiperplasia nodular benigna: nódulos de glândulas (muitas dilatadas, com dobras papilares e secreção) e de estroma fibromuscular; as glândulas mantêm a dupla camada epitelial e não há atipia.')
print('ok')
