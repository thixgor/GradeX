import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 551, caso 7 — "Nodular hyperplasia" (próstata, ressecção transuretral).
salvar('hiperplasia-prostatica-benigna-2', [
    pat('nodulo', 'hiperplasia-glandular', seta(0.1000, 0.2300, 45),
        rotulo='Nódulo glandular bem delimitado, empurrando o estroma',
        nota='Um nódulo redondo, nítido, feito de dezenas de glândulas apertadas em estroma escasso, cercado por estroma fibromuscular comprimido. É o que define a hiperplasia: o crescimento é nodular e expansivo, não infiltrativo. A di-hidrotestosterona (testosterona convertida pela 5-α-redutase do estroma) estimula estroma e glândulas da zona de transição — por isso a finasterida reduz a próstata.',
        vista=(0.040, 0.120, 0.180, 0.300)),
    pat('dupla-camada', 'glandulas-com-dupla-camada', seta(0.1048, 0.2048, 225),
        rotulo='Células luminais colunares e camada basal achatada na periferia',
        nota='Cada glândula tem duas populações: células luminais colunares, de citoplasma claro e núcleo basal, voltadas para a luz, e por fora delas uma fileira de células basais de núcleo achatado, encostadas no estroma. A camada basal preservada é o que separa a glândula benigna da glândula de adenocarcinoma, que tem uma camada só.',
        vista=(0.100, 0.200, 0.112, 0.210)),
    pat('cistica', 'dilatacao-cistica-glandular', seta(0.1800, 0.4400, 135),
        rotulo='Glândulas dilatadas, com secreção rosa',
        vista=(0.150, 0.420, 0.200, 0.480)),
    est('estroma', 'estroma-fibromuscular', seta(0.1700, 0.2700, 0),
        rotulo='Estroma fibromuscular em volta do nódulo',
        vista=(0.150, 0.240, 0.200, 0.320)),
], achados=[
    achado('hiperplasia-glandular', 'presente', ['nodulo'],
           'Nódulos glandulares redondos e bem delimitados nos fragmentos de ressecção.'),
    achado('glandulas-com-dupla-camada', 'presente', ['dupla-camada'],
           'As glândulas conservam células luminais colunares e a camada basal achatada, sem nucléolos proeminentes.'),
    achado('dilatacao-cistica-glandular', 'presente', ['cistica'],
           'Glândulas dilatadas com secreção eosinofílica em vários fragmentos.'),
    achado('infiltrado-linfoplasmocitario', 'nao-avaliavel', [],
           'Nos fragmentos conferidos não se forma um infiltrado inflamatório nítido em volta das glândulas; não foram examinados todos os fragmentos em grande aumento.'),
], conferencias=3, resumo='Hiperplasia prostática benigna em fragmentos de ressecção transuretral: nódulos glandulares redondos e bem delimitados, de glândulas apertadas com células luminais colunares e camada basal preservada, em estroma fibromuscular, com glândulas dilatadas e secreção eosinofílica.')
print('ok')
