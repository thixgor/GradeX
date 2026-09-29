import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('esteatose-hepatica-1', [
    pat('gota-grande', 'esteatose-macrovesicular', seta(0.6205, 0.2645, 45),
        rotulo='Gota grande de gordura, núcleo deslocado',
        nota='Vacúolo único, redondo e vazio (a gordura se dissolveu no processamento), do tamanho do hepatócito.',
        vista=(0.612, 0.256, 0.628, 0.272)),
    pat('gota-grande-2', 'esteatose-macrovesicular', seta(0.6125, 0.2685, 315),
        rotulo='Esteatose macrovesicular',
        vista=(0.604, 0.260, 0.620, 0.276)),
    pat('gotas-pequenas', 'esteatose-microvesicular', seta(0.6163, 0.2657, 45),
        rotulo='Várias gotas pequenas por hepatócito, núcleo central',
        vista=(0.612, 0.262, 0.622, 0.272)),
    est('vaso', 'vaso-sanguineo', seta(0.402, 0.535, 0), rotulo='Ramo venoso com bainha conjuntiva',
        vista=(0.36, 0.49, 0.46, 0.57)),
], achados=[
    achado('esteatose-macrovesicular', 'presente', ['gota-grande', 'gota-grande-2'],
           'Gotas grandes dispersas por todo o parênquima, sobre um fundo de gotas pequenas e médias.'),
    achado('esteatose-microvesicular', 'presente', ['gotas-pequenas'],
           'Predominam gotas pequenas e médias (várias por célula), com núcleo central — esteatose mista, não a microvesicular espumosa verdadeira.'),
    achado('balonizacao-hepatocitaria', 'ausente', [], 'Não se identificaram hepatócitos balonizados nos campos examinados: quadro de esteatose simples.'),
    achado('infiltrado-neutrofilico', 'ausente', [], 'Sem inflamação lobular significativa nos campos examinados.'),
], conferencias=3, resumo='Fragmento de fígado com esteatose difusa: quase todos os hepatócitos contêm vacúolos de gordura, sobretudo gotas pequenas e médias com gotas grandes dispersas. Sem balonização nem inflamação evidentes — esteatose simples.')
print('ok')
