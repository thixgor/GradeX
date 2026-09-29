import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pancreatite-cronica-1', [
    pat('fibrose', 'fibrose-intersticial', seta(0.50, 0.55, 45),
        rotulo='Fibrose densa substituindo o parênquima',
        vista=(0.48, 0.54, 0.52, 0.58)),
    pat('fibrose-panoramica', 'fibrose-intersticial', seta(0.58, 0.68, 45),
        rotulo='Pâncreas transformado em fibrose com ilhas residuais',
        vista=(0.40, 0.52, 0.62, 0.74)),
    pat('lobulo-residual', 'atrofia-acinar-com-ilhotas-preservadas', seta(0.5305, 0.5685, 45),
        rotulo='Lóbulo residual isolado na fibrose',
        vista=(0.525, 0.555, 0.550, 0.580)),
    pat('ilhota', 'atrofia-acinar-com-ilhotas-preservadas', seta(0.5372, 0.5735, 45),
        rotulo='Ilhota de Langerhans preservada entre ácinos atróficos',
        vista=(0.525, 0.555, 0.550, 0.580)),
    pat('ducto', 'dilatacao-cistica-glandular', elipse(0.5075, 0.6080, 0.0075, 0.0120),
        rotulo='Ducto dilatado de epitélio benigno',
        vista=(0.490, 0.590, 0.520, 0.625)),
    est('acinos', 'acino-pancreatico', seta(0.5417, 0.5684, 45), rotulo='Ácinos com grânulos de zimogênio',
        vista=(0.535, 0.555, 0.550, 0.570)),
], achados=[
    achado('fibrose-intersticial', 'presente', ['fibrose', 'fibrose-panoramica'], 'Fibrose extensa e pobre em células ocupando a maior parte do órgão.'),
    achado('atrofia-acinar-com-ilhotas-preservadas', 'presente', ['lobulo-residual', 'ilhota'], 'Lóbulos residuais com ácinos escassos e ilhotas, isolados em fibrose.'),
    achado('dilatacao-cistica-glandular', 'presente', ['ducto'], 'Ductos dilatados com epitélio colunar/cúbico sem atipia.'),
    achado('infiltrado-linfoplasmocitario', 'nao-avaliavel', [], 'A inflamação é escassa nos campos examinados; na fase avançada, a fibrose predomina sobre a inflamação.'),
], conferencias=3, resumo='Pâncreas de pancreatectomia com pancreatite crônica não complicada: fibrose extensa substituindo o parênquima, lóbulos residuais com ácinos atróficos e ilhotas preservadas, e ductos dilatados de epitélio benigno. Sem neoplasia.')
print('ok')
