import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('hepatite-cronica-viral-1', [
    pat('portal', 'inflamacao-portal-linfoide', seta(0.228, 0.452, 45),
        rotulo='Espaço-porta expandido por agregado linfoide',
        vista=(0.18, 0.42, 0.32, 0.54)),
    pat('ducto', 'inflamacao-portal-linfoide', seta(0.2355, 0.4465, 225),
        rotulo='Ducto biliar cercado por linfócitos',
        nota='O ducto biliar do espaço-porta está envolvido e infiltrado por linfócitos — lesão ductal típica da hepatite C.',
        vista=(0.225, 0.440, 0.255, 0.470)),
    pat('interface', 'hepatite-de-interface', seta(0.2105, 0.4740, 0),
        rotulo='Hepatite de interface: linfócitos invadindo o parênquima',
        nota='A borda entre espaço-porta e hepatócitos perdeu a nitidez: linfócitos avançam sobre a placa limitante e cercam hepatócitos periportais.',
        vista=(0.205, 0.460, 0.225, 0.490)),
    pat('agregado-2', 'inflamacao-portal-linfoide', seta(0.6485, 0.3505, 45),
        rotulo='Outro espaço-porta com agregado linfoide',
        vista=(0.630, 0.330, 0.670, 0.370)),
    pat('esteatose', 'esteatose-macrovesicular', seta(0.6603, 0.3551, 0),
        rotulo='Gota de gordura em hepatócito',
        vista=(0.650, 0.345, 0.670, 0.365)),
    est('hepatocitos', 'hepatocito', seta(0.2350, 0.5230, 45), rotulo='Hepatócitos', vista=(0.19, 0.50, 0.24, 0.54)),
], achados=[
    achado('inflamacao-portal-linfoide', 'presente', ['portal', 'ducto', 'agregado-2'], 'Espaços-porta expandidos por agregados linfoides, com lesão de ducto biliar.'),
    achado('hepatite-de-interface', 'presente', ['interface'], 'Hepatite de interface leve a moderada.'),
    achado('esteatose-macrovesicular', 'presente', ['esteatose'], 'Esteatose leve, dispersa pelos fragmentos.'),
    achado('fibrose-intersticial', 'nao-avaliavel', [],
           'O caso de origem descreve expansão portal fibrosa com septos sem pontes (na coloração de reticulina); em H&E a fibrose não é estadiável com segurança.'),
], conferencias=3, resumo='Biópsia hepática (três cilindros) com hepatite C crônica leve a moderada: espaços-porta expandidos por agregados linfoides, com lesão de ducto biliar, hepatite de interface e esteatose leve.')
print('ok')
