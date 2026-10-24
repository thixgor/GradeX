import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 123, caso 4 — "Fatty metamorphosis" (fígado).
salvar('esteatose-hepatica-2', [
    pat('macro', 'esteatose-macrovesicular', seta(0.4200, 0.4150, 225),
        rotulo='Hepatócitos com um vacúolo grande que empurra o núcleo para a borda',
        nota='Quase todos os hepatócitos têm uma gota única de gordura que ocupa a célula inteira e achata o núcleo contra a membrana, como um anel de sinete. A gordura (triglicerídeos) foi dissolvida pelo processamento e deixa o vacúolo vazio. Acumula quando chegam mais ácidos graxos ao fígado do que ele consegue oxidar ou exportar como VLDL — álcool, obesidade, diabetes, desnutrição proteica.',
        vista=(0.400, 0.400, 0.460, 0.460)),
    pat('micro', 'esteatose-microvesicular', seta(0.4400, 0.4250, 315),
        rotulo='Células com várias gotas pequenas e núcleo ainda central',
        nota='Entre as gotas grandes há hepatócitos com várias gotículas que ainda não se fundiram, com o núcleo no centro. É a mistura habitual: a gota pequena é o estágio anterior da grande.',
        vista=(0.430, 0.415, 0.450, 0.435)),
    pat('difusa', 'esteatose-macrovesicular', seta(0.2000, 0.5300, 45),
        rotulo='Esteatose difusa, em todos os lóbulos',
        vista=(0.140, 0.480, 0.240, 0.580)),
    est('hepatocito', 'hepatocito', seta(0.1850, 0.5450, 315),
        rotulo='Grupo de hepatócitos com menos gordura',
        vista=(0.175, 0.535, 0.195, 0.555)),
    est('sinusoide', 'sinusoide-hepatico', seta(0.4520, 0.4550, 135),
        rotulo='Sinusoides comprimidos entre células tumefeitas',
        vista=(0.445, 0.448, 0.460, 0.460)),
], achados=[
    achado('esteatose-macrovesicular', 'presente', ['macro', 'difusa'],
           'Esteatose macrovesicular difusa e intensa, em quase todos os hepatócitos.'),
    achado('esteatose-microvesicular', 'presente', ['micro'],
           'Componente de gotas pequenas misturado às gotas grandes.'),
    achado('balonizacao-hepatocitaria', 'ausente', [],
           'Os hepatócitos sem gordura têm citoplasma granular normal; não se veem células balonizadas de citoplasma claro e rarefeito.'),
    achado('infiltrado-neutrofilico', 'ausente', [],
           'Não há neutrófilos em torno de hepatócitos nos campos conferidos — esteatose simples, não esteato-hepatite.'),
], conferencias=3, resumo='Esteatose hepática intensa e difusa: quase todos os hepatócitos contêm um vacúolo grande de gordura que desloca o núcleo para a periferia (macrovesicular), com gotas pequenas em parte das células; os sinusoides ficam comprimidos. Sem balonização nem neutrófilos — esteatose simples.')
print('ok')
