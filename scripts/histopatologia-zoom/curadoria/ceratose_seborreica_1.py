import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('ceratose-seborreica-1', [
    pat('lesao', 'acantose-basaloide-exofitica', seta(0.8200, 0.2100, 45),
        rotulo='Lesão exofítica, com a base em linha reta',
        vista=(0.500, 0.100, 0.980, 0.400)),
    pat('basaloides', 'acantose-basaloide-exofitica', seta(0.7200, 0.1600, 45),
        rotulo='Células basaloides uniformes',
        vista=(0.700, 0.130, 0.760, 0.190)),
    pat('pseudocisto', 'pseudocistos-corneos', seta(0.7420, 0.1768, 45),
        rotulo='Pseudocisto córneo (queratina lamelar)',
        vista=(0.700, 0.130, 0.760, 0.190)),
    pat('pseudocistos', 'pseudocistos-corneos', seta(0.8650, 0.2500, 45),
        rotulo='Vários pseudocistos pela lesão',
        vista=(0.500, 0.100, 0.980, 0.400)),
    est('derme', 'derme-reticular', seta(0.6500, 0.2800, 45), rotulo='Derme sem invasão',
        vista=(0.500, 0.100, 0.980, 0.400)),
], achados=[
    achado('acantose-basaloide-exofitica', 'presente', ['lesao', 'basaloides'], 'Epiderme muito espessada por células basaloides pequenas e uniformes, sem atipia, formando uma placa elevada de base plana.'),
    achado('pseudocistos-corneos', 'presente', ['pseudocisto', 'pseudocistos'], 'Muitos pseudocistos de queratina lamelar espalhados pela lesão.'),
    achado('pigmento-melanico', 'ausente', [], 'Não há pigmento apreciável: forma não pigmentada.'),
], conferencias=3, resumo='Ceratose seborreica acantótica do dorso: placa exofítica de células basaloides uniformes com muitos pseudocistos córneos e base plana; derme sem invasão.')
print('ok')
