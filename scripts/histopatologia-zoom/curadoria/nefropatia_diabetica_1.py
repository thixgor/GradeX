import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('nefropatia-diabetica-1', [
    pat('glomerulo-nodular', 'glomeruloesclerose-nodular', seta(0.5345, 0.0905, 45),
        rotulo='Glomérulo com expansão mesangial nodular',
        vista=(0.527, 0.084, 0.539, 0.096)),
    pat('nodulo', 'glomeruloesclerose-nodular', seta(0.5364, 0.0907, 45),
        rotulo='Nódulo de Kimmelstiel-Wilson: matriz acelular com núcleos na borda',
        vista=(0.533, 0.0875, 0.539, 0.0935)),
    pat('fibrose', 'fibrose-intersticial', seta(0.5335, 0.0810, 45),
        rotulo='Fibrose intersticial com túbulos atróficos',
        vista=(0.531, 0.072, 0.545, 0.086)),
    est('tubulo', 'tubulo-contorcido-proximal', seta(0.5372, 0.0765, 45), rotulo='Túbulo proximal preservado',
        vista=(0.531, 0.072, 0.545, 0.086)),
], achados=[
    achado('glomeruloesclerose-nodular', 'presente', ['glomerulo-nodular', 'nodulo'], 'Glomérulos com expansão mesangial difusa e nódulos acelulares de matriz, com capilares empurrados para a periferia (classe III).'),
    achado('esclerose-glomerular-global', 'nao-avaliavel', [], 'Há uma estrutura com cápsula espessa e material hialino no centro, mas não é possível distinguir com segurança um glomérulo obsoleto de um túbulo dilatado com cilindro nesta biópsia.'),
    achado('fibrose-intersticial', 'presente', ['fibrose'], 'Fibrose intersticial com túbulos atróficos de membrana basal espessa, em faixas.'),
    achado('espessamento-arterial', 'nao-avaliavel', [], 'A hialinose arteriolar é típica, mas nas arteríolas desta biópsia não se distingue com segurança no H&E; seria confirmada com PAS.'),
], conferencias=3, resumo='Biópsia renal de homem de 75 anos, hipertenso, com hematoproteinúria: nefropatia diabética com glomeruloesclerose nodular (Kimmelstiel-Wilson) e fibrose intersticial com atrofia tubular.')
print('ok')
