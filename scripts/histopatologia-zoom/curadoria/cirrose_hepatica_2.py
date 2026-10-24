import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 104, caso 14 — "Pigmentary cirrhosis of hemochromatosis".
salvar('cirrose-hepatica-2', [
    pat('nodulo', 'nodulos-regenerativos', seta(0.4300, 0.3300, 225),
        rotulo='Nódulo de regeneração: hepatócitos sem veia central',
        nota='Uma ilha redonda de hepatócitos, toda cercada por septo fibroso, sem a veia centrolobular nem os espaços-porta que organizam o lóbulo normal. Os hepatócitos estão carregados de grânulos castanho-dourados: é a hemossiderina da hemocromatose, o ferro que lesa a célula e alimenta a fibrose.',
        vista=(0.380, 0.250, 0.500, 0.380)),
    pat('nodulo-2', 'nodulos-regenerativos', seta(0.8400, 0.3700, 135),
        rotulo='Outro nódulo, de tamanho parecido (micronodular)',
        vista=(0.780, 0.320, 0.900, 0.430)),
    pat('septo', 'fibrose-intersticial', seta(0.5038, 0.3192, 0),
        rotulo='Septo fibroso que envolve e separa os nódulos',
        nota='Faixas de colágeno com fibroblastos, vasos e células inflamatórias ligam os espaços-porta entre si e às veias centrais, cortando o órgão em nódulos. O tamanho regular dos nódulos (quase todos menores que 3 mm) é o padrão micronodular, típico de agressão difusa e contínua — álcool, ferro.',
        vista=(0.460, 0.270, 0.550, 0.360)),
    pat('ductulos', 'reacao-ductular', seta(0.4995, 0.2925, 225),
        rotulo='Dúctulo no septo, com pigmento no epitélio',
        nota='Pequenos dúctulos biliares brotam na margem dos septos. Aqui o próprio epitélio ductular contém grânulos de pigmento — o ferro da hemocromatose se deposita também nas células biliares, o que não acontece na siderose secundária.',
        vista=(0.485, 0.275, 0.515, 0.300)),
    pat('inflamacao-septo', 'infiltrado-linfoplasmocitario', seta(0.5050, 0.2810, 315),
        rotulo='Linfócitos e macrófagos carregados de pigmento no septo',
        vista=(0.490, 0.270, 0.520, 0.295)),
    est('hepatocitos', 'hepatocito', seta(0.4500, 0.3000, 180),
        rotulo='Hepatócitos em placas, com grânulos de hemossiderina',
        vista=(0.420, 0.270, 0.480, 0.330)),
], achados=[
    achado('nodulos-regenerativos', 'presente', ['nodulo', 'nodulo-2'],
           'O corte inteiro é feito de nódulos de hepatócitos sem veia central, de tamanho regular (micronodular).'),
    achado('fibrose-intersticial', 'presente', ['septo'],
           'Septos fibrosos contínuos envolvem todos os nódulos.'),
    achado('reacao-ductular', 'presente', ['ductulos'],
           'Dúctulos na periferia dos septos, alguns com pigmento no epitélio.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['inflamacao-septo'],
           'Infiltrado discreto de linfócitos nos septos, com macrófagos cheios de pigmento — cirrose pouco ativa.'),
    achado('esteatose-macrovesicular', 'ausente', [],
           'Os hepatócitos dos nódulos têm citoplasma granular e pigmentado, sem vacúolos de gordura.'),
], conferencias=3, resumo='Fígado com cirrose micronodular pigmentar da hemocromatose: nódulos regulares de hepatócitos sem veia central, cercados por septos fibrosos, com grânulos castanho-dourados de hemossiderina nos hepatócitos, no epitélio dos dúctulos e nos macrófagos dos septos. Paciente de 59 anos com pele bronzeada e hiperglicemia — o "diabetes bronzeado".')
print('ok')
