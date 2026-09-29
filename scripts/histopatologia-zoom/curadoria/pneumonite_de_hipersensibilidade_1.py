import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pneumonite-de-hipersensibilidade-1', [
    pat('septos', 'pneumonite-intersticial-cronica', seta(0.4905, 0.1175, 45),
        rotulo='Septos alargados por linfócitos e plasmócitos',
        nota='Os alvéolos continuam abertos; o que mudou é a parede, grossa e cheia de células inflamatórias crônicas.',
        vista=(0.480, 0.110, 0.495, 0.125)),
    pat('peribronquiolar', 'pneumonite-intersticial-cronica', seta(0.2815, 0.2065, 45),
        rotulo='Agregado linfoide peribronquiolar',
        nota='Agregado de linfócitos junto a uma via aérea pequena e a um ramo arterial: a doença se concentra em volta dos bronquíolos, por onde o antígeno inalado chega.',
        vista=(0.270, 0.195, 0.290, 0.215)),
    pat('area-densa', 'pneumonite-intersticial-cronica', seta(0.52, 0.10, 45),
        rotulo='Área de interstício densamente infiltrado',
        vista=(0.46, 0.06, 0.56, 0.16)),
    pat('fibrose', 'fibrose-intersticial', seta(0.5250, 0.1025, 45),
        rotulo='Fibrose intersticial com inflamação',
        vista=(0.515, 0.100, 0.530, 0.115)),
    pat('antracose', 'antracose', seta(0.2815, 0.2100, 45), rotulo='Pigmento antracótico (incidental)', vista=(0.270, 0.195, 0.290, 0.215)),
], achados=[
    achado('pneumonite-intersticial-cronica', 'presente', ['septos', 'peribronquiolar', 'area-densa'],
           'Inflamação intersticial crônica difusa, mais intensa em volta dos bronquíolos, com arquitetura pulmonar preservada.'),
    achado('granuloma-epitelioide', 'nao-avaliavel', [],
           'Não se identificaram granulomas inequívocos nos campos examinados; na pneumonite de hipersensibilidade eles são pequenos e esparsos e podem faltar em parte dos fragmentos.'),
    achado('antracose', 'presente', ['antracose'], 'Pigmento antracótico peribronquiolar, incidental.'),
    achado('fibrose-intersticial', 'presente', ['fibrose'], 'Fibrose leve a moderada nas áreas mais infiltradas (componente crônico).'),
], conferencias=3, resumo='Biópsia pulmonar com pneumonite de hipersensibilidade crônica: arquitetura preservada, septos alveolares difusamente alargados por linfócitos e plasmócitos, com acentuação ao redor dos bronquíolos e fibrose leve nas áreas mais densas.')
print('ok')
