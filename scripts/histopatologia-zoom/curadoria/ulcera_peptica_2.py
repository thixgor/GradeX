import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 552, caso 12 — catalogado como "Gastritis"; a lâmina é um leito de úlcera gástrica crônica.
salvar('ulcera-peptica-2', [
    pat('exsudato', 'exsudato-fibrinopurulento', seta(0.2950, 0.0150, 225),
        rotulo='Fundo da úlcera: fibrina e neutrófilos na superfície da cratera',
        nota='A primeira camada da úlcera ativa é um exsudato de fibrina, neutrófilos e restos necróticos, voltado para a luz. É o que o endoscopista vê como base branco-amarelada da úlcera.',
        vista=(0.280, 0.000, 0.340, 0.050)),
    pat('ulcera', 'ulceracao-da-mucosa', seta(0.3200, 0.0250, 135),
        rotulo='Defeito que atravessou mucosa e submucosa',
        nota='Neste setor não há mucosa nem muscular da mucosa: o ácido e a pepsina, sobre uma mucosa cuja defesa falhou (H. pylori, anti-inflamatórios), cavaram até a parede profunda. Erosão para na mucosa; úlcera passa da muscular da mucosa.',
        vista=(0.200, 0.000, 0.420, 0.100)),
    pat('granulacao', 'tecido-de-granulacao', seta(0.3100, 0.0420, 315),
        rotulo='Tecido de granulação logo abaixo do exsudato',
        nota='Capilares novos, fibroblastos e células inflamatórias formam a segunda camada — o reparo tentando fechar o defeito.',
        vista=(0.290, 0.030, 0.330, 0.055)),
    pat('cicatriz', 'fibrose-cicatricial', seta(0.3000, 0.1500, 90),
        rotulo='Cicatriz fibrosa interrompendo a muscular própria',
        nota='Na base, colágeno substituiu os feixes da muscular própria, que terminam abruptamente nas bordas da cicatriz. É a marca da úlcera crônica, de semanas a meses: cada ciclo de lesão e reparo deixa mais fibrose — e a retração dela pode estenosar o piloro.',
        vista=(0.250, 0.100, 0.350, 0.200)),
    est('mucosa', 'mucosa-gastrica', seta(0.9000, 0.0500, 225),
        rotulo='Mucosa gástrica preservada na borda da úlcera',
        vista=(0.800, 0.000, 0.980, 0.150)),
    est('muscular', 'muscular-externa', seta(0.2700, 0.1900, 45),
        rotulo='Feixes da muscular própria',
        vista=(0.250, 0.150, 0.350, 0.200)),
], achados=[
    achado('ulceracao-da-mucosa', 'presente', ['ulcera'],
           'Defeito profundo, sem mucosa nem muscular da mucosa, chegando à parede.'),
    achado('fibrose-cicatricial', 'presente', ['cicatriz'],
           'Cicatriz fibrosa na base interrompendo a muscular própria — úlcera crônica.'),
    achado('tecido-de-granulacao', 'presente', ['granulacao'],
           'Camada de granulação sob o exsudato.'),
    achado('exsudato-fibrinopurulento', 'presente', ['exsudato'],
           'Fibrina, neutrófilos e restos necróticos na superfície da cratera.'),
], conferencias=3, resumo='Úlcera gástrica crônica: cratera sem mucosa, com as camadas clássicas — exsudato fibrinopurulento na superfície, tecido de granulação abaixo e cicatriz fibrosa que interrompe a muscular própria — e mucosa gástrica preservada na borda. Catalogada na fonte como gastrite.')
print('ok')
