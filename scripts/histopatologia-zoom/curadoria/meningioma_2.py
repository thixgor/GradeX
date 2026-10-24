import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 560, caso 12 — "Meningioma". As faixas escuras verticais são dobras do corte.
salvar('meningioma-2', [
    pat('lobulos', 'espirais-meningoteliais', seta(0.4520, 0.1650, 225),
        rotulo='Células meningoteliais em lóbulos e redemoinhos sinciciais',
        nota='Células de limites mal definidos (aspecto sincicial), citoplasma rosa-claro e núcleos ovais, uniformes, de cromatina delicada — algumas com "buraco" claro no núcleo (pseudoinclusão). Elas se enrolam em redemoinhos frouxos e lóbulos, imitando as células de capuz aracnoide das quais o tumor nasce. Núcleos regulares e ausência de mitoses indicam grau 1.',
        vista=(0.440, 0.160, 0.458, 0.178)),
    pat('lobulos-2', 'espirais-meningoteliais', seta(0.4400, 0.1800, 315),
        rotulo='Lóbulos separados por septos de colágeno e vasos de parede hialina',
        nota='Faixas de colágeno e vasos de parede espessa e hialina dividem o tumor em lóbulos — mistura de padrões meningotelial e fibroso (meningioma transicional).',
        vista=(0.400, 0.150, 0.460, 0.210)),
    pat('nucleos', 'espirais-meningoteliais', seta(0.4470, 0.1625, 315),
        rotulo='Núcleos ovais, de cromatina fina, alguns com pseudoinclusão clara',
        nota='Os núcleos são todos parecidos, ovais, de cromatina delicada; alguns têm um vacúolo claro (invaginação de citoplasma), detalhe típico das células meningoteliais.',
        vista=(0.442, 0.160, 0.452, 0.168)),
    est('dura', 'dura-mater', seta(0.4800, 0.3800, 45),
        rotulo='Dura-máter e tecido fibroso de inserção do tumor',
        vista=(0.300, 0.250, 0.700, 0.450)),
], achados=[
    achado('espirais-meningoteliais', 'presente', ['lobulos', 'lobulos-2', 'nucleos'],
           'Lóbulos e redemoinhos de células meningoteliais sinciciais, de núcleos ovais regulares, com septos fibrosos.'),
    achado('corpos-psamomatosos', 'ausente', [],
           'Não se identificaram calcificações lamelares nos campos conferidos.'),
], conferencias=3, resumo='Meningioma (grau 1, padrão transicional): massa lobulada de células meningoteliais de aspecto sincicial e núcleos ovais regulares, em lóbulos e redemoinhos, separados por septos de colágeno e vasos de parede hialina, aderida à dura-máter na parte inferior do corte. As faixas escuras verticais são dobras do tecido na lâmina.')
print('ok')
