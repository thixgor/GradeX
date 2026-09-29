import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('colangiocarcinoma-1', [
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.4500, 0.2400, 45),
        rotulo='Glândulas pequenas espalhadas no estroma',
        vista=(0.400, 0.200, 0.500, 0.300)),
    pat('glandula', 'glandulas-neoplasicas-complexas', seta(0.4523, 0.2208, 45),
        rotulo='Glândula de epitélio biliar atípico',
        vista=(0.445, 0.215, 0.455, 0.225)),
    pat('desmoplasia', 'reacao-desmoplasica', seta(0.4475, 0.2190, 45),
        rotulo='Estroma fibroso desmoplásico',
        vista=(0.445, 0.215, 0.455, 0.225)),
    pat('atipia', 'atipia-citologica', seta(0.4526, 0.2186, 45),
        rotulo='Núcleos vesiculosos com nucléolo',
        vista=(0.445, 0.215, 0.455, 0.225)),
    pat('infiltracao', 'invasao-estromal', seta(0.3300, 0.1450, 45),
        rotulo='Tumor infiltrando o fígado',
        vista=(0.320, 0.140, 0.370, 0.190)),
    est('hepatocitos', 'hepatocito', seta(0.3051, 0.0650, 45), rotulo='Hepatócitos residuais na borda',
        vista=(0.300, 0.060, 0.310, 0.070)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['glandulas', 'glandula'], 'Glândulas pequenas, tubulares e anastomosadas, de células cúbicas, distribuídas por toda a massa.'),
    achado('reacao-desmoplasica', 'presente', ['desmoplasia'], 'Estroma fibroso abundante e pálido entre as glândulas — o tumor é branco e duro na macroscopia.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos aumentados, redondos e vesiculosos com nucléolo, em células cúbicas.'),
    achado('invasao-estromal', 'presente', ['infiltracao'], 'Glândulas e cordões infiltram o parênquima sem cápsula.'),
], conferencias=3, resumo='Colangiocarcinoma intra-hepático (hepatectomia direita, tumor de 15 cm): glândulas pequenas de epitélio biliar atípico em estroma desmoplásico abundante; hepatócitos residuais na borda. Imuno: CK7 e CK19 positivos, CK20 e CDX2 negativos.')
print('ok')
