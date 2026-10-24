import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1203, caso 6 — "Papillary renal cell carcinoma".
salvar('carcinoma-renal-papilifero-2', [
    pat('papilas', 'papilas-com-eixo-fibrovascular', seta(0.1650, 0.0580, 225),
        rotulo='Papilas com eixo fibrovascular, revestidas por células cúbicas',
        nota='Projeções digitiformes com um eixo fino de tecido conjuntivo e capilar, forradas por uma camada de células cúbicas de citoplasma escasso e núcleo regular. Na parte mais compacta do tumor, as papilas ficam tão apertadas que parecem túbulos sólidos.',
        vista=(0.140, 0.035, 0.200, 0.075)),
    pat('espumosas', 'celulas-espumosas', seta(0.1590, 0.0570, 315),
        rotulo='Eixo de papila cheio de macrófagos espumosos',
        nota='Os eixos de várias papilas estão distendidos por macrófagos de citoplasma claro e espumoso, carregados de lipídio. É um achado muito característico do carcinoma papilífero renal — tão típico que ajuda a reconhecê-lo mesmo em biópsia pequena.',
        vista=(0.150, 0.050, 0.170, 0.065)),
    pat('papilas-compactas', 'papilas-com-eixo-fibrovascular', seta(0.2200, 0.3300, 135),
        rotulo='Área compacta: papilas e túbulos apertados',
        vista=(0.200, 0.300, 0.260, 0.360)),
    pat('atipia', 'atipia-citologica', seta(0.2350, 0.3150, 225),
        rotulo='Núcleos ovais, de tamanho moderado, sem grande pleomorfia',
        vista=(0.225, 0.305, 0.245, 0.325)),
    pat('septos', 'pseudocapsula-fibrosa', seta(0.1500, 0.1150, 90),
        rotulo='Faixas fibrosas espessas dividindo o tumor',
        vista=(0.080, 0.100, 0.240, 0.200)),
], achados=[
    achado('papilas-com-eixo-fibrovascular', 'presente', ['papilas', 'papilas-compactas'],
           'Padrão papilar e túbulo-papilar em todo o tumor.'),
    achado('celulas-espumosas', 'presente', ['espumosas'],
           'Macrófagos espumosos agrupados nos eixos das papilas.'),
    achado('pseudocapsula-fibrosa', 'presente', ['septos'],
           'Faixas fibrosas espessas atravessam o tumor; a borda com o rim não está neste corte.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos ovais de tamanho moderado, com nucléolos pouco evidentes — grau baixo a intermediário.'),
], conferencias=3, resumo='Carcinoma de células renais papilífero: papilas e túbulos revestidos por células cúbicas de núcleos ovais, com eixos fibrovasculares, muitos distendidos por macrófagos espumosos, faixas fibrosas espessas e extensa hemorragia na metade inferior do tumor.')
print('ok')
