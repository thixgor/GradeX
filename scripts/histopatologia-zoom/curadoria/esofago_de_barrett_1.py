import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('esofago-de-barrett-1', [], achados=[
    achado('metaplasia-intestinal', 'presente', [], 'Mucosa colunar com numerosas células caliciformes, ao lado de fragmentos de epitélio escamoso esofágico.'),
    achado('infiltrado-linfoplasmocitario', 'presente', [], 'Inflamação crônica da lâmina própria.'),
    achado('displasia-epitelial', 'nao-avaliavel', [], 'Há núcleos alongados e algo apinhados nas glândulas, mas com inflamação ao lado; sem imuno e níveis adicionais, não se afirma nem se exclui displasia.'),
], conferencias=3, sem_marcacoes=True, resumo='Biópsias de esôfago de homem de 60 anos com esofagite: mucosa colunar com metaplasia intestinal (células caliciformes) — esôfago de Barrett — ao lado de epitélio escamoso.')
print('ok')
