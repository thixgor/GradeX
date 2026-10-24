import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 96, caso 1 — "Seminoma".
salvar('seminoma-2', [
    pat('celulas', 'celulas-germinativas-neoplasicas', seta(0.5930, 0.3800, 225),
        rotulo='Células grandes, de citoplasma claro e núcleo central com nucléolo',
        nota='Cada célula tem membrana nítida, citoplasma claro (glicogênio dissolvido) e um núcleo grande, central, de cromatina grosseira, com nucléolo evidente. São células germinativas primordiais transformadas — a mesma linhagem que forma os espermatozoides — e por isso o tumor expressa OCT3/4 e PLAP. Arranjam-se em lençóis e ninhos.',
        vista=(0.588, 0.376, 0.598, 0.384)),
    pat('lencois', 'celulas-germinativas-neoplasicas', seta(0.5900, 0.3500, 135),
        rotulo='Lençóis e ninhos de células tumorais substituindo o testículo',
        vista=(0.540, 0.300, 0.660, 0.420)),
    pat('linfocitos', 'infiltrado-linfoplasmocitario', seta(0.5770, 0.3720, 315),
        rotulo='Septo fibroso com linfócitos',
        nota='Faixas finas de tecido conjuntivo, carregadas de linfócitos pequenos, separam os ninhos. A combinação "células claras em ninhos + septos com linfócitos" é a imagem que se fixa do seminoma; os linfócitos são T, uma resposta imune contra o tumor.',
        vista=(0.565, 0.360, 0.590, 0.385)),
    est('tunica', 'tunica-albuginea-testicular', seta(0.5000, 0.0300, 90),
        rotulo='Túnica albugínea',
        vista=(0.300, 0.000, 0.700, 0.080)),
], achados=[
    achado('celulas-germinativas-neoplasicas', 'presente', ['celulas', 'lencois'],
           'Lençóis e ninhos de células grandes e claras, de núcleo central e nucléolo evidente, em todo o corte — mais compactos na metade inferior.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfocitos'],
           'Septos fibrosos com linfócitos entre os ninhos.'),
    achado('granuloma-epitelioide', 'ausente', [],
           'Não se identificaram agregados de histiócitos epitelioides nem células gigantes nos campos conferidos.'),
], conferencias=3, resumo='Seminoma clássico do testículo: lençóis e ninhos de células grandes, de citoplasma claro e núcleo central com nucléolo evidente, separados por septos fibrosos com linfócitos, sob a túnica albugínea. Na metade superior, o tumor é entremeado por faixas largas de estroma fibroso e hialino; não há túbulos seminíferos residuais neste corte.')
print('ok')
