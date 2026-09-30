import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('nefropatia-membranosa-1', [
    pat('alcas', 'espessamento-da-parede-capilar-glomerular', seta(0.5095, 0.0850, 45),
        rotulo='Alças capilares abertas, de paredes grossas e rígidas',
        vista=(0.500, 0.079, 0.512, 0.091)),
    pat('alcas-2', 'espessamento-da-parede-capilar-glomerular', seta(0.5030, 0.0858, 45),
        rotulo='O mesmo padrão em outro glomérulo',
        vista=(0.500, 0.079, 0.512, 0.091)),
    pat('celularidade', 'espessamento-da-parede-capilar-glomerular', seta(0.5088, 0.0868, 45),
        rotulo='Sem aumento de células no tufo',
        vista=(0.500, 0.079, 0.512, 0.091)),
    est('tubulos', 'tubulo-contorcido-proximal', seta(0.5055, 0.0815, 45), rotulo='Túbulos proximais',
        vista=(0.500, 0.079, 0.512, 0.091)),
], achados=[
    achado('espessamento-da-parede-capilar-glomerular', 'presente', ['alcas', 'alcas-2', 'celularidade'], 'Alças capilares difusamente espessas e rígidas, com celularidade normal, em todos os glomérulos. As espículas e os depósitos são confirmados pela prata e pela imunofluorescência, não pelo H&E.'),
    achado('esclerose-glomerular-global', 'ausente', [], 'Os glomérulos examinados não estão esclerosados.'),
    achado('fibrose-intersticial', 'ausente', [], 'Túbulos preservados e interstício sem fibrose significativa.'),
], conferencias=3, resumo='Biópsia renal de homem de 35 anos com síndrome nefrótica: nefropatia membranosa — glomérulos de celularidade normal com paredes capilares difusamente espessas e rígidas; túbulos e interstício preservados.')
print('ok')
