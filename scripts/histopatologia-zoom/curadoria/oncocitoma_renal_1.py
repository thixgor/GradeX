import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('oncocitoma-renal-1', [], achados=[
    achado('metaplasia-oncocitica', 'presente', [], 'Ninhos e lençóis de células grandes de citoplasma eosinofílico granular e núcleos redondos regulares, em todo o tumor; sem membranas espessas nem núcleos enrugados.'),
    achado('fibrose-cicatricial', 'nao-avaliavel', [], 'A cicatriz central não está incluída nesta secção; há apenas septos fibrosos finos entre os ninhos.'),
], conferencias=3, sem_marcacoes=True, resumo='Oncocitoma renal de 4,5 cm: tumor homogêneo de células oncocíticas grandes, de citoplasma rosa granular e núcleos regulares, bem delimitado do parênquima renal.')
print('ok')
