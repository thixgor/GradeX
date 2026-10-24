import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 28, caso 9 — "Mesothelioma" (pleura e pulmão subjacente).
salvar('mesotelioma-2', [
    pat('lencois', 'proliferacao-mesotelial-invasiva', seta(0.6400, 0.1500, 225),
        rotulo='Massa de células mesoteliais atípicas em lençóis, na pleura espessada',
        nota='Uma massa celular escura ocupa a pleura. São células poligonais e ovais de núcleo grande e hipercromático, coesas, em lençóis e cordões, com pigmento castanho (hemossiderina) espalhado. A proliferação mesotelial forma massa e destrói a arquitetura — não é a camada única e achatada da pleura normal nem a hiperplasia reativa, que fica na superfície.',
        vista=(0.580, 0.060, 0.700, 0.180)),
    pat('celulas', 'proliferacao-mesotelial-invasiva', seta(0.6600, 0.0900, 315),
        rotulo='Células de núcleo grande, cromatina grosseira, coesas',
        vista=(0.655, 0.085, 0.667, 0.095)),
    pat('invasao', 'invasao-estromal', seta(0.5250, 0.2050, 135),
        rotulo='Tumor penetrando o tecido fibroso da pleura',
        nota='Na borda da massa, grupos de células tumorais entram no colágeno da pleura espessada, em vez de ficar contidos na superfície. A invasão do tecido de baixo é o critério que separa o mesotelioma da proliferação mesotelial reativa.',
        vista=(0.480, 0.180, 0.560, 0.240)),
    pat('fibrose', 'fibrose-cicatricial', seta(0.3000, 0.1500, 90),
        rotulo='Pleura espessada por colágeno e fibrina organizada',
        nota='Uma faixa larga de colágeno hialino e fibrina em organização envolve o pulmão — a "casca" pleural que, no mesotelioma, aprisiona o pulmão e restringe a respiração.',
        vista=(0.100, 0.050, 0.500, 0.250)),
    est('alveolos', 'alveolo-pulmonar', seta(0.3600, 0.3500, 45),
        rotulo='Pulmão subjacente, com edema e macrófagos com antracose',
        vista=(0.300, 0.280, 0.420, 0.400)),
], achados=[
    achado('proliferacao-mesotelial-invasiva', 'presente', ['lencois', 'celulas'],
           'Massa de células mesoteliais atípicas em lençóis e cordões na pleura.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Grupos tumorais penetram o colágeno da pleura espessada.'),
    achado('fibrose-cicatricial', 'presente', ['fibrose'],
           'Pleura muito espessada por colágeno hialino e fibrina organizada; não há placa pleural hialina típica de asbesto neste corte.'),
], conferencias=3, resumo='Mesotelioma maligno da pleura: massa de células mesoteliais atípicas, em lençóis e cordões, crescendo numa pleura muito espessada por colágeno e fibrina organizada e penetrando o tecido fibroso. Por baixo, pulmão com edema e macrófagos com antracose. O diagnóstico definitivo exige imuno-histoquímica (calretinina, WT1, D2-40 positivos; marcadores de adenocarcinoma negativos).')
print('ok')
