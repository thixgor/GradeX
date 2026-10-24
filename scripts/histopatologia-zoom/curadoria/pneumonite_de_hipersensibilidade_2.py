import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1485, caso 12 — "Granulomatous interstitial pneumonitis (hypersensitivity pneumonitis, extrinsic allergic alveolitis)".
salvar('pneumonite-de-hipersensibilidade-2', [
    pat('septos', 'pneumonite-intersticial-cronica', seta(0.4700, 0.2450, 225),
        rotulo='Septos alveolares alargados por linfócitos e plasmócitos',
        nota='As paredes dos alvéolos, que no pulmão normal são uma linha fina de capilar e pneumócito, estão espessadas por um infiltrado de linfócitos e plasmócitos. A inflamação é mais densa perto dos bronquíolos — o antígeno inalado (fungos do mofo, proteínas de aves) chega pelas vias aéreas pequenas e é ali que a resposta imune se concentra.',
        vista=(0.420, 0.200, 0.520, 0.300)),
    pat('granuloma', 'granuloma-epitelioide', seta(0.4650, 0.2400, 315),
        rotulo='Agregado frouxo de histiócitos epitelioides no interstício',
        nota='Um grupo de macrófagos de citoplasma rosa-pálido e núcleo oval, mal delimitado e misturado aos linfócitos — o granuloma "mal formado" da pneumonite de hipersensibilidade, bem diferente do granuloma compacto e bem delimitado da sarcoidose.',
        vista=(0.455, 0.225, 0.475, 0.245)),
    pat('peribronquiolar', 'pneumonite-intersticial-cronica', seta(0.7150, 0.1450, 45),
        rotulo='Infiltrado linfocitário em torno de bronquíolo e arteríola',
        vista=(0.700, 0.120, 0.730, 0.150)),
    pat('consolidado', 'pneumonite-intersticial-cronica', seta(0.8200, 0.1300, 225),
        rotulo='Área em que o infiltrado apaga os espaços aéreos',
        vista=(0.780, 0.090, 0.860, 0.200)),
    est('alveolos', 'alveolo-pulmonar', seta(0.7400, 0.1000, 45),
        rotulo='Alvéolos menos acometidos, com septos mais finos',
        vista=(0.700, 0.060, 0.780, 0.130)),
    est('arteriola', 'arteria-muscular', seta(0.7130, 0.1370, 0),
        rotulo='Arteríola pulmonar ao lado do bronquíolo',
        vista=(0.705, 0.128, 0.725, 0.145)),
], achados=[
    achado('pneumonite-intersticial-cronica', 'presente', ['septos', 'peribronquiolar', 'consolidado'],
           'Septos alargados por linfócitos e plasmócitos, mais intenso ao redor de bronquíolos.'),
    achado('granuloma-epitelioide', 'presente', ['granuloma'],
           'Agregados frouxos de histiócitos epitelioides no interstício, sem necrose.'),
    achado('fibrose-intersticial', 'ausente', [],
           'Os septos estão espessados por células, não por colágeno; não há faveolamento nem fibrose estabelecida nos campos conferidos — forma não fibrótica.'),
], conferencias=3, resumo='Pneumonite de hipersensibilidade (alveolite alérgica extrínseca): septos alveolares alargados por linfócitos e plasmócitos, mais densos em torno dos bronquíolos, com agregados frouxos de histiócitos epitelioides (granulomas mal formados) no interstício, sem fibrose estabelecida.')
print('ok')
