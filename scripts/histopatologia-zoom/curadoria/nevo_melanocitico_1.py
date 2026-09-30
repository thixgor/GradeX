import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('nevo-melanocitico-1', [], achados=[
    achado('ninhos-nevicos-com-maturacao', 'presente', [], 'Lesão papilomatosa, simétrica, com ninhos de células névicas na derme que ficam menores em profundidade; sem mitoses dérmicas.'),
    achado('pigmento-melanico', 'presente', [], 'Pigmento discreto nas células superficiais.'),
], conferencias=3, sem_marcacoes=True, resumo='Nevo melanocítico benigno do braço de mulher de 30 anos: lesão papilomatosa com ninhos névicos dérmicos que maturam em profundidade e pseudocisto córneo.')
print('ok')
