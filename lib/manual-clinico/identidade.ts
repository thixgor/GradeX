/**
 * O identificador do Manual Clínico como PRODUTO — sem tocar no banco.
 *
 * O id já existia em `lib/manual-clinico-product.ts`, mas aquele módulo abre
 * com `import { Db, ObjectId } from 'mongodb'`: importá-lo de um componente de
 * cliente arrastaria o driver do Mongo para dentro do pacote do navegador. A
 * saída até aqui era cada tela de compra redeclarar a string por conta própria
 * (`const MANUAL_CLINICO_PRODUCT_ID = 'manual-clinico-premium'` aparecia em
 * `/comprar` e no checkout do Manual, copiado à mão) — e cópia envelhece: o dia
 * em que o id mudar, uma das telas continua pedindo o produto antigo e o
 * chamativo do desconto simplesmente some sem ninguém entender por quê.
 *
 * Este arquivo é puro de propósito: sem dependência nenhuma, ele pode ser
 * importado dos dois lados. `lib/manual-clinico-product.ts` reexporta daqui,
 * então continua havendo UM valor.
 */
export const MANUAL_CLINICO_PRODUCT_ID = 'manual-clinico-premium' as const
export const MANUAL_CLINICO_PRODUCT_TYPE = 'manual_clinico' as const
