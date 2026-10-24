import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1203, caso 7 — "Chromophobe renal cell carcinoma".
salvar('carcinoma-renal-cromofobo-2', [
    pat('vegetais', 'membranas-celulares-vegetais', seta(0.2035, 0.4445, 315),
        rotulo='Células "vegetais": membrana grossa, citoplasma pálido, núcleo enrugado com halo',
        nota='Células grandes e poligonais cujas membranas espessas e nítidas lembram a parede de uma célula vegetal. O citoplasma é pálido e floculento — não vazio como no carcinoma de células claras —, cheio de microvesículas. Os núcleos são irregulares, enrugados como uva-passa, com um halo claro em volta, e há células binucleadas. É esse conjunto, e não uma célula isolada, que define o cromófobo.',
        vista=(0.201, 0.438, 0.213, 0.450)),
    pat('lencois', 'membranas-celulares-vegetais', seta(0.1300, 0.5300, 225),
        rotulo='Lençóis de células pálidas separados por septos vasculares delicados',
        vista=(0.100, 0.500, 0.160, 0.560)),
    pat('hemorragia', 'hemorragia-intersticial', seta(0.4800, 0.2300, 225),
        rotulo='Cistos hemorrágicos e sangue entre as trabéculas',
        nota='Espaços cheios de sangue e líquido proteináceo, com fendas de colesterol na parede — hemorragias antigas que se organizaram em cistos.',
        vista=(0.420, 0.180, 0.540, 0.280)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.2080, 0.4385, 135),
        rotulo='Faixa fibrosa entre os lóbulos do tumor',
        vista=(0.200, 0.430, 0.215, 0.442)),
], achados=[
    achado('membranas-celulares-vegetais', 'presente', ['vegetais', 'lencois'],
           'Lençóis de células de membrana espessa, citoplasma pálido floculento, núcleos enrugados com halo perinuclear e binucleação.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'],
           'Septos fibrosos lobulam o tumor; a borda com o rim não está neste corte.'),
    achado('hemorragia-intersticial', 'presente', ['hemorragia'],
           'Cistos hemorrágicos e focos de hemorragia, com fendas de colesterol.'),
], conferencias=3, resumo='Carcinoma de células renais cromófobo: lençóis de células grandes de membranas espessas ("células vegetais"), citoplasma pálido e floculento, núcleos enrugados com halo perinuclear e binucleação, lobulados por septos fibrosos e entremeados de cistos hemorrágicos com fendas de colesterol.')
print('ok')
