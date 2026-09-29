import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('doenca-de-crohn-1', [
    pat('granuloma', 'granuloma-epitelioide', seta(0.6735, 0.4365, 45),
        rotulo='Granuloma epitelioide não caseoso',
        nota='Nódulo de macrófagos epitelioides em redemoinho, de citoplasma pálido e núcleos ovais, cercado por linfócitos, sem necrose central — dentro de um agregado linfoide da submucosa.',
        vista=(0.664, 0.427, 0.688, 0.451)),
    pat('agregado-muscular', 'agregados-linfoides-transmurais', seta(0.6395, 0.4905, 45),
        rotulo='Agregado linfoide dentro da muscular própria',
        vista=(0.60, 0.47, 0.70, 0.54)),
    pat('agregado-subseroso', 'agregados-linfoides-transmurais', seta(0.6905, 0.5105, 225),
        rotulo='Agregado linfoide na face externa da parede (subserosa)',
        vista=(0.60, 0.47, 0.70, 0.54)),
    pat('fibrose-submucosa', 'fibrose-da-submucosa', seta(0.755, 0.418, 45),
        rotulo='Submucosa espessada: fibrose, edema e inflamação crônica',
        vista=(0.70, 0.38, 0.80, 0.46)),
    pat('ulcera', 'ulceracao-da-mucosa', seta(0.826, 0.362, 90),
        rotulo='Úlcera: a mucosa desapareceu, a submucosa inflamada forma a superfície',
        vista=(0.77, 0.33, 0.87, 0.43)),
    est('muscular-propria', 'muscular-externa', seta(0.72, 0.485, 90), rotulo='Muscular própria',
        vista=(0.62, 0.44, 0.82, 0.54)),
    est('vilosidades', 'vilosidade-intestinal', seta(0.388, 0.17, 45), rotulo='Vilosidades do íleo (lúmen estreitado)',
        vista=(0.35, 0.10, 0.45, 0.30)),
], achados=[
    achado('granuloma-epitelioide', 'presente', ['granuloma'],
           'Granulomas pequenos e bem formados, sem necrose, dentro dos agregados linfoides da submucosa.'),
    achado('agregados-linfoides-transmurais', 'presente', ['agregado-muscular', 'agregado-subseroso'],
           'Agregados linfoides em toda a espessura da parede, enfileirados na face externa da muscular própria.'),
    achado('fibrose-da-submucosa', 'presente', ['fibrose-submucosa'], 'Submucosa muito alargada — correlaciona com a obstrução que motivou a ressecção.'),
    achado('ulceracao-da-mucosa', 'presente', ['ulcera'], 'Úlcera com perda da mucosa em um dos bordos do corte.'),
    achado('distorcao-arquitetural-das-criptas', 'nao-avaliavel', [],
           'A mucosa ileal conserva vilosidades em boa parte do corte; não se avaliou sistematicamente a arquitetura das criptas nem a metaplasia pilórica.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['fibrose-submucosa'],
           'Linfócitos e plasmócitos na lâmina própria e, sobretudo, na submucosa fibrosa.'),
    achado('abscesso-de-cripta', 'nao-avaliavel', [], 'Não foram identificados abscessos de cripta nos campos examinados; a atividade é focal no Crohn.'),
], conferencias=3, resumo='Segmento de íleo ressecado por obstrução, com o quadro clássico da doença de Crohn: parede espessada, submucosa fibrosa, agregados linfoides em toda a espessura da parede ("rosário") e granulomas epitelioides não caseosos; úlcera em um dos bordos.')
print('ok')
