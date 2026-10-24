import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 360, caso 1 — "Leiomyoma" (útero).
salvar('leiomioma-uterino-1', [
    pat('fasciculos', 'fasciculos-de-musculo-liso', seta(0.4460, 0.2100, 225),
        rotulo='Células musculares lisas em fascículos, de núcleo "em charuto"',
        nota='Células fusiformes de citoplasma rosa e fibrilar, núcleo alongado de pontas rombas e cromatina fina, arrumadas em feixes paralelos. São células musculares lisas iguais às do miométrio — o tumor é benigno e imita fielmente o tecido de origem. Não há atipia difusa nem mitoses numerosas neste campo.',
        vista=(0.440, 0.205, 0.452, 0.215)),
    pat('redemoinho', 'fasciculos-de-musculo-liso', seta(0.5500, 0.1500, 135),
        rotulo='Feixes que se cruzam em ângulos variados (redemoinho)',
        nota='A pequeno aumento, os fascículos cortados longitudinal e transversalmente se entrelaçam, dando o aspecto em redemoinho que também se vê na superfície de corte branca e fasciculada do mioma.',
        vista=(0.450, 0.080, 0.700, 0.250)),
    pat('hialina', 'degeneracao-hialina', seta(0.4300, 0.2450, 315),
        rotulo='Degeneração hialina: área rósea, vítrea e pouco celular',
        nota='No centro do nódulo, os fascículos dão lugar a material eosinofílico homogêneo, com poucas células presas e sangue extravasado. É a degeneração por isquemia lenta do tumor que cresceu mais que seu suprimento — benigna, com transição gradual, diferente da necrose tumoral do leiomiossarcoma.',
        vista=(0.400, 0.200, 0.480, 0.280)),
    pat('hialina-2', 'degeneracao-hialina', seta(0.3000, 0.2800, 45),
        rotulo='Faixa extensa de hialinização e hemorragia antiga',
        vista=(0.200, 0.180, 0.420, 0.400)),
    est('miometrio', 'miometrio', seta(0.5000, 0.5200, 270),
        rotulo='Miométrio comprimido em lâminas concêntricas (pseudocápsula)',
        vista=(0.050, 0.420, 0.950, 0.600)),
], achados=[
    achado('fasciculos-de-musculo-liso', 'presente', ['fasciculos', 'redemoinho'],
           'Nódulo bem delimitado de fascículos entrelaçados de músculo liso, de núcleo em charuto.'),
    achado('degeneracao-hialina', 'presente', ['hialina', 'hialina-2'],
           'Área central extensa de degeneração hialina com hemorragia antiga.'),
    achado('atipia-citologica', 'ausente', [],
           'Núcleos regulares, sem pleomorfismo difuso nos campos conferidos.'),
    achado('necrose-coagulativa', 'ausente', [],
           'A área central é hialina, de transição gradual, sem a borda abrupta e as sombras celulares da necrose tumoral.'),
], conferencias=3, resumo='Leiomioma uterino: nódulo bem delimitado de fascículos entrelaçados de células musculares lisas de núcleo em charuto, sem atipia, com extensa degeneração hialina e hemorragia antiga no centro e miométrio comprimido em lâminas concêntricas ao redor (pseudocápsula).')
print('ok')
