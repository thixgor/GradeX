import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('glomerulonefrite-pos-infecciosa-1', [
    pat('glomerulo', 'proliferacao-endocapilar', seta(0.3950, 0.5250, 45),
        rotulo='Glomérulo aumentado e hipercelular',
        vista=(0.360, 0.490, 0.430, 0.560)),
    pat('alcas-ocluidas', 'proliferacao-endocapilar', seta(0.3965, 0.5145, 45),
        rotulo='Alças ocluídas por células',
        vista=(0.380, 0.500, 0.410, 0.530)),
    pat('glomerulo-2', 'proliferacao-endocapilar', seta(0.6800, 0.3150, 45),
        rotulo='Todos os glomérulos igualmente acometidos',
        vista=(0.645, 0.280, 0.715, 0.350)),
    est('tubulos', 'tubulo-contorcido-proximal', seta(0.6560, 0.3050, 45), rotulo='Túbulos proximais',
        vista=(0.645, 0.280, 0.715, 0.350)),
], achados=[
    achado('proliferacao-endocapilar', 'presente', ['glomerulo', 'alcas-ocluidas', 'glomerulo-2'], 'Glomérulos difusamente aumentados, com proliferação endocapilar que oclui as alças e enche o espaço de Bowman.'),
    achado('infiltrado-neutrofilico', 'nao-avaliavel', [], 'Há núcleos escuros compatíveis com leucócitos dentro dos tufos, mas nesta digitalização não se distinguem com segurança neutrófilos de células endoteliais.'),
    achado('crescente-glomerular', 'ausente', [], 'Não há crescentes nos glomérulos examinados.'),
], conferencias=3, resumo='Biópsia renal de homem de 54 anos com edema importante dias após tosse e expectoração: glomerulonefrite proliferativa endocapilar difusa (pós-infecciosa), com glomérulos hipercelulares e alças ocluídas.')
print('ok')
