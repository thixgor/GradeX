import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('ulcera-peptica-1', [], achados=[
    achado('ulceracao-da-mucosa', 'presente', [], 'Cratera que interrompe a mucosa e a muscular da mucosa e aprofunda-se na parede.'),
    achado('fibrose-cicatricial', 'presente', [], 'Cicatriz fibrosa extensa na base, substituindo a muscular própria, com feixes musculares interrompidos.'),
    achado('tecido-de-granulacao', 'nao-avaliavel', [], 'A base mostra tecido fibroso vascularizado, mas as camadas de granulação e necrose fibrinoide não se separam com nitidez nesta lâmina.'),
    achado('exsudato-fibrinopurulento', 'nao-avaliavel', [], 'Há uma faixa superficial basofílica na base da úlcera, mas o exsudato não é inequívoco neste scan.'),
], conferencias=3, sem_marcacoes=True, resumo='Úlcera péptica crônica em homem de 50 anos com dispepsia: cratera que atravessa a parede, com cicatriz fibrosa na base interrompendo a muscular própria.')
print('ok')
