import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# AANP Diagnostic Slide Session 1987, caso 6 (arquivo da University of Pittsburgh) —
# "Multiple infarcts secondary to lupus vasculitis".
salvar('avc-isquemico-2', [
    pat('infarto', 'infarto-cerebral-agudo', seta(0.1500, 0.1400, 45),
        rotulo='Território infartado: o neurópilo sumiu, sobram células soltas',
        nota='Onde deveria haver a trama fina e rosada do neurópilo, com neurônios e glia, há só um tapete de células redondas soltas e vasos. O tecido nervoso morreu por falta de sangue e está sendo digerido — no cérebro a necrose isquêmica é liquefativa, porque o tecido tem pouco colágeno e muita gordura (mielina).',
        vista=(0.080, 0.080, 0.200, 0.180)),
    pat('macrofagos', 'celulas-espumosas', seta(0.4920, 0.4000, 225),
        rotulo='Macrófagos espumosos ("células grânulo-adiposas") limpando a área',
        nota='Células grandes, redondas, de núcleo pequeno e citoplasma espumoso cheio de restos de mielina fagocitada. Chegam a partir do segundo ou terceiro dia e dominam a lesão entre a primeira e a terceira semana — sua presença data o infarto como subagudo. Com meses, o tecido removido deixa uma cavidade (cisto) cercada por gliose.',
        vista=(0.485, 0.395, 0.500, 0.408)),
    pat('transicao', 'infarto-cerebral-agudo', seta(0.1250, 0.1500, 315),
        rotulo='Borda do infarto: tecido mais preservado à esquerda',
        vista=(0.090, 0.120, 0.160, 0.170)),
    pat('vasos', 'hiperemia-e-congestao', seta(0.4600, 0.4350, 315),
        rotulo='Vasos neoformados e congestos no território infartado',
        nota='No infarto em reparo surgem muitos capilares novos, que trazem os macrófagos; os vasos maiores mostram paredes espessadas. Neste caso a causa é vasculite do lúpus — a inflamação da parede fecha a luz dos vasos e produz infartos múltiplos.',
        vista=(0.430, 0.410, 0.490, 0.460)),
    est('arteria', 'arteria-muscular', seta(0.4400, 0.3950, 135),
        rotulo='Artéria de parede espessa na lesão',
        vista=(0.420, 0.380, 0.470, 0.410)),
], achados=[
    achado('infarto-cerebral-agudo', 'presente', ['infarto', 'transicao'],
           'Área extensa em que o neurópilo foi destruído e substituído por macrófagos e vasos — infarto em fase subaguda (de reabsorção), não hiperagudo.'),
    achado('neuronios-vermelhos', 'ausente', [],
           'Os neurônios do território infartado já foram removidos; não se veem neurônios eosinofílicos retraídos (achado das primeiras 12 a 48 horas).'),
    achado('hemorragia-intersticial', 'ausente', [],
           'Não há hemorragias petequiais ou perivasculares nos campos conferidos.'),
    achado('hiperemia-e-congestao', 'presente', ['vasos'],
           'Capilares neoformados e vasos congestos na lesão.'),
    achado('celulas-espumosas', 'presente', ['macrofagos'],
           'Lençóis de macrófagos espumosos (células grânulo-adiposas) — marcam a fase subaguda.'),
], conferencias=3, resumo='Infarto cerebral subagudo por vasculite do lúpus: área extensa em que o neurópilo foi destruído e substituído por lençóis de macrófagos espumosos (células grânulo-adiposas) e capilares neoformados, com vasos de parede espessa; o córtex adjacente é mais preservado. Fase de reabsorção da necrose liquefativa, entre a primeira e a terceira semana.')
print('ok')
