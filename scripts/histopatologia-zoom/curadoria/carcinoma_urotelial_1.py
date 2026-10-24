import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 572, caso 6 — "Transitional cell carcinoma" (ureter, nefroureterectomia).
salvar('carcinoma-urotelial-1', [
    pat('papilas', 'papilas-com-eixo-fibrovascular', seta(0.4000, 0.6500, 225),
        rotulo='Frondes papilíferas largas com eixo fibrovascular fino',
        nota='O tumor é um emaranhado de frondes, cada uma com um eixo delgado de tecido conjuntivo e capilar no centro (as linhas rosadas finas) e um revestimento de urotélio muito espesso. É a arquitetura do carcinoma urotelial papilífero — a massa pedunculada que enchia a luz do ureter.',
        vista=(0.300, 0.550, 0.500, 0.750)),
    pat('papilas-2', 'papilas-com-eixo-fibrovascular', seta(0.2600, 0.2300, 45),
        rotulo='Outra fronde, cortada ao longo do eixo',
        vista=(0.200, 0.200, 0.320, 0.320)),
    pat('atipia', 'atipia-citologica', seta(0.2600, 0.2600, 225),
        rotulo='Urotélio espessado e desorganizado, de núcleos aumentados e irregulares',
        nota='Dezenas de camadas de células, em vez das 5 a 7 do urotélio normal, sem as células em guarda-chuva na superfície. Os núcleos são maiores, ovais e irregulares, com cromatina grosseira e nucléolos, e a polaridade se perde. O grau (baixo × alto) depende de quanto essa desorganização e a atipia se espalham.',
        vista=(0.250, 0.250, 0.270, 0.270)),
], achados=[
    achado('papilas-com-eixo-fibrovascular', 'presente', ['papilas', 'papilas-2'],
           'Frondes papilíferas largas com eixo fibrovascular fino em todo o tumor.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Urotélio espessado, sem células em guarda-chuva, com núcleos aumentados e irregulares e nucléolos.'),
    achado('invasao-estromal', 'nao-avaliavel', [],
           'O corte mostra só o componente exofítico; a base do pedículo e a parede do ureter não estão incluídas, de modo que a invasão não pode ser avaliada nesta lâmina.'),
    achado('necrose-coagulativa', 'ausente', [],
           'Não há necrose nas frondes conferidas.'),
], conferencias=3, resumo='Carcinoma urotelial papilífero do ureter (nefroureterectomia; mulher de 56 anos com hematúria indolor): frondes largas com eixo fibrovascular fino, revestidas por urotélio muito espessado, sem células em guarda-chuva, de núcleos aumentados e irregulares. Só o componente exofítico está no corte — a invasão não é avaliável.')
print('ok')
