// ────────────────────────────────────────────────────────────────────────────
// Registro de adapters de canal (padrão Strategy).
//
// Para adicionar um canal novo (SMS, push): crie o adapter em ./channels/ e
// registre-o aqui. O dispatcher e o orquestrador passam a suportá-lo sem
// nenhuma outra mudança.
// ────────────────────────────────────────────────────────────────────────────

import { emailAdapter } from './channels/email'
import { whatsappAdapter } from './channels/whatsapp'
import type { ChannelAdapter, CommChannel } from './types'

const adapters: Partial<Record<CommChannel, ChannelAdapter>> = {
    email: emailAdapter,
    whatsapp: whatsappAdapter,
}

export function getAdapter(channel: CommChannel): ChannelAdapter | undefined {
    return adapters[channel]
}

export function registeredChannels(): CommChannel[] {
    return Object.keys(adapters) as CommChannel[]
}
