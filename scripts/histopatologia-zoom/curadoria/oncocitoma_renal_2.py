import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 550, caso 1 — "Oncocytoma" (rim).
salvar('oncocitoma-renal-2', [
    pat('oncocitos', 'metaplasia-oncocitica', seta(0.2310, 0.1800, 225),
        rotulo='Oncócitos: citoplasma rosa granular, núcleo redondo e regular',
        nota='Células grandes, poligonais, de citoplasma eosinofílico finamente granular — o grânulo é mitocôndria, abarrotada no citoplasma (por isso o tumor é castanho-mogno na peça). Os núcleos são redondos, do mesmo tamanho, de cromatina regular, sem a pleomorfia nem os halos perinucleares do carcinoma cromófobo, o principal diferencial.',
        vista=(0.225, 0.175, 0.237, 0.187)),
    pat('ninhos', 'metaplasia-oncocitica', seta(0.2150, 0.1650, 135),
        rotulo='Ninhos e ácinos de oncócitos em estroma edemaciado e hialino',
        vista=(0.200, 0.150, 0.260, 0.210)),
    pat('estroma', 'fibrose-cicatricial', seta(0.2400, 0.1650, 315),
        rotulo='Faixas de estroma hialino entre os ninhos',
        nota='O estroma é escasso, pálido, edematoso e hialino; no centro dos tumores maiores ele forma a cicatriz central estrelada vista na tomografia. Aqui aparecem as faixas que levam a ela.',
        vista=(0.230, 0.155, 0.250, 0.175)),
    est('glomerulo', 'corpusculo-renal', seta(0.6400, 0.1600, 45),
        rotulo='Rim normal ao lado: corpúsculos renais',
        vista=(0.580, 0.100, 0.720, 0.240)),
    est('tubulos', 'tubulo-contorcido-proximal', seta(0.6000, 0.2000, 135),
        rotulo='Túbulos contorcidos do córtex normal',
        vista=(0.560, 0.160, 0.660, 0.260)),
], achados=[
    achado('metaplasia-oncocitica', 'presente', ['oncocitos', 'ninhos'],
           'Todo o tumor é formado por oncócitos em ninhos e ácinos, de núcleos redondos e regulares.'),
    achado('fibrose-cicatricial', 'presente', ['estroma'],
           'Faixas de estroma hialino e edemaciado entre os ninhos; a cicatriz central em si não está no plano deste corte.'),
], conferencias=3, resumo='Oncocitoma renal: tumor bem delimitado formado por ninhos e ácinos de oncócitos — células grandes de citoplasma eosinofílico granular e núcleos redondos e regulares — em estroma hialino pálido. À direita, córtex renal normal com corpúsculos e túbulos.')
print('ok')
