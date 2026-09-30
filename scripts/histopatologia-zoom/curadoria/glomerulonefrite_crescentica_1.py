import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('glomerulonefrite-crescentica-1', [
    pat('crescente-fibrocelular', 'crescente-glomerular', seta(0.3850, 2.2800, 45),
        rotulo='Crescente fibrocelular obliterando o glomérulo',
        vista=(0.340, 2.220, 0.440, 2.320)),
    pat('necrose', 'necrose-fibrinoide', seta(0.3310, 2.0120, 45),
        rotulo='Necrose fibrinoide segmentar do tufo',
        vista=(0.290, 1.980, 0.390, 2.080)),
    pat('fibrose', 'fibrose-intersticial', seta(0.6500, 0.6800, 45),
        rotulo='Fibrose e inflamação intersticial',
        vista=(0.580, 0.600, 0.740, 0.760)),
], achados=[
    achado('crescente-glomerular', 'presente', ['crescente-fibrocelular'], 'Crescentes em vários glomérulos; o marcado é fibrocelular e quase oblitera o tufo. Em outros glomérulos o aspecto é menos nítido nesta digitalização.'),
    achado('necrose-fibrinoide', 'presente', ['necrose'], 'Material fibrinoide eosinofílico com restos nucleares no tufo de um glomérulo com crescente.'),
    achado('fibrose-intersticial', 'presente', ['fibrose'], 'Interstício expandido por fibrose e células inflamatórias, com túbulos atróficos.'),
], conferencias=3, resumo='Biópsia renal de homem de 78 anos em insuficiência renal aguda dependente de diálise, com sedimento urinário ativo: glomerulonefrite crescêntica com crescentes, necrose fibrinoide e fibrose intersticial.')
print('ok')
