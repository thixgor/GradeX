import { describe, expect, it } from 'vitest'
import {
  CARGOS_EMBUTIDOS_IDS,
  IDS_RESERVADOS,
  acharCargo,
  areasDoCargo,
  cargoEmBranco,
  cargoPublico,
  cargosEmbutidos,
  mesclarRegistroDeCargos,
  normalizeCargo,
  sanitizarRegistroDeCargos,
  slugDeCargo,
  validarIdDeCargo,
} from '@/lib/cargos'
import { normalizeAccountType } from '@/lib/account-tier'
import { PLAN_FEATURE_KEYS, permissoesLiberadas } from '@/lib/plan-entitlements'

/**
 * O registro de cargos.
 *
 * O que estes testes seguram, em ordem de gravidade:
 *
 *  1. **O deploy não muda o acesso de ninguém.** Os cargos de fábrica precisam
 *     entrar com o bloco modular desligado. Se um deles entrasse ligado, todas
 *     as contas com aquele cargo passariam a ser regidas por um documento que
 *     ninguém revisou — e as que hoje vivem do caminho legado perderiam acesso
 *     de uma vez.
 *  2. **Cargo de fábrica não some.** `plus` e `gratuito` são nomeados direto no
 *     código (`isPlusAccount`, o piso de `normalizeAccountType`, filtros de
 *     receita). Um payload que os omita não pode apagá-los.
 *  3. **Id que o sistema já usa não vira cargo.** Um cargo com id `admin` ou
 *     `monitor` criaria uma conta que o resto da plataforma lê como outra coisa.
 *  4. **Cargo novo nasce fechado e ligado.** Fechado porque conceder por
 *     omissão é o erro caro; ligado porque um cargo novo não tem caminho legado
 *     para herdar — desligado, ele não faria nada e ninguém entenderia por quê.
 */
describe('registro de cargos', () => {
  describe('cargos de fábrica', () => {
    it('entram com o bloco modular desligado', () => {
      for (const cargo of cargosEmbutidos()) {
        expect(cargo.permissoes.ativo, cargo.id).toBe(false)
      }
    })

    it('cobrem exatamente os ids que o código nomeia diretamente', () => {
      const ids = cargosEmbutidos().map(c => c.id)
      expect(ids.sort()).toEqual([...CARGOS_EMBUTIDOS_IDS].sort())
    })

    it('marcam como pagos só o Plus+ e o Quest', () => {
      const pagos = cargosEmbutidos().filter(c => c.pago).map(c => c.id)
      expect(pagos.sort()).toEqual(['plus', 'quest'])
    })
  })

  describe('mescla com o que está gravado', () => {
    it('devolve os embutidos quando não há nada gravado', () => {
      const registro = mesclarRegistroDeCargos(null)
      expect(registro.map(c => c.id).sort()).toEqual([...CARGOS_EMBUTIDOS_IDS].sort())
    })

    it('não deixa um payload incompleto apagar um cargo de fábrica', () => {
      // O admin manda só o Plus+; gratuito, trial e quest têm de sobreviver.
      const registro = mesclarRegistroDeCargos([{ id: 'plus', nome: 'Plus+' }])
      for (const id of CARGOS_EMBUTIDOS_IDS) {
        expect(registro.some(c => c.id === id), id).toBe(true)
      }
    })

    it('aceita a edição de rótulo e cor de um embutido', () => {
      const registro = mesclarRegistroDeCargos([{ id: 'plus', nome: 'Total', cor: 'violeta' }])
      const plus = acharCargo(registro, 'plus')
      expect(plus?.nome).toBe('Total')
      expect(plus?.cor).toBe('violeta')
      expect(plus?.embutido).toBe(true)
    })

    it('não deixa um embutido mudar de "pago" pelo documento', () => {
      // `pago` é estrutural: o cron e o Guard contam com ele.
      const registro = mesclarRegistroDeCargos([{ id: 'plus', nome: 'Plus+', pago: false }])
      expect(acharCargo(registro, 'plus')?.pago).toBe(true)
    })

    it('não deixa um cargo do admin se declarar de fábrica', () => {
      const registro = mesclarRegistroDeCargos([
        { id: 'manual-pro', nome: 'Manual Pro', embutido: true },
      ])
      expect(acharCargo(registro, 'manual-pro')?.embutido).toBe(false)
    })

    it('aceita um cargo novo ao lado dos embutidos', () => {
      const registro = mesclarRegistroDeCargos([
        { id: 'manual-pro', nome: 'Manual Pro', pago: true, ordem: 9 },
      ])
      const novo = acharCargo(registro, 'manual-pro')
      expect(novo?.nome).toBe('Manual Pro')
      expect(novo?.pago).toBe(true)
      expect(registro).toHaveLength(CARGOS_EMBUTIDOS_IDS.length + 1)
    })

    it('descarta lixo em vez de derrubar a leitura', () => {
      const registro = mesclarRegistroDeCargos([null, 42, { semId: true }, { id: '!!!' }])
      expect(registro.map(c => c.id).sort()).toEqual([...CARGOS_EMBUTIDOS_IDS].sort())
    })
  })

  describe('id do cargo', () => {
    it('transforma o nome digitado em slug', () => {
      expect(slugDeCargo('Manual Clínico Pro')).toBe('manual-clinico-pro')
      expect(slugDeCargo('  Quest+  ')).toBe('quest')
      expect(slugDeCargo('!!!')).toBe('')
    })

    it('recusa os ids que o sistema já usa para outra coisa', () => {
      for (const reservado of IDS_RESERVADOS) {
        // `plus+` e `quest+` viram outro slug ao normalizar; os demais são
        // rejeitados pelo nome exato.
        const id = slugDeCargo(reservado) || reservado
        const veredicto = validarIdDeCargo(id)
        if (IDS_RESERVADOS.includes(id)) {
          expect(veredicto.valido, reservado).toBe(false)
        }
      }
      expect(validarIdDeCargo('admin').valido).toBe(false)
      expect(validarIdDeCargo('monitor').valido).toBe(false)
      expect(validarIdDeCargo('premium').valido).toBe(false)
    })

    it('recusa id repetido e id curto demais', () => {
      expect(validarIdDeCargo('pro', ['pro']).valido).toBe(false)
      expect(validarIdDeCargo('ab').valido).toBe(false)
      expect(validarIdDeCargo('manual-pro', ['plus']).valido).toBe(true)
    })
  })

  describe('cargo novo', () => {
    it('nasce com tudo fechado e o bloco ligado', () => {
      const novo = cargoEmBranco(5)
      expect(novo.permissoes.ativo).toBe(true)
      for (const key of PLAN_FEATURE_KEYS) {
        expect(novo.permissoes.regras[key].liberado, key).toBe(false)
      }
      expect(Object.values(novo.permissoes.manualClinicoModulos).every(v => v === false)).toBe(true)
    })
  })

  describe('áreas do cargo', () => {
    it('lê do bloco quando ele está ligado', () => {
      const cargo = normalizeCargo({
        id: 'so-banco',
        nome: 'Só Banco',
        permissoes: {
          ...permissoesLiberadas(),
          ativo: true,
          regras: {
            ...permissoesLiberadas().regras,
            materiais: { liberado: false, limite: 0, periodo: 'dia' },
          },
        },
      })!
      const areas = areasDoCargo(cargo)
      expect(areas.materiais).toBe(false)
      expect(areas.bancoQuestoes).toBe(true)
    })

    it('cai no padrão do cargo quando o bloco está desligado', () => {
      // Gratuito de fábrica: bloco desligado, e o padrão do cargo não tem Banco.
      const gratuito = acharCargo(mesclarRegistroDeCargos(null), 'gratuito')!
      expect(gratuito.permissoes.ativo).toBe(false)
      expect(areasDoCargo(gratuito).bancoQuestoes).toBe(false)
      expect(areasDoCargo(gratuito).materiais).toBe(false)
    })

    it('reflete o Quest: Banco sim, o resto não', () => {
      const quest = acharCargo(mesclarRegistroDeCargos(null), 'quest')!
      const areas = areasDoCargo(quest)
      expect(areas.bancoQuestoes).toBe(true)
      expect(areas.materiais).toBe(false)
      expect(areas.manualClinico).toBe(false)
    })
  })

  describe('recorte público', () => {
    it('não vaza o bloco de permissões cru', () => {
      const publico = cargoPublico(acharCargo(mesclarRegistroDeCargos(null), 'plus')!)
      expect(publico).not.toHaveProperty('permissoes')
      expect(publico.areas.bancoQuestoes).toBe(true)
      expect(publico.nome).toBe('Plus+')
    })
  })

  describe('sanitização para gravar', () => {
    it('renumera a ordem e carimba as datas', () => {
      const cargos = sanitizarRegistroDeCargos([
        { id: 'manual-pro', nome: 'Manual Pro', ordem: 99 },
      ])
      expect(cargos.map(c => c.ordem)).toEqual(cargos.map((_, i) => i + 1))
      for (const cargo of cargos) {
        expect(cargo.atualizadoEm).toBeInstanceOf(Date)
        expect(cargo.criadoEm).toBeInstanceOf(Date)
      }
    })
  })

  describe('conversa com normalizeAccountType', () => {
    it('deixa passar o id de um cargo criado pelo admin', () => {
      // Sem isto, toda conta com cargo personalizado seria lida como gratuita.
      expect(normalizeAccountType('manual-pro')).toBe('manual-pro')
      expect(normalizeAccountType('so-banco')).toBe('so-banco')
    })

    it('continua traduzindo os aliases legados e barrando lixo', () => {
      expect(normalizeAccountType('premium')).toBe('plus')
      expect(normalizeAccountType('essential')).toBe('plus')
      expect(normalizeAccountType('QUEST+')).toBe('quest')
      expect(normalizeAccountType('não é slug!')).toBe('gratuito')
      expect(normalizeAccountType('')).toBe('gratuito')
      expect(normalizeAccountType(null)).toBe('gratuito')
    })

    it('acha o cargo de uma conta gravada com alias legado', () => {
      const registro = mesclarRegistroDeCargos(null)
      expect(acharCargo(registro, normalizeAccountType('premium'))?.id).toBe('plus')
    })
  })
})
