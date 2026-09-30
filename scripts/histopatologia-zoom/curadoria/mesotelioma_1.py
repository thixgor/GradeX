import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('mesotelioma-1', [], achados=[
    achado('proliferacao-mesotelial-invasiva', 'presente', [], 'Células epitelioides mesoteliais em túbulos e lençóis ao longo da pleura espessada.'),
    achado('invasao-estromal', 'presente', [], 'O tumor penetra entre adipócitos da gordura subpleural — critério de malignidade.'),
    achado('fibrose-cicatricial', 'presente', [], 'Pleura espessada por tecido fibroso ao redor do tumor.'),
], conferencias=3, sem_marcacoes=True, resumo='Biópsia pleural de mulher de 77 anos com derrame: mesotelioma epitelioide infiltrando a gordura subpleural.')
print('ok')
