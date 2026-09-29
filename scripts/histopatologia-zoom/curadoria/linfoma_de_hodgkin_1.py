import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('linfoma-de-hodgkin-1', [
    pat('lacunar', 'celula-de-reed-sternberg', seta(0.1823, 0.2592, 45),
        rotulo='Célula lacunar: núcleo lobulado com nucléolos, em halo claro',
        nota='Variante da célula de Reed-Sternberg típica da esclerose nodular: o citoplasma retraído deixa um espaço claro ("lacuna") em volta do núcleo lobulado.',
        vista=(0.1805, 0.2575, 0.1845, 0.2615)),
    pat('lacunar-2', 'celula-de-reed-sternberg', seta(0.1877, 0.2528, 45),
        rotulo='Outra célula lacunar',
        vista=(0.1872, 0.2512, 0.1912, 0.2552)),
    pat('faixa', 'faixas-de-esclerose-colagena', seta(0.1735, 0.2400, 0),
        rotulo='Faixa de colágeno separando nódulos',
        vista=(0.13, 0.20, 0.23, 0.30)),
    pat('fundo', 'infiltrado-linfoplasmocitario', seta(0.1868, 0.2610, 45),
        rotulo='Fundo reativo de linfócitos pequenos',
        vista=(0.184, 0.255, 0.192, 0.263)),
    est('capsula', 'capsula-do-linfonodo', seta(0.2105, 0.2150, 45), rotulo='Cápsula do linfonodo, espessada',
        vista=(0.19, 0.19, 0.23, 0.24)),
], achados=[
    achado('celula-de-reed-sternberg', 'presente', ['lacunar', 'lacunar-2'],
           'Células lacunares frequentes nos nódulos. O caso de origem traz imuno-histoquímica (CD30 e CD15) que confirma o diagnóstico.'),
    achado('faixas-de-esclerose-colagena', 'presente', ['faixa'], 'Faixas de colágeno dividem o linfonodo em nódulos, com cápsula espessada.'),
    achado('eosinofilos-teciduais', 'nao-avaliavel', [], 'Eosinófilos não são evidentes nos campos examinados; a coloração pálida dificulta reconhecer os grânulos.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['fundo'], 'Linfócitos pequenos formam a maioria das células.'),
    achado('necrose-coagulativa', 'ausente', [], 'Sem focos de necrose nos nódulos examinados.'),
], conferencias=3, resumo='Linfonodo mediastinal/cervical com linfoma de Hodgkin clássico, subtipo esclerose nodular: faixas de colágeno dividem o órgão em nódulos que contêm células lacunares e células de Hodgkin num fundo de linfócitos pequenos. Duas secções do mesmo linfonodo na lâmina.')
print('ok')
