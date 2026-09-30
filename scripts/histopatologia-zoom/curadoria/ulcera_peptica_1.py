import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('ulcera-peptica-1', [
    pat('cratera', 'ulceracao-da-mucosa', seta(0.4500, 0.2900, 45),
        rotulo='Cratera da úlcera: mucosa ausente',
        vista=(0.050, 0.000, 0.950, 0.560)),
    pat('borda', 'ulceracao-da-mucosa', seta(0.5900, 0.2050, 45),
        rotulo='Borda: a mucosa gástrica termina abruptamente',
        vista=(0.560, 0.160, 0.660, 0.260)),
    pat('exsudato', 'exsudato-fibrinopurulento', seta(0.4540, 0.3035, 45),
        rotulo='Exsudato fibrinoso com neutrófilos na superfície',
        vista=(0.445, 0.298, 0.461, 0.314)),
    pat('granulacao', 'tecido-de-granulacao', seta(0.4525, 0.3085, 45),
        rotulo='Tecido de granulação: capilares e fibroblastos',
        vista=(0.445, 0.298, 0.461, 0.314)),
    pat('cicatriz', 'fibrose-cicatricial', seta(0.4600, 0.3700, 45),
        rotulo='Cicatriz fibrosa substituindo a muscular própria',
        vista=(0.050, 0.000, 0.950, 0.560)),
    est('mucosa', 'mucosa-gastrica', seta(0.7300, 0.1100, 45), rotulo='Mucosa gástrica ao lado da úlcera',
        vista=(0.700, 0.080, 0.780, 0.160)),
    est('muscular', 'muscular-externa', seta(0.6400, 0.2400, 45), rotulo='Muscular própria interrompida na borda',
        vista=(0.560, 0.160, 0.660, 0.260)),
], achados=[
    achado('ulceracao-da-mucosa', 'presente', ['cratera', 'borda'], 'Cratera que interrompe a mucosa e a muscular da mucosa e aprofunda-se na parede; bordas abruptas.'),
    achado('fibrose-cicatricial', 'presente', ['cicatriz'], 'Cicatriz fibrosa extensa na base, substituindo a muscular própria.'),
    achado('tecido-de-granulacao', 'presente', ['granulacao'], 'Sob o exsudato, faixa de tecido de granulação com capilares, fibroblastos e células inflamatórias.'),
    achado('exsudato-fibrinopurulento', 'presente', ['exsudato'], 'Camada superficial de fibrina com neutrófilos e restos celulares.'),
], conferencias=3, resumo='Úlcera péptica gástrica crônica em homem de 50 anos com dispepsia: cratera com exsudato, tecido de granulação e cicatriz fibrosa que substitui a muscular própria; mucosa gástrica preservada nas bordas.')
print('ok')
