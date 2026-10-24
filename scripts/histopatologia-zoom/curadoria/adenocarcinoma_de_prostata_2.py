import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1344, caso 1 — "Prostatic adenocarcinoma (Gleason grade 3+3)".
salvar('adenocarcinoma-de-prostata-2', [
    pat('glandulas', 'glandulas-pequenas-infiltrativas', seta(0.1300, 0.1800, 225),
        rotulo='Glândulas pequenas, redondas e rígidas, de camada única',
        nota='Glândulas pequenas, de contorno liso e "duro", sem as dobras papilares das benignas, espalhadas entre os feixes de músculo liso. Cada uma é forrada por uma camada só de células: a camada basal sumiu. Glândulas bem formadas e separadas umas das outras são o padrão Gleason 3.',
        vista=(0.100, 0.160, 0.170, 0.200)),
    pat('atipia', 'atipia-citologica', seta(0.1175, 0.1705, 225),
        rotulo='Núcleos aumentados, com nucléolo, e mucina azulada na luz',
        nota='Os núcleos das células tumorais são maiores e mais redondos que os das glândulas benignas, com nucléolo visível; na luz há mucina azul-acinzentada e cristaloides rosados — três pistas de malignidade que ajudam muito em biópsias pequenas.',
        vista=(0.112, 0.168, 0.124, 0.178)),
    pat('invasao', 'invasao-estromal', seta(0.1450, 0.1920, 135),
        rotulo='Glândulas dissecando os feixes do estroma',
        vista=(0.120, 0.180, 0.170, 0.200)),
    pat('benignas', 'glandulas-com-dupla-camada', seta(0.1000, 0.1200, 45),
        rotulo='Glândula benigna vizinha: grande, com dobras e duas camadas',
        nota='Logo acima, glândulas benignas maiores, de contorno ondulado e com a camada basal preservada, algumas com corpos amiláceos (concreções lamelares). Estudar as duas lado a lado é a melhor forma de aprender a diferença.',
        vista=(0.080, 0.100, 0.140, 0.140)),
    est('corpo-amilaceo', 'concrecao-prostatica', seta(0.1200, 0.1440, 315),
        rotulo='Corpo amiláceo numa glândula benigna',
        vista=(0.110, 0.135, 0.135, 0.150)),
    est('estroma', 'estroma-fibromuscular', seta(0.1400, 0.1300, 180),
        rotulo='Estroma fibromuscular',
        vista=(0.130, 0.120, 0.170, 0.150)),
], achados=[
    achado('glandulas-pequenas-infiltrativas', 'presente', ['glandulas'],
           'Glândulas pequenas e separadas, de camada única, infiltrando o estroma — padrão Gleason 3.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos aumentados com nucléolos, mucina azulada e cristaloides na luz.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'As glândulas tumorais se insinuam entre os feixes de músculo liso.'),
    achado('glandulas-com-dupla-camada', 'presente', ['benignas'],
           'Glândulas benignas com camada basal e corpos amiláceos ao lado do tumor.'),
], conferencias=3, resumo='Adenocarcinoma acinar de próstata, Gleason 3+3: glândulas pequenas, redondas e rígidas, de camada única, com núcleos aumentados e nucléolos, mucina azulada e cristaloides, infiltrando o estroma fibromuscular entre glândulas benignas maiores com camada basal e corpos amiláceos.')
print('ok')
