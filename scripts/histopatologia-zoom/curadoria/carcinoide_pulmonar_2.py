import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 213, caso 6 — "Carcinoid tumor" (pulmão).
salvar('carcinoide-pulmonar-2', [
    pat('ninhos', 'ninhos-neuroendocrinos-organoides', seta(0.2100, 0.2550, 225),
        rotulo='Ninhos de células uniformes separados por septos fibrovasculares',
        nota='O tumor se organiza em ninhos arredondados e trabéculas, cada um contornado por um septo delicado de tecido conjuntivo com capilares — o padrão "organoide", que lembra um órgão endócrino em miniatura. A rede capilar fina é o caminho por onde saem as aminas e peptídeos que estas células produzem (serotonina, entre outros).',
        vista=(0.150, 0.200, 0.250, 0.300)),
    pat('cromatina', 'ninhos-neuroendocrinos-organoides', seta(0.2110, 0.2450, 315),
        rotulo='Núcleos redondos a ovais, cromatina em "sal e pimenta"',
        nota='Os núcleos são todos parecidos, de tamanho médio, com a cromatina em grânulos finos e grossos espalhados (sal e pimenta) e nucléolo discreto. O citoplasma é moderado e rosa-claro. Sem mitoses evidentes nem necrose, é carcinoide típico — o atípico tem 2 a 10 mitoses por 2 mm² ou necrose focal.',
        vista=(0.205, 0.240, 0.217, 0.250)),
    pat('invasao', 'invasao-estromal', seta(0.0700, 0.1300, 45),
        rotulo='Ninhos chegando à pleura e ao tecido fibroso da periferia',
        vista=(0.050, 0.100, 0.140, 0.200)),
    est('alveolos', 'alveolo-pulmonar', seta(0.0300, 0.2000, 0),
        rotulo='Parênquima pulmonar na borda do tumor',
        vista=(0.000, 0.150, 0.060, 0.230)),
    est('arteria', 'arteria-muscular', seta(0.0450, 0.2300, 45),
        rotulo='Vaso de parede muscular dentro do tumor',
        vista=(0.030, 0.215, 0.075, 0.255)),
], achados=[
    achado('ninhos-neuroendocrinos-organoides', 'presente', ['ninhos', 'cromatina'],
           'Ninhos e trabéculas de células uniformes, de cromatina em sal e pimenta, com septos fibrovasculares delicados.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'O tumor se estende até a pleura e o tecido fibroso periférico.'),
    achado('necrose-coagulativa', 'ausente', [],
           'Não há focos de necrose nos campos conferidos — compatível com carcinoide típico.'),
], conferencias=3, resumo='Tumor carcinoide (típico) do pulmão: ninhos e trabéculas de células uniformes, de núcleo redondo e cromatina em sal e pimenta, separados por septos fibrovasculares delicados (padrão organoide), sem necrose. Na borda esquerda, parênquima pulmonar e pleura.')
print('ok')
