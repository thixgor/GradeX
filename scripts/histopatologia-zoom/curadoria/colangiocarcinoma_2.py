import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1481, caso 23 — "Cholangiocarcinoma, peripheral, small duct type".
salvar('colangiocarcinoma-2', [
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.6250, 0.2050, 135),
        rotulo='Túbulos e ninhos de epitélio biliar atípico',
        nota='O tumor é feito de túbulos pequenos, cordões e ninhos de células cúbicas, alguns formando luz — um epitélio que imita o de pequenos ductos biliares. É o colangiocarcinoma periférico de pequenos ductos, que nasce dos dúctulos e canais de Hering, dentro do parênquima.',
        vista=(0.580, 0.150, 0.660, 0.230)),
    pat('desmoplasia', 'reacao-desmoplasica', seta(0.6000, 0.1650, 45),
        rotulo='Estroma fibroso denso e abundante entre as glândulas',
        nota='Entre os grupos tumorais há colágeno denso, pálido, com poucos fibroblastos — a desmoplasia é tão marcante no colangiocarcinoma que o tumor é duro e branco na peça, e uma biópsia pequena pode trazer mais fibrose que tumor.',
        vista=(0.580, 0.150, 0.630, 0.190)),
    pat('atipia', 'atipia-citologica', seta(0.6400, 0.1750, 225),
        rotulo='Núcleos redondos a ovais, aumentados, apertados',
        vista=(0.630, 0.165, 0.650, 0.185)),
    pat('invasao', 'invasao-estromal', seta(0.5200, 0.3200, 45),
        rotulo='Frente do tumor contra o fígado não tumoral',
        nota='À esquerda da diagonal o parênquima é fígado com trabéculas e espaços-porta normais; à direita, tumor com estroma fibroso. A borda é infiltrativa, sem cápsula — diferente do carcinoma hepatocelular encapsulado.',
        vista=(0.440, 0.150, 0.620, 0.420)),
    est('espaco-porta', 'espaco-porta', seta(0.4900, 0.3250, 45),
        rotulo='Espaço-porta do fígado não tumoral',
        vista=(0.475, 0.310, 0.510, 0.340)),
    est('hepatocitos', 'hepatocito', seta(0.4700, 0.3600, 135),
        rotulo='Trabéculas de hepatócitos normais',
        vista=(0.450, 0.340, 0.500, 0.380)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['glandulas'],
           'Túbulos, cordões e ninhos de epitélio biliar atípico na metade direita do corte.'),
    achado('reacao-desmoplasica', 'presente', ['desmoplasia'],
           'Estroma fibroso denso entre os grupos tumorais.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos aumentados e apertados, de atipia moderada.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Borda infiltrativa contra o fígado não tumoral, sem cápsula.'),
], conferencias=3, resumo='Colangiocarcinoma intra-hepático periférico (tipo de pequenos ductos): túbulos, cordões e ninhos de epitélio biliar atípico em estroma desmoplásico denso, crescendo com borda infiltrativa contra o fígado não tumoral (à esquerda, com trabéculas e espaços-porta normais).')
print('ok')
