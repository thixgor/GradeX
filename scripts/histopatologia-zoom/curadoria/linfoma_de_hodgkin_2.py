import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1183, caso 5 — "Hodgkin disease, nodular sclerosis".
salvar('linfoma-de-hodgkin-2', [
    pat('lacunar', 'celula-de-reed-sternberg', seta(0.5925, 0.3127, 225),
        rotulo='Célula lacunar: célula grande dentro de um halo claro',
        nota='Uma célula muito maior que os linfócitos em volta, de núcleo grande, vesiculoso, com nucléolo nítido, parece "flutuar" num espaço vazio. O espaço é artefato de fixação em formol — o citoplasma se retrai — e é justamente essa retração que define a variante lacunar da célula de Reed-Sternberg, típica da esclerose nodular. A célula neoplásica é minoria: menos de 1 % das células do linfonodo.',
        vista=(0.583, 0.307, 0.597, 0.318)),
    pat('lacunar-2', 'celula-de-reed-sternberg', seta(0.5893, 0.3160, 315),
        rotulo='Outra célula lacunar',
        vista=(0.584, 0.311, 0.595, 0.320)),
    pat('fundo-reativo', 'infiltrado-linfoplasmocitario', seta(0.2100, 0.5400, 45),
        rotulo='Fundo de linfócitos pequenos e plasmócitos',
        nota='Quase todas as células do tumor são reativas: linfócitos pequenos, plasmócitos, histiócitos e eosinófilos atraídos pelas citocinas que a célula de Reed-Sternberg produz (IL-5, CCL17). É por isso que o "tumor" parece inflamação a pequeno aumento.',
        vista=(0.200, 0.520, 0.240, 0.550)),
    pat('faixas', 'faixas-de-esclerose-colagena', seta(0.3750, 0.4440, 135),
        rotulo='Colágeno que divide o linfonodo em nódulos',
        nota='Faixas largas de colágeno birrefringente atravessam o linfonodo e o recortam em nódulos — o padrão que dá nome ao subtipo. A fibrose é estimulada pelo TGF-β das células neoplásicas; a cápsula do linfonodo também está espessada.',
        vista=(0.340, 0.420, 0.420, 0.480)),
    est('capsula', 'capsula-do-linfonodo', seta(0.4500, 0.1550, 90),
        rotulo='Cápsula espessada e fibrosa',
        vista=(0.350, 0.120, 0.600, 0.220)),
], achados=[
    achado('celula-de-reed-sternberg', 'presente', ['lacunar', 'lacunar-2'],
           'Células lacunares espalhadas pelos nódulos, sempre raras em meio ao fundo reativo.'),
    achado('faixas-de-esclerose-colagena', 'presente', ['faixas'],
           'Faixas de colágeno recortam o linfonodo em nódulos e a cápsula está espessada.'),
    achado('eosinofilos-teciduais', 'nao-avaliavel', [],
           'Nos campos conferidos não se reconheceram eosinófilos com segurança na resolução do scan; a coloração dos grânulos é pouco nítida.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['fundo-reativo'],
           'Linfócitos pequenos e plasmócitos são a maioria das células do linfonodo.'),
    achado('necrose-coagulativa', 'ausente', [],
           'Não há focos de necrose nos nódulos examinados.'),
], conferencias=3, resumo='Linfonodo com linfoma de Hodgkin clássico, subtipo esclerose nodular: faixas de colágeno recortam o órgão em nódulos e espessam a cápsula; nos nódulos, raras células lacunares (variante da célula de Reed-Sternberg) em halo claro, em meio a um fundo de linfócitos pequenos, plasmócitos e histiócitos.')
print('ok')
