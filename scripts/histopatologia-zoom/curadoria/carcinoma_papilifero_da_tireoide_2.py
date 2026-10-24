import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1120, caso 6 — "Papillary carcinoma" (tireoide).
salvar('carcinoma-papilifero-da-tireoide-2', [
    pat('nucleos', 'nucleos-de-carcinoma-papilifero', seta(0.4600, 0.3226, 225),
        rotulo='Núcleos claros, sobrepostos, com fendas e pseudoinclusões',
        nota='Os núcleos são maiores que os de um folículo normal, ovais, com a cromatina empurrada para a membrana — o miolo fica claro, em "vidro fosco" (olhos da órfã Annie). Eles se sobrepõem como ovos numa cesta, têm sulcos longitudinais (fendas, "grãos de café") e alguns mostram uma bolha rosa de citoplasma invaginado (pseudoinclusão). É o núcleo, e não a papila, que faz o diagnóstico.',
        vista=(0.452, 0.320, 0.464, 0.330)),
    pat('papilas', 'papilas-com-eixo-fibrovascular', seta(0.4400, 0.3290, 0),
        rotulo='Papilas ramificadas com eixo fibrovascular',
        nota='Projeções com um eixo de tecido conjuntivo e vasos no centro, forradas por uma ou poucas camadas de células tumorais. Ramificam-se em várias ordens e preenchem o tumor; muitas têm o eixo edemaciado e hialino.',
        vista=(0.400, 0.300, 0.480, 0.360)),
    pat('papilas-2', 'papilas-com-eixo-fibrovascular', seta(0.4650, 0.3120, 135),
        rotulo='Papila cortada em toda a extensão',
        vista=(0.445, 0.300, 0.480, 0.325)),
    est('coloide', 'coloide', seta(0.3000, 0.6000, 45),
        rotulo='Folículos com coloide entre as áreas papilares',
        vista=(0.220, 0.540, 0.360, 0.660)),
    est('capilar', 'capilar-sanguineo', seta(0.4210, 0.3080, 315),
        rotulo='Capilar no eixo da papila',
        vista=(0.410, 0.300, 0.430, 0.316)),
], achados=[
    achado('nucleos-de-carcinoma-papilifero', 'presente', ['nucleos'],
           'Núcleos claros, sobrepostos, com fendas e pseudoinclusões em toda a lesão.'),
    achado('papilas-com-eixo-fibrovascular', 'presente', ['papilas', 'papilas-2'],
           'Papilas verdadeiras, ramificadas, com eixo fibrovascular — padrão clássico.'),
    achado('corpos-psamomatosos', 'ausente', [],
           'Nos campos conferidos não se identificaram calcificações lamelares nos eixos das papilas.'),
], conferencias=3, resumo='Carcinoma papilífero clássico da tireoide: papilas ramificadas com eixo fibrovascular, revestidas por células com núcleos claros em vidro fosco, sobrepostos, com fendas e pseudoinclusões, entremeadas a folículos com coloide.')
print('ok')
