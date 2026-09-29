import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-renal-cromofobo-1', [
    pat('lencois', 'membranas-celulares-vegetais', seta(0.3300, 0.4250, 45),
        rotulo='Lençóis de células grandes de membranas nítidas',
        vista=(0.300, 0.400, 0.360, 0.460)),
    pat('binucleada', 'membranas-celulares-vegetais', seta(0.3361, 0.4357, 45),
        rotulo='Célula binucleada',
        vista=(0.330, 0.430, 0.340, 0.440)),
    pat('membrana', 'membranas-celulares-vegetais', seta(0.3322, 0.4310, 45),
        rotulo='Membrana celular espessa ("célula vegetal")',
        vista=(0.330, 0.430, 0.340, 0.440)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.1350, 0.2650, 45),
        rotulo='Pseudocápsula fibrosa',
        vista=(0.100, 0.200, 0.300, 0.400)),
], achados=[
    achado('membranas-celulares-vegetais', 'presente', ['lencois', 'binucleada', 'membrana'], 'Células poligonais grandes, de citoplasma pálido-reticulado a eosinofílico, membranas espessas, núcleos de contorno irregular e células binucleadas.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'], 'Cápsula fibrosa contínua na periferia do tumor.'),
    achado('hemorragia-intersticial', 'nao-avaliavel', [], 'A peça descreve hemorragia focal, mas nos campos examinados só há hemácias esparsas entre as trabéculas, sem área de hemorragia demonstrável.'),
], conferencias=3, resumo='Carcinoma renal cromófobo de nefrectomia radical: lençóis e trabéculas de células grandes com membranas espessas, núcleos irregulares e binucleação, limitados por pseudocápsula fibrosa.')
print('ok')
