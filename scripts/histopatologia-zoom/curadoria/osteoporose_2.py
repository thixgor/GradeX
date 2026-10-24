import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 57a, caso 10 — "Osteoporosis".
salvar('osteoporose-2', [
    pat('trabeculas', 'trabeculas-osseas-afinadas', seta(0.4080, 0.2900, 225),
        rotulo='Trabécula fina, curta e solta no meio da medula',
        nota='O osso esponjoso normal é uma rede de trabéculas grossas, ligadas entre si como um andaime. Aqui sobram bastonetes finos e isolados, que não se conectam a nada, separados por grandes áreas de medula. O osso que existe é normal (lamelar, com osteócitos) — falta quantidade, não qualidade: é a perda de massa óssea que define a osteoporose.',
        vista=(0.380, 0.270, 0.440, 0.320)),
    pat('trabeculas-2', 'trabeculas-osseas-afinadas', seta(0.3200, 0.2500, 135),
        rotulo='Trabéculas espaçadas, desconectadas, em toda a medula',
        nota='A distância entre as trabéculas é muito maior que o normal. Sem as conexões horizontais, cada trabécula vertical sustenta carga sozinha e se curva ou quebra — daí as fraturas por fragilidade (vértebras, colo do fêmur, punho) com traumas mínimos.',
        vista=(0.250, 0.180, 0.550, 0.400)),
    pat('cortical', 'trabeculas-osseas-afinadas', seta(0.4200, 0.1950, 315),
        rotulo='Cortical fina na borda do osso',
        vista=(0.350, 0.180, 0.500, 0.220)),
    est('medula', 'medula-ossea-hematopoetica', seta(0.3950, 0.3050, 45),
        rotulo='Medula com adipócitos ocupando o espaço deixado pelo osso',
        vista=(0.385, 0.295, 0.410, 0.315)),
    est('osteocitos', 'osteocito', seta(0.4040, 0.2850, 0),
        rotulo='Osteócitos nas lacunas — o osso remanescente é normal',
        vista=(0.398, 0.278, 0.412, 0.292)),
], achados=[
    achado('trabeculas-osseas-afinadas', 'presente', ['trabeculas', 'trabeculas-2', 'cortical'],
           'Trabéculas finas, curtas e desconectadas, muito espaçadas em toda a amostra; cortical delgada.'),
    achado('fibrose-cicatricial', 'ausente', [],
           'Não há calo de fratura (tecido fibroso, cartilagem ou osso imaturo) neste corte.'),
], conferencias=3, resumo='Osteoporose: osso esponjoso com trabéculas finas, curtas e desconectadas, muito espaçadas, e cortical delgada; o osso que resta é lamelar e normal, com osteócitos, e o espaço perdido é ocupado por medula rica em adipócitos.')
print('ok')
