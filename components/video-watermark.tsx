'use client'

import React from 'react'

interface VideoWatermarkProps {
  userName: string
  userCpf: string
  children: React.ReactNode
  opacity?: number // 0-100, padrão 8
  rotation?: number // graus, padrão -45
}

export function VideoWatermark({ 
  userName, 
  userCpf, 
  children,
  opacity = 8,
  rotation = -45
}: VideoWatermarkProps) {
  const opacityValue = opacity / 100

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      {/* Conteúdo do vídeo */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Marca d'água anti-pirateamento */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: opacityValue }}
      >
        {/* Marca d'água central grande */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="font-bold text-center whitespace-nowrap"
            style={{
              transform: `rotate(${rotation}deg)`,
              fontSize: 'clamp(40px, 8vw, 100px)',
              fontWeight: 'bold',
              lineHeight: '1.1',
              pointerEvents: 'none',
              color: '#1a1a1a',
              textShadow: '0 1px 2px rgba(255,255,255,0.5)',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
            }}
          >
            <div>{userName}</div>
            <div style={{ fontSize: 'clamp(30px, 6vw, 75px)', marginTop: '4px' }}>
              {userCpf}
            </div>
          </div>
        </div>

        {/* Marca d'água repetida em grid (9 posições) */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center font-bold"
              style={{
                transform: `rotate(${rotation}deg)`,
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                textAlign: 'center',
                pointerEvents: 'none',
                color: '#1a1a1a',
                textShadow: '0 0.5px 1px rgba(255,255,255,0.5)',
                filter: 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.1))',
              }}
            >
              <div className="font-bold leading-tight">{userName}</div>
              <div className="text-xs leading-tight">{userCpf}</div>
            </div>
          ))}
        </div>

        {/* Linha diagonal decorativa */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        >
          <line
            x1="0"
            y1="0"
            x2="1920"
            y2="1080"
            stroke="#1a1a1a"
            strokeWidth="2"
            opacity="0.05"
          />
          <line
            x1="1920"
            y1="0"
            x2="0"
            y2="1080"
            stroke="#1a1a1a"
            strokeWidth="2"
            opacity="0.05"
          />
        </svg>
      </div>

      {/* Aviso visual (opcional) */}
      <div className="absolute bottom-2 right-2 text-xs pointer-events-none" style={{ color: '#1a1a1a', opacity: 0.3 }}>
        🔒 Protegido
      </div>
    </div>
  )
}
