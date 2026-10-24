import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 236, caso 8 — "Dermatofibroma (fibrous histiocytoma)".
salvar('dermatofibroma-2', [
    pat('fusocelular', 'proliferacao-fusocelular-com-colageno-aprisionado', seta(0.1200, 0.2000, 45),
        rotulo='Nódulo dérmico de células fusiformes em feixes curtos entrelaçados',
        nota='A derme está ocupada por um nódulo mal delimitado de células fusiformes e histiocitoides, em feixes curtos que se cruzam (padrão estoriforme). As células são fibroblastos e histiócitos sem atipia importante — uma proliferação benigna, muitas vezes desencadeada por picada de inseto ou foliculite.',
        vista=(0.040, 0.050, 0.240, 0.320)),
    pat('colageno-aprisionado', 'proliferacao-fusocelular-com-colageno-aprisionado', seta(0.2250, 0.2300, 225),
        rotulo='Periferia: células envolvendo feixes de colágeno grossos ("queloidais")',
        nota='Na borda da lesão, as células fusiformes se insinuam entre os feixes de colágeno da derme e os abraçam, isolando bolas de colágeno hialino. Esse "colágeno aprisionado" na periferia é o detalhe que mais ajuda a reconhecer o dermatofibroma e a separá-lo do dermatofibrossarcoma, que infiltra a gordura em favo de mel.',
        vista=(0.200, 0.205, 0.250, 0.255)),
    pat('hiperplasia', 'hiperplasia-epidermica-sobrejacente', seta(0.2700, 0.1500, 270),
        rotulo='Epiderme sobre a lesão espessada, com cristas alongadas',
        nota='A epiderme logo acima do nódulo fica mais grossa e manda cristas longas e de base reta para a derme, às vezes com pigmentação basal. É uma resposta a fatores de crescimento liberados pela lesão dérmica — e explica por que o dermatofibroma é um nódulo acastanhado que "afunda" quando apertado (sinal da covinha).',
        vista=(0.230, 0.110, 0.310, 0.170)),
    est('glandulas-sudoriparas', 'glandula-sudoripara-ecrina', seta(0.2400, 0.2150, 315),
        rotulo='Glândulas sudoríparas écrinas na borda',
        vista=(0.225, 0.200, 0.250, 0.240)),
    est('foliculo', 'foliculo-piloso', seta(0.2900, 0.2050, 135),
        rotulo='Folículo piloso preservado ao lado do nódulo',
        vista=(0.270, 0.180, 0.310, 0.230)),
], achados=[
    achado('proliferacao-fusocelular-com-colageno-aprisionado', 'presente', ['fusocelular', 'colageno-aprisionado'],
           'Nódulo dérmico fusocelular, com colágeno aprisionado na periferia.'),
    achado('hiperplasia-epidermica-sobrejacente', 'presente', ['hiperplasia'],
           'Epiderme espessada, com cristas alongadas, na borda do nódulo. No centro, a superfície do nódulo está erodida.'),
    achado('celulas-espumosas', 'ausente', [],
           'Nos campos conferidos predominam células fusiformes e linfócitos; não há grupos de macrófagos espumosos nem de siderófagos.'),
], conferencias=3, resumo='Dermatofibroma (histiocitoma fibroso benigno): nódulo dérmico de células fusiformes em feixes curtos entrelaçados, com colágeno hialino aprisionado na periferia e epiderme espessada de cristas alongadas na borda. O centro do nódulo faz relevo e tem a superfície erodida; folículos e glândulas sudoríparas estão preservados ao lado.')
print('ok')
