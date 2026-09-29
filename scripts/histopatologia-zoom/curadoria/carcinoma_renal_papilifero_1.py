import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-renal-papilifero-1', [
    pat('papilas', 'papilas-com-eixo-fibrovascular', seta(0.2330, 0.3380, 45),
        rotulo='Papilas e túbulos revestidos por células cúbicas',
        vista=(0.200, 0.300, 0.260, 0.360)),
    pat('papila-grande', 'papilas-com-eixo-fibrovascular', seta(0.2355, 0.3240, 45),
        rotulo='Papila com eixo conjuntivo-vascular',
        vista=(0.228, 0.322, 0.240, 0.334)),
    pat('espumosos', 'celulas-espumosas', seta(0.4195, 0.2585, 45),
        rotulo='Macrófagos espumosos agregados',
        vista=(0.410, 0.256, 0.422, 0.268)),
    pat('atipia', 'atipia-citologica', seta(0.2345, 0.3300, 45),
        rotulo='Núcleos com nucléolos visíveis',
        vista=(0.228, 0.322, 0.240, 0.334)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.1900, 0.2700, 45),
        rotulo='Pseudocápsula entre tumor e córtex renal',
        vista=(0.140, 0.240, 0.200, 0.300)),
    est('glomerulo', 'corpusculo-renal', seta(0.1770, 0.2550, 45), rotulo='Glomérulo do córtex normal',
        vista=(0.140, 0.240, 0.200, 0.300)),
], achados=[
    achado('papilas-com-eixo-fibrovascular', 'presente', ['papilas', 'papila-grande'], 'Papilas e túbulos revestidos por uma camada de células cúbicas de citoplasma eosinofílico ou claro, com eixos finos; algumas luzes dilatadas com material proteináceo.'),
    achado('celulas-espumosas', 'presente', ['espumosos'], 'Agregados de macrófagos espumosos de núcleo pequeno em focos do tumor.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'], 'Faixa fibrosa espessa separa o tumor do córtex renal normal.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos redondos a ovais, de tamanho moderado, com nucléolos visíveis no grande aumento.'),
], conferencias=3, resumo='Carcinoma de células renais papilífero de nefrectomia parcial: papilas e túbulos revestidos por células cúbicas, macrófagos espumosos e pseudocápsula fibrosa; córtex renal normal na mesma lâmina, para comparação.')
print('ok')
