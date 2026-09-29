import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('cirrose-hepatica-1', [
    pat('nodulo', 'nodulos-regenerativos', contorno((0.405, 0.258), (0.425, 0.253), (0.440, 0.262), (0.443, 0.278), (0.432, 0.290), (0.412, 0.291), (0.401, 0.278)),
        rotulo='Nódulo de regeneração (sem veia central)',
        vista=(0.38, 0.24, 0.47, 0.31)),
    pat('mosaico', 'nodulos-regenerativos', seta(0.55, 0.52, 45),
        rotulo='Todo o fígado dividido em nódulos pequenos (micronodular)',
        vista=(0.0, 0.0, 1.0, 0.82)),
    pat('septo', 'fibrose-intersticial', seta(0.4425, 0.3595, 45),
        rotulo='Septo fibroso envolvendo os nódulos',
        vista=(0.40, 0.33, 0.48, 0.39)),
    pat('ductulos', 'reacao-ductular', seta(0.3310, 0.3830, 180),
        rotulo='Reação ductular no septo',
        vista=(0.330, 0.365, 0.365, 0.400)),
    pat('inflamacao', 'infiltrado-linfoplasmocitario', seta(0.4245, 0.3375, 45),
        rotulo='Linfócitos e plasmócitos no septo (atividade leve)',
        vista=(0.420, 0.330, 0.430, 0.340)),
    est('hepatocitos', 'hepatocito', seta(0.4297, 0.3330, 45), rotulo='Hepatócitos do nódulo', vista=(0.420, 0.330, 0.430, 0.340)),
    est('ducto', 'epitelio-simples-colunar', seta(0.3435, 0.3775, 45), rotulo='Ducto biliar do septo', vista=(0.330, 0.365, 0.365, 0.400)),
], achados=[
    achado('nodulos-regenerativos', 'presente', ['nodulo', 'mosaico'], 'Nódulos pequenos, de tamanho relativamente uniforme, em todo o fragmento: cirrose micronodular.'),
    achado('fibrose-intersticial', 'presente', ['septo'], 'Septos fibrosos largos e completos envolvendo cada nódulo.'),
    achado('reacao-ductular', 'presente', ['ductulos'], 'Dúctulos proliferados nos septos.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['inflamacao'], 'Inflamação leve nos septos — cirrose inativa, como no diagnóstico de origem.'),
    achado('esteatose-macrovesicular', 'ausente', [], 'Sem esteatose: o paciente estava abstinente, e não há lesão alcoólica recente.'),
], conferencias=3, resumo='Fígado de explante com cirrose micronodular inativa de causa alcoólica: nódulos pequenos e uniformes de hepatócitos, separados por septos fibrosos completos com reação ductular e inflamação leve; sem esteatose (abstinência).')
print('ok')
