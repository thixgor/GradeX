import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 261, caso 43 — "Arteriosclerotic aneurysm, thrombosed" (artéria junto à adrenal).
salvar('trombose-arterial-2', [
    pat('trombo', 'trombo-com-linhas-de-zahn', seta(0.4300, 0.4100, 225),
        rotulo='Trombo enchendo a luz do aneurisma, em camadas',
        nota='A luz dilatada está ocupada por uma massa de fibrina e plaquetas (zonas rosa-pálidas) alternando com faixas de hemácias (zonas vermelhas) — as linhas de Zahn. Elas só se formam com sangue fluindo: provam que o trombo se depositou em vida, camada por camada, e não é coágulo post mortem (que é gelatinoso e sem camadas).',
        vista=(0.380, 0.370, 0.480, 0.440)),
    pat('linhas', 'trombo-com-linhas-de-zahn', seta(0.4300, 0.4250, 315),
        rotulo='Faixa pálida de fibrina e plaquetas ao lado de faixa de hemácias',
        vista=(0.410, 0.410, 0.450, 0.440)),
    pat('parede', 'espessamento-arterial', seta(0.2700, 0.4400, 45),
        rotulo='Parede do aneurisma espessa e fibrosa',
        nota='A parede da artéria perdeu a organização em camadas: é um anel de colágeno hialino espesso. A aterosclerose enfraqueceu a média, a parede dilatou (aneurisma), o fluxo ficou turbulento e lento — dois dos três fatores da tríade de Virchow — e o trombo cresceu ali.',
        vista=(0.200, 0.400, 0.320, 0.520)),
    est('adrenal', 'zona-fasciculada', seta(0.6500, 0.1800, 135),
        rotulo='Córtex adrenal em volta da artéria',
        vista=(0.600, 0.100, 0.750, 0.250)),
], achados=[
    achado('trombo-com-linhas-de-zahn', 'presente', ['trombo', 'linhas'],
           'Trombo que enche a luz do aneurisma, com faixas alternadas de fibrina/plaquetas e hemácias.'),
    achado('organizacao-do-trombo', 'nao-avaliavel', [],
           'Nos campos conferidos não se separa com segurança tecido de granulação invadindo o trombo; a interface trombo-parede tem fendas de retração.'),
    achado('espessamento-arterial', 'presente', ['parede'],
           'Parede arterial espessada por colágeno hialino, dilatada em aneurisma.'),
    achado('fendas-de-colesterol', 'nao-avaliavel', [],
           'Não se identificou núcleo lipídico com fendas de colesterol nos campos conferidos; a placa de origem pode estar em outro nível do vaso.'),
], conferencias=3, resumo='Trombose em aneurisma arteriosclerótico: artéria dilatada, de parede espessa e hialina, com a luz ocupada por trombo de camadas alternadas de fibrina/plaquetas e hemácias (linhas de Zahn), cercada pelo córtex adrenal.')
print('ok')
