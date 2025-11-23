// Som de notificação em formato data URL (arquivo WAV pequeno com tom de sino)
// Este é um som simples e suave de notificação
export const notificationSound = (() => {
  if (typeof window === 'undefined') return null

  // Criar um AudioContext
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  return {
    play: () => {
      try {
        // Criar oscilador para um tom de sino suave
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Configurar tom (frequências de sino: 800Hz e 1000Hz)
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1)

        // Volume baixo e fade out
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime) // Volume bem baixo
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        // Tocar por 300ms
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.error('Erro ao tocar som de notificação:', error)
      }
    }
  }
})()
