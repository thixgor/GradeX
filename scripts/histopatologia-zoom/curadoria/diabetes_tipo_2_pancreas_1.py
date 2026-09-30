import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('diabetes-tipo-2-pancreas-1', [
    pat('ilhota-medio', 'amiloide-insular', seta(0.6170, 0.2190, 45),
        rotulo='Ilhota pálida entre os ácinos',
        vista=(0.600, 0.200, 0.660, 0.260)),
    pat('amiloide', 'amiloide-insular', seta(0.6167, 0.2200, 45),
        rotulo='Amiloide acelular substituindo células da ilhota',
        vista=(0.613, 0.215, 0.621, 0.223)),
    pat('amiloide-2', 'amiloide-insular', seta(0.3283, 0.2880, 45),
        rotulo='Outra ilhota com depósito de amiloide',
        vista=(0.324, 0.284, 0.332, 0.292)),
    est('acinos', 'acino-pancreatico', seta(0.3255, 0.2855, 45), rotulo='Ácinos pancreáticos normais',
        vista=(0.324, 0.284, 0.332, 0.292)),
], achados=[
    achado('amiloide-insular', 'presente', ['ilhota-medio', 'amiloide', 'amiloide-2'], 'Ilhotas com material eosinofílico acelular e homogêneo entre poucas células endócrinas; o vermelho Congo do caso mostrou birrefringência verde-maçã.'),
    achado('espessamento-arterial', 'nao-avaliavel', [], 'Há artérias de parede espessa nos septos, mas sem comparação segura com artérias normais do mesmo calibre; não se afirma hialinose.'),
], conferencias=3, resumo='Pâncreas de necropsia de paciente com diabetes tipo 2 de longa data: ácinos preservados e ilhotas com amiloidose (amilina), confirmada por vermelho Congo.')
print('ok')
