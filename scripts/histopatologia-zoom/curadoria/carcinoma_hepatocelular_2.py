import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1173, caso 9 — "Hepatocellular carcinoma in cirrhosis".
salvar('carcinoma-hepatocelular-2', [
    pat('trabeculas', 'trabeculas-hepatocelulares-espessas', seta(0.2615, 0.1515, 225),
        rotulo='Trabéculas grossas de hepatócitos neoplásicos',
        nota='As células lembram hepatócitos (poligonais, citoplasma rosa, núcleo central), mas se organizam em placas de várias células de espessura, separadas por sinusoides finos — no fígado normal a placa tem uma ou duas células. Não há espaços-porta nem veias centrais no nódulo: o tecido perdeu a arquitetura lobular.',
        vista=(0.250, 0.140, 0.280, 0.165)),
    pat('atipia', 'atipia-citologica', seta(0.2731, 0.1631, 315),
        rotulo='Núcleos grandes, nucléolos evidentes, relação N/C alta',
        nota='Comparadas aos hepatócitos do fígado cirrótico vizinho, as células tumorais são mais apertadas, com núcleos maiores e mais escuros e algumas células gigantes e pleomórficas. Os vacúolos claros espalhados são gordura e pseudoácinos.',
        vista=(0.262, 0.152, 0.280, 0.165)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.3431, 0.3800, 135),
        rotulo='Faixa fibrosa que encapsula o nódulo tumoral',
        nota='O tumor cresce empurrando o fígado e é envolvido por uma faixa de colágeno com vasos — a pseudocápsula, típica do carcinoma hepatocelular "nodular" e visível também na tomografia como anel tardio.',
        vista=(0.280, 0.300, 0.460, 0.480)),
    pat('cirrose', 'nodulos-regenerativos', seta(0.6000, 0.7000, 225),
        rotulo='Fígado de fundo cirrótico: nódulos e septos',
        nota='Fora do tumor, todo o fígado é cirrótico — nódulos de regeneração cercados por septos. A cirrose (por vírus B ou C, álcool, MASLD) é o terreno de cerca de 80 % dos carcinomas hepatocelulares.',
        vista=(0.450, 0.550, 0.800, 0.850)),
    est('hepatocitos', 'hepatocito', seta(0.4290, 0.3540, 315),
        rotulo='Hepatócitos não neoplásicos, do lado cirrótico',
        vista=(0.400, 0.320, 0.460, 0.380)),
], achados=[
    achado('trabeculas-hepatocelulares-espessas', 'presente', ['trabeculas'],
           'Padrão trabecular espesso em todo o nódulo, sem espaços-porta.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos aumentados e hipercromáticos, nucléolos evidentes e células pleomórficas ocasionais.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'],
           'Faixa fibrosa larga separa o nódulo tumoral do fígado cirrótico.'),
    achado('nodulos-regenerativos', 'presente', ['cirrose'],
           'O parênquima não tumoral é todo cirrótico, com nódulos e septos.'),
    achado('invasao-angiolinfatica', 'nao-avaliavel', [],
           'Não se identificou tumor dentro de ramos portais nos setores conferidos; a invasão vascular só se afasta com amostragem da periferia do nódulo inteiro.'),
], conferencias=3, resumo='Carcinoma hepatocelular em cirrose: nódulo de hepatócitos neoplásicos em trabéculas espessas, com atipia e sem espaços-porta, envolto por pseudocápsula fibrosa e cercado por fígado cirrótico com nódulos de regeneração.')
print('ok')
