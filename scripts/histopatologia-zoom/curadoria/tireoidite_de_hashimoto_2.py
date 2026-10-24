import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1477, caso 7 — "Struma lymphomatosa (lymphocytic thyroiditis)".
salvar('tireoidite-de-hashimoto-2', [
    pat('foliculo-linfoide', 'hiperplasia-linfoide-reativa', seta(0.4660, 0.3300, 225),
        rotulo='Folículo linfoide com centro germinativo dentro da tireoide',
        nota='Um centro germinativo claro (centroblastos e macrófagos de corpos tingíveis) cercado por uma coroa de linfócitos pequenos — tecido de linfonodo crescendo no meio da glândula. É a assinatura da autoimunidade: linfócitos B que reconhecem tireoperoxidase e tireoglobulina proliferam ali mesmo.',
        vista=(0.452, 0.318, 0.484, 0.344)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.4550, 0.3010, 135),
        rotulo='Linfócitos e plasmócitos entre os folículos',
        nota='Os espaços entre os folículos estão tomados por linfócitos e plasmócitos. São eles — e os anticorpos que produzem — que destroem as células foliculares; com o tempo sobra pouco tecido funcionante, e o hipotireoidismo se instala.',
        vista=(0.440, 0.285, 0.470, 0.310)),
    pat('hurthle', 'metaplasia-oncocitica', seta(0.4605, 0.2895, 225),
        rotulo='Células de Hürthle: citoplasma rosa granular, núcleo grande',
        nota='As células foliculares que sobram ficam grandes, com citoplasma eosinofílico e granular (abarrotado de mitocôndrias) e núcleo com nucléolo evidente. É a metaplasia oncocítica, resposta da célula à agressão crônica.',
        vista=(0.452, 0.285, 0.470, 0.298)),
    pat('atrofia', 'atrofia-folicular', seta(0.4520, 0.2990, 315),
        rotulo='Folículos pequenos, quase sem coloide',
        vista=(0.445, 0.290, 0.465, 0.305)),
    pat('fibrose', 'fibrose-cicatricial', seta(0.4800, 0.3000, 180),
        rotulo='Septos de colágeno dividem a glândula em nódulos',
        nota='Faixas largas de colágeno hialino separam lóbulos de tecido linfoide e folicular. A fibrose extensa marca a doença avançada (variante fibrosa) e explica a tireoide firme e lobulada à palpação.',
        vista=(0.460, 0.260, 0.510, 0.340)),
    est('foliculo', 'foliculo-tireoidiano', seta(0.4560, 0.2920, 45),
        rotulo='Folículo tireoidiano residual',
        vista=(0.450, 0.286, 0.462, 0.298)),
], achados=[
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado'],
           'Infiltrado denso de linfócitos e plasmócitos em todo o parênquima.'),
    achado('hiperplasia-linfoide-reativa', 'presente', ['foliculo-linfoide'],
           'Folículos linfoides com centro germinativo espalhados pela glândula.'),
    achado('metaplasia-oncocitica', 'presente', ['hurthle'],
           'Folículos revestidos por células de Hürthle, de citoplasma granular eosinofílico.'),
    achado('atrofia-folicular', 'presente', ['atrofia'],
           'Folículos pequenos, com coloide escasso ou ausente.'),
    achado('fibrose-cicatricial', 'presente', ['fibrose'],
           'Septos fibrosos largos lobulam a glândula — doença avançada.'),
], conferencias=3, resumo='Tireoidite de Hashimoto (struma lymphomatosa): parênquima tomado por linfócitos e plasmócitos, folículos linfoides com centros germinativos, folículos residuais pequenos revestidos por células de Hürthle e septos fibrosos largos que dividem a glândula em nódulos.')
print('ok')
