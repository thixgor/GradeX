import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1394, caso 9 — "Sarcoidosis" (linfonodo).
salvar('sarcoidose-1', [
    pat('granulomas', 'granuloma-epitelioide', seta(0.6000, 0.4000, 225),
        rotulo='Granulomas pálidos, redondos e de tamanho parecido em todo o linfonodo',
        nota='A pequeno aumento, o linfonodo parece "salpicado": dezenas de nódulos pálidos, redondos, de tamanho uniforme, separados por faixas de linfócitos escuros. Cada nódulo é um granuloma epitelioide compacto. A uniformidade e a ausência de necrose são o desenho típico da sarcoidose.',
        vista=(0.200, 0.100, 0.950, 0.800)),
    pat('granuloma', 'granuloma-epitelioide', seta(0.4300, 0.4700, 45),
        rotulo='Granuloma compacto de histiócitos epitelioides, sem necrose',
        nota='Macrófagos ativados de citoplasma rosa-pálido abundante e núcleo oval, encostados uns nos outros como células epiteliais, formando um nódulo bem delimitado. O centro é viável: não há necrose caseosa — o que separa a sarcoidose da tuberculose.',
        vista=(0.400, 0.400, 0.500, 0.500)),
    pat('gigante', 'celula-gigante-de-langhans', seta(0.4770, 0.4100, 225),
        rotulo='Célula gigante multinucleada dentro do granuloma',
        nota='Célula enorme de citoplasma eosinofílico com vários núcleos — fusão de histiócitos epitelioides estimulados por interferon-γ. Às vezes contém corpos asteroides ou corpos de Schaumann (inclusões calcificadas lamelares), que não são específicos.',
        vista=(0.470, 0.405, 0.490, 0.425)),
    pat('linfocitos', 'infiltrado-linfoplasmocitario', seta(0.4850, 0.4200, 315),
        rotulo='Linfócitos pequenos entre os granulomas',
        vista=(0.480, 0.410, 0.490, 0.425)),
    est('linfonodo', 'linfocito', seta(0.4450, 0.4350, 135),
        rotulo='Tecido linfoide residual',
        vista=(0.420, 0.420, 0.460, 0.450)),
], achados=[
    achado('granuloma-epitelioide', 'presente', ['granulomas', 'granuloma'],
           'Granulomas epitelioides compactos, não necrosantes, de tamanho uniforme, substituindo grande parte do linfonodo.'),
    achado('celula-gigante-de-langhans', 'presente', ['gigante'],
           'Células gigantes multinucleadas em vários granulomas.'),
    achado('necrose-caseosa', 'ausente', [],
           'Nenhum granuloma conferido tem necrose central.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfocitos'],
           'Linfócitos em faixas entre os granulomas e em coroa fina ao redor deles.'),
    achado('fibrose-cicatricial', 'ausente', [],
           'Os granulomas estão ativos e celulares; não há fibrose hialina substituindo-os neste corte.'),
], conferencias=3, resumo='Linfonodo com sarcoidose: granulomas epitelioides compactos, redondos, de tamanho uniforme e sem necrose, com células gigantes multinucleadas, substituindo a maior parte do linfonodo e separados por faixas de linfócitos. A ausência de necrose caseosa e de organismos é o que permite o diagnóstico, sempre de exclusão.')
print('ok')
