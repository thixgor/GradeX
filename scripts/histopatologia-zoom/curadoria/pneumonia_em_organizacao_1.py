import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pneumonia-em-organizacao-1', [
    pat('masson', 'corpos-de-masson', seta(0.2860, 0.6040, 45),
        rotulo='Corpo de Masson: tampão fibroblástico no espaço aéreo',
        nota='Fibroblastos em matriz frouxa e pálida preenchem o espaço aéreo, revestidos por pneumócitos — tecido de granulação dentro do alvéolo.',
        vista=(0.275, 0.595, 0.297, 0.614)),
    pat('masson-2', 'corpos-de-masson', seta(0.2280, 0.6200, 45),
        rotulo='Outro tampão mixoide intra-alveolar',
        vista=(0.215, 0.610, 0.245, 0.640)),
    pat('pneumocitos', 'hiperplasia-de-pneumocitos-tipo-ii', seta(0.2905, 0.5870, 225),
        rotulo='Pneumócitos tipo II reativos',
        vista=(0.283, 0.580, 0.297, 0.594)),
    pat('antracose', 'antracose', seta(0.5750, 0.9110, 45),
        rotulo='Antracose em área de fibrose',
        vista=(0.540, 0.880, 0.610, 0.940)),
], achados=[
    achado('corpos-de-masson', 'presente', ['masson', 'masson-2'], 'Vários tampões de tecido de granulação dentro dos espaços aéreos.'),
    achado('hiperplasia-de-pneumocitos-tipo-ii', 'presente', ['pneumocitos'], 'Pneumócitos tipo II reativos nos septos vizinhos.'),
    achado('pneumonite-intersticial-cronica', 'nao-avaliavel', [], 'Os cilindros de agulha são pequenos e fragmentados; a inflamação intersticial é leve e irregular.'),
    achado('antracose', 'presente', ['antracose'], 'Pigmento antracótico em área fibrosa de um dos cilindros.'),
], conferencias=3, resumo='Biópsias pulmonares por agulha de uma "massa" com pneumonia em organização: tampões de tecido de granulação mixoide (corpos de Masson) dentro dos espaços aéreos e pneumócitos tipo II reativos, com arquitetura preservada. Nenhuma neoplasia nos fragmentos.')
print('ok')
