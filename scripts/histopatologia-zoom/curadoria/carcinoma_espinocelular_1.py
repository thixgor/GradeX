import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-espinocelular-1', [
    pat('perola', 'perola-cornea', seta(0.668, 0.1575, 270),
        rotulo='Pérola córnea',
        nota='Lamelas de queratina concêntricas, em casca de cebola, no centro de um ninho de células escamosas.',
        vista=(0.655, 0.140, 0.680, 0.165)),
    pat('perola-2', 'perola-cornea', seta(0.6487, 0.2210, 90),
        rotulo='Queratinização no centro dos ninhos',
        vista=(0.630, 0.205, 0.665, 0.240)),
    pat('ninhos', 'ninhos-escamosos-infiltrativos', seta(0.668, 0.147, 180),
        rotulo='Ninhos de células escamosas atípicas na derme',
        vista=(0.655, 0.135, 0.680, 0.160)),
    pat('atipia', 'atipia-citologica', seta(0.6665, 0.1475, 45),
        rotulo='Células grandes, citoplasma eosinofílico, núcleos atípicos',
        vista=(0.662, 0.143, 0.672, 0.153)),
    pat('invasao', 'invasao-estromal', seta(0.63, 0.23, 45),
        rotulo='Ninhos infiltrando a derme',
        vista=(0.59, 0.19, 0.68, 0.28)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.6655, 0.1372, 90),
        rotulo='Linfócitos no estroma entre os ninhos',
        vista=(0.657, 0.132, 0.673, 0.148)),
    est('glandulas-ecrinas', 'glandula-sudoripara-ecrina', seta(0.6120, 0.3300, 315), rotulo='Glândulas sudoríparas écrinas',
        vista=(0.58, 0.30, 0.62, 0.34)),
], achados=[
    achado('ninhos-escamosos-infiltrativos', 'presente', ['ninhos'], 'Ninhos irregulares de queratinócitos atípicos ocupam a derme.'),
    achado('perola-cornea', 'presente', ['perola', 'perola-2'], 'Pérolas córneas frequentes: carcinoma bem a moderadamente diferenciado.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos pleomórficos e hipercromáticos, com nucléolos.'),
    achado('invasao-estromal', 'presente', ['invasao'], 'Invasão da derme por ninhos e cordões.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado'], 'Infiltrado linfocitário no estroma.'),
    achado('ulceracao-da-mucosa', 'nao-avaliavel', [],
           'A superfície do tumor tem artefatos de corte (rachaduras e dobras) que impedem afirmar se há ulceração.'),
], conferencias=3, resumo='Pele da face com carcinoma espinocelular invasivo: ninhos de queratinócitos atípicos na derme, com pérolas córneas e infiltrado linfocitário. A lâmina tem rachaduras e coloração intensa de montagem antiga, que não comprometem os achados.')
print('ok')
