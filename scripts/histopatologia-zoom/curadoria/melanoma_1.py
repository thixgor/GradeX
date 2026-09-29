import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('melanoma-1', [
    pat('juncional', 'ninhos-melanociticos-juncionais-atipicos', seta(0.3268, 0.4548, 45),
        rotulo='Ninhos juncionais grandes e confluentes',
        vista=(0.280, 0.420, 0.340, 0.480)),
    pat('derme', 'ausencia-de-maturacao', seta(0.6300, 0.3300, 45),
        rotulo='Lençóis de células atípicas ocupando a derme',
        vista=(0.600, 0.200, 0.800, 0.400)),
    pat('mitose', 'ausencia-de-maturacao', seta(0.5871, 0.3120, 45),
        rotulo='Figura de mitose na derme',
        vista=(0.580, 0.305, 0.590, 0.315)),
    pat('atipia', 'atipia-citologica', seta(0.6246, 0.3033, 45),
        rotulo='Núcleos grandes com nucléolo evidente',
        vista=(0.620, 0.300, 0.628, 0.308)),
    pat('pigmento', 'pigmento-melanico', seta(0.3072, 0.4470, 45),
        rotulo='Melanina nas células tumorais',
        vista=(0.300, 0.445, 0.315, 0.460)),
    est('epiderme', 'epiderme', seta(0.5574, 0.3140, 45), rotulo='Epiderme',
        vista=(0.555, 0.280, 0.595, 0.320)),
], achados=[
    achado('ninhos-melanociticos-juncionais-atipicos', 'presente', ['juncional'], 'Ninhos grandes, desiguais e confluentes na junção dermoepidérmica, com células atípicas isoladas acima da camada basal.'),
    achado('ausencia-de-maturacao', 'presente', ['derme', 'mitose'], 'Lençóis e ninhos de células epitelioides atípicas ocupam a derme sem ficar menores na profundidade; mitoses dérmicas.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos grandes, vesiculosos, com nucléolos evidentes e citoplasma amplo.'),
    achado('pigmento-melanico', 'presente', ['pigmento'], 'Pigmento melânico fino e grosseiro em células tumorais e melanófagos, focal.'),
    achado('ulceracao-da-mucosa', 'ausente', [], 'A epiderme sobre o tumor está íntegra nos cortes examinados.'),
], conferencias=3, resumo='Melanoma nodular da região lombar (excisão em elipse): ninhos juncionais atípicos e confluentes e invasão da derme por lençóis de células epitelioides atípicas, sem maturação e com mitoses; pigmento focal.')
print('ok')
