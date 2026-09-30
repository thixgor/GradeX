import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('adenocarcinoma-de-prostata-1', [
    pat('area-tumoral', 'glandulas-pequenas-infiltrativas', seta(0.3000, 0.2250, 45),
        rotulo='Área de glândulas pequenas, apinhadas e escuras',
        vista=(0.240, 0.160, 0.340, 0.260)),
    pat('glandula-pequena', 'glandulas-pequenas-infiltrativas', seta(0.2908, 0.2026, 45),
        rotulo='Glândula pequena de camada única',
        vista=(0.288, 0.202, 0.294, 0.208)),
    pat('nucleolos', 'atipia-citologica', seta(0.2892, 0.2041, 45),
        rotulo='Núcleos grandes com nucléolo evidente',
        vista=(0.288, 0.202, 0.294, 0.208)),
    pat('entre-musculo', 'invasao-estromal', seta(0.2945, 0.2098, 45),
        rotulo='Glândulas infiltrando entre feixes musculares',
        vista=(0.280, 0.200, 0.300, 0.220)),
    pat('benigna', 'glandulas-com-dupla-camada', seta(0.7438, 0.1462, 45),
        rotulo='Glândula benigna com duas camadas de células',
        vista=(0.740, 0.145, 0.746, 0.151)),
    est('glandula-normal', 'glandula-prostatica', seta(0.7250, 0.1260, 45), rotulo='Glândulas benignas grandes e onduladas',
        vista=(0.700, 0.100, 0.800, 0.200)),
    est('estroma', 'estroma-fibromuscular', seta(0.2960, 0.2060, 45), rotulo='Estroma fibromuscular',
        vista=(0.288, 0.202, 0.294, 0.208)),
], achados=[
    achado('glandulas-pequenas-infiltrativas', 'presente', ['area-tumoral', 'glandula-pequena'], 'Numerosas glândulas pequenas, redondas e rígidas, de camada única, algumas fundidas (padrões 3 e 4 de Gleason), com secreção rosa na luz.'),
    achado('atipia-citologica', 'presente', ['nucleolos'], 'Núcleos aumentados, vesiculosos, com nucléolos evidentes.'),
    achado('invasao-estromal', 'presente', ['entre-musculo'], 'Glândulas neoplásicas dissecando os feixes de músculo liso.'),
    achado('glandulas-com-dupla-camada', 'presente', ['benigna'], 'Glândulas benignas grandes, com dobras e duas camadas, na mesma lâmina — para comparação.'),
], conferencias=3, resumo='Prostatectomia radical de homem de 71 anos (PSA 10,5; Gleason 3+4 na biópsia): adenocarcinoma acinar com glândulas pequenas de camada única e nucléolos, infiltrando o estroma, ao lado de glândulas benignas com células basais.')
print('ok')
