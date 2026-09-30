import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('doenca-celiaca-1', [], achados=[
    achado('atrofia-vilositaria', 'presente', [], 'Vilosidades muito encurtadas ou ausentes (atrofia subtotal), com criptas alongadas.'),
    achado('linfocitose-intraepitelial', 'presente', [], 'Numerosos linfócitos entre os enterócitos da superfície.'),
    achado('infiltrado-linfoplasmocitario', 'presente', [], 'Lâmina própria densa de plasmócitos e linfócitos.'),
], conferencias=3, sem_marcacoes=True, resumo='Biópsia duodenal de mulher de 34 anos com suspeita de doença celíaca: atrofia vilositária subtotal, hiperplasia de criptas e linfocitose intraepitelial (Marsh 3).')
print('ok')
