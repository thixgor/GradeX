import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('enfisema-1', [], achados=[
    achado('destruicao-de-septos-alveolares', 'presente', [], 'Espaços aéreos muito alargados e irregulares, com septos finos, rompidos e pontas soltas.'),
    achado('antracose', 'presente', [], 'Pigmento antracótico abundante em macrófagos junto a septos e vasos.'),
], conferencias=3, sem_marcacoes=True, resumo='Pulmão de homem de 65 anos com tosse produtiva: enfisema com destruição de septos e antracose; brônquio com cartilagem na mesma lâmina.')
print('ok')
