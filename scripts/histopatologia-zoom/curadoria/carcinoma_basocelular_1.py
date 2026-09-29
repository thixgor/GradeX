import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-basocelular-1', [
    pat('ninhos', 'ninhos-basaloides', seta(0.265, 0.12, 45),
        rotulo='Ninhos de células basaloides na derme',
        vista=(0.20, 0.05, 0.34, 0.16)),
    pat('celulas', 'ninhos-basaloides', seta(0.2475, 0.1075, 45),
        rotulo='Células basaloides: núcleo oval, pouco citoplasma',
        vista=(0.244, 0.103, 0.256, 0.115)),
    pat('palicada', 'paliçada-periferica', seta(0.2168, 0.1238, 45),
        rotulo='Paliçada periférica: núcleos alinhados na borda do ninho',
        vista=(0.206, 0.113, 0.222, 0.129)),
    pat('fenda', 'fenda-de-retracao', seta(0.655, 0.1385, 270),
        rotulo='Fenda de retração entre o tumor e o estroma',
        vista=(0.62, 0.11, 0.70, 0.16)),
    pat('estroma', 'infiltrado-linfoplasmocitario', seta(0.7155, 0.137, 180),
        rotulo='Infiltrado linfocitário no estroma peritumoral',
        vista=(0.69, 0.12, 0.73, 0.16)),
    pat('invasao', 'invasao-estromal', seta(0.228, 0.141, 270),
        rotulo='Ninhos invadindo a derme a partir da epiderme',
        vista=(0.10, 0.03, 0.36, 0.20)),
    est('epiderme', 'epiderme', seta(0.46, 0.1005, 90), rotulo='Epiderme', vista=(0.42, 0.06, 0.50, 0.12)),
    est('foliculo', 'foliculo-piloso', seta(0.7838, 0.235, 0), rotulo='Folículo piloso', vista=(0.72, 0.18, 0.84, 0.30)),
], achados=[
    achado('ninhos-basaloides', 'presente', ['ninhos', 'celulas'], 'Grandes ninhos basaloides ocupando a derme superficial e média (padrão nodular).'),
    achado('paliçada-periferica', 'presente', ['palicada'], 'Paliçada evidente na periferia dos ninhos.'),
    achado('fenda-de-retracao', 'presente', ['fenda'], 'Fendas de retração na base do tumor.'),
    achado('invasao-estromal', 'presente', ['invasao'], 'Os ninhos brotam da epiderme e invadem a derme.'),
    achado('ulceracao-da-mucosa', 'ausente', [],
           'A epiderme está íntegra neste corte; há apenas uma crosta hemorrágica aderida à superfície no centro da lesão.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['estroma'], 'Linfócitos no estroma, sobretudo na base e entre os ninhos.'),
], conferencias=3, resumo='Pele da fronte com carcinoma basocelular nodular: grandes ninhos de células basaloides com paliçada periférica e fendas de retração ocupando a derme, ligados à epiderme, que está íntegra. Anexos normais nas margens.')
print('ok')
