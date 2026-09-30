import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('esofago-de-barrett-1', [
    pat('mucosa-colunar', 'metaplasia-intestinal', seta(0.4750, 0.1520, 45),
        rotulo='Mucosa colunar glandular no esôfago',
        vista=(0.440, 0.130, 0.520, 0.210)),
    pat('caliciformes', 'metaplasia-intestinal', seta(0.4613, 0.1481, 45),
        rotulo='Células caliciformes (metaplasia intestinal)',
        vista=(0.459, 0.146, 0.467, 0.154)),
    pat('caliciforme-2', 'metaplasia-intestinal', seta(0.4631, 0.1478, 45),
        rotulo='Outra célula caliciforme em "cálice"',
        vista=(0.459, 0.146, 0.467, 0.154)),
    pat('inflamacao', 'infiltrado-linfoplasmocitario', seta(0.4880, 0.1620, 45),
        rotulo='Inflamação crônica da lâmina própria',
        vista=(0.440, 0.130, 0.520, 0.210)),
    est('escamoso', 'epitelio-estratificado-pavimentoso', seta(0.5100, 0.1850, 45), rotulo='Epitélio escamoso esofágico original',
        vista=(0.440, 0.130, 0.520, 0.210)),
], achados=[
    achado('metaplasia-intestinal', 'presente', ['mucosa-colunar', 'caliciformes', 'caliciforme-2'], 'Mucosa colunar com numerosas células caliciformes, ao lado de fragmentos de epitélio escamoso esofágico.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['inflamacao'], 'Inflamação crônica da lâmina própria.'),
    achado('displasia-epitelial', 'nao-avaliavel', [], 'Há núcleos alongados e algo apinhados nas glândulas, mas com inflamação ao lado; sem imuno e níveis adicionais, não se afirma nem se exclui displasia.'),
], conferencias=3, resumo='Biópsias de esôfago de homem de 60 anos com esofagite: mucosa colunar com metaplasia intestinal (células caliciformes) — esôfago de Barrett — ao lado de epitélio escamoso.')
print('ok')
