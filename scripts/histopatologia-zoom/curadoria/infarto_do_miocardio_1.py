import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('infarto-do-miocardio-1', [
    pat('necrose', 'necrose-coagulativa', seta(0.3505, 0.5845, 45),
        rotulo='Fibras necróticas: hipereosinofílicas, sem núcleos',
        nota='As fibras mantêm o contorno, mas perderam os núcleos e ficaram mais vermelhas e homogêneas; ao redor, restos nucleares.',
        vista=(0.345, 0.579, 0.357, 0.591)),
    pat('neutrofilos', 'infiltrado-neutrofilico', seta(0.2975, 0.5695, 45),
        rotulo='Neutrófilos entre as fibras (1–3 dias)',
        nota='Neutrófilos e restos nucleares ocupam o interstício entre fibras necróticas: é a borda do infarto recente.',
        vista=(0.290, 0.560, 0.305, 0.575)),
    pat('faixa', 'infiltrado-neutrofilico', seta(0.335, 0.552, 90),
        rotulo='Faixa de infiltrado na borda do infarto',
        vista=(0.26, 0.52, 0.42, 0.68)),
    pat('hemorragia', 'hemorragia-intersticial', seta(0.3095, 0.608, 45),
        rotulo='Hemorragia intersticial',
        vista=(0.300, 0.595, 0.325, 0.620)),
    est('miocito', 'fibra-muscular-cardiaca', seta(0.3404, 0.5321, 45), rotulo='Cardiomiócito com núcleo central',
        vista=(0.335, 0.525, 0.345, 0.535)),
], achados=[
    achado('necrose-coagulativa', 'presente', ['necrose'], 'Fibras sem núcleos e hipereosinofílicas na área do infarto.'),
    achado('infiltrado-neutrofilico', 'presente', ['neutrofilos', 'faixa'],
           'Neutrófilos entre as fibras, formando faixas na borda — padrão de infarto com cerca de 1 a 3 dias.'),
    achado('hemorragia-intersticial', 'presente', ['hemorragia'], 'Focos de hemorragia dissecando o interstício.'),
    achado('tecido-de-granulacao', 'ausente', [], 'Ainda não há tecido de granulação: a lesão é recente (dias).'),
    achado('fibrose-cicatricial', 'ausente', [], 'Sem cicatriz colágena: não é um infarto antigo.'),
], conferencias=3, resumo='Miocárdio com infarto agudo recente (cerca de 1 a 3 dias): necrose coagulativa das fibras, faixas de neutrófilos na borda e focos de hemorragia intersticial, ao lado de miocárdio viável.')

salvar('infarto-do-miocardio-2', [
    pat('cicatriz', 'fibrose-cicatricial', seta(0.3375, 0.3375, 45),
        rotulo='Cicatriz: colágeno denso no lugar do miocárdio',
        nota='Colágeno em feixes ondulados, rosa-pálido, com poucos fibroblastos de núcleo fino — sem nenhuma fibra muscular.',
        vista=(0.330, 0.330, 0.345, 0.345)),
    pat('cicatriz-panoramica', 'fibrose-cicatricial', seta(0.36, 0.35, 45),
        rotulo='Área extensa de cicatriz',
        vista=(0.26, 0.26, 0.44, 0.44)),
    pat('fibrose-borda', 'fibrose-cicatricial', seta(0.2885, 0.3539, 225),
        rotulo='Fibrose separando grupos de miócitos sobreviventes',
        nota='Na borda da cicatriz, septos de colágeno isolam ilhas de cardiomiócitos que sobreviveram à isquemia.',
        vista=(0.278, 0.349, 0.296, 0.367)),
    est('miocardio-viavel', 'fibra-muscular-cardiaca', seta(0.2800, 0.3650, 45), rotulo='Miocárdio viável na borda da cicatriz',
        vista=(0.275, 0.350, 0.300, 0.375)),
    est('arteriola', 'arteria-muscular', seta(0.2925, 0.3565, 180), rotulo='Arteríola intramiocárdica',
        vista=(0.283, 0.350, 0.300, 0.367)),
], achados=[
    achado('necrose-coagulativa', 'ausente', [], 'Não há fibras necróticas recentes: o músculo morto já foi removido e substituído.'),
    achado('infiltrado-neutrofilico', 'ausente', [], 'Sem neutrófilos — a fase aguda terminou há semanas ou meses.'),
    achado('hemorragia-intersticial', 'ausente', [], 'Sem hemorragia recente.'),
    achado('tecido-de-granulacao', 'ausente', [], 'O tecido de granulação já amadureceu em colágeno.'),
    achado('fibrose-cicatricial', 'presente', ['cicatriz', 'cicatriz-panoramica', 'fibrose-borda'],
           'Áreas extensas de colágeno denso e pobre em células, com ilhas de miocárdio viável na periferia: infarto cicatrizado (mais de 2 meses).'),
], conferencias=3, resumo='Miocárdio com infarto antigo cicatrizado: zonas extensas de colágeno denso e pobre em células substituindo o músculo, com miocárdio viável na borda.')
print('ok')
