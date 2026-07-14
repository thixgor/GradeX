'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { WallKey } from './conduction-system'

interface Props {
  rate: number
  dark: boolean
  highlightWalls?: WallKey[]
  arteryLabel?: string
  ectopicOrigin?: { x: number; y: number; label: string } | null
  axisDeg?: number
  axisLabel?: string
  abnormalConduction?: boolean
}

// Fases da despolarização (fração do ciclo) — mesma sequência do esquema 2D.
const SEQ = [
  { id: 'sa', t: 0.0 },
  { id: 'atria', t: 0.06 },
  { id: 'av', t: 0.2 },
  { id: 'his', t: 0.3 },
  { id: 'lbb', t: 0.38 },
  { id: 'rbb', t: 0.38 },
  { id: 'purkinje', t: 0.46 },
  { id: 'ventricles', t: 0.54 },
]

const WALL_POS: Record<string, [number, number, number]> = {
  anterior: [0.35, -0.5, 1.15],
  septal: [-0.45, -0.5, 0.15],
  inferior: [0.35, -1.7, 0.2],
  lateral: [1.6, -0.5, 0.15],
  posterior: [0.35, -0.5, -1.15],
  rv: [-1.2, -0.5, 0.8],
  lv: [0.9, -0.7, 0.4],
}

/**
 * Coração 3D em WebGL (three.js). Miocárdio translúcido com o sistema de
 * condução luminoso por dentro, frente de despolarização animada em tempo real,
 * vetor elétrico, realce de parede/artéria (IAM) e origem de arritmia.
 * Geometria construída proceduralmente (câmaras + grandes vasos) — sem imagens.
 */
export function Heart3D(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  // props num ref para o loop de animação sempre ler o valor atual
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      return
    }
    let disposed = false
    const width = mount.clientWidth || 320
    const height = 340
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.2, 9)
    camera.lookAt(0, -0.3, 0)

    // ── iluminação ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const hemi = new THREE.HemisphereLight(0xffd9d9, 0x101018, 0.6)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(4, 6, 8)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x6699ff, 0.5)
    rim.position.set(-6, -2, -6)
    scene.add(rim)

    // ── grupo do coração (inclinação anatômica: ápice p/ baixo-frente-esquerda) ──
    const heart = new THREE.Group()
    heart.rotation.z = -0.28
    heart.rotation.x = 0.18
    scene.add(heart)

    const myoMat = (color: number) => new THREE.MeshStandardMaterial({
      color, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0.30,
      depthWrite: false, side: THREE.DoubleSide, emissive: new THREE.Color(color).multiplyScalar(0.15),
    })

    const sphere = (rx: number, ry: number, rz: number, pos: [number, number, number], mat: THREE.Material) => {
      const g = new THREE.SphereGeometry(1, 40, 32)
      g.scale(rx, ry, rz)
      const m = new THREE.Mesh(g, mat)
      m.position.set(...pos)
      return m
    }

    // câmaras (elipsoides) — VE grande com ápice, VD anterior menor, átrios na base
    const lvMat = myoMat(0xb23b3b)
    const rvMat = myoMat(0x9a4b6b)
    const laMat = myoMat(0xa85a5a)
    const raMat = myoMat(0x8f5570)
    const lv = sphere(1.35, 1.75, 1.35, [0.35, -0.55, 0], lvMat)
    const rv = sphere(1.05, 1.5, 1.15, [-1.05, -0.35, 0.55], rvMat)
    const la = sphere(0.9, 0.8, 0.9, [0.7, 1.45, -0.35], laMat)
    const ra = sphere(0.95, 0.9, 0.95, [-1.15, 1.35, 0.2], raMat)
    heart.add(lv, rv, la, ra)

    // grandes vasos (tubos)
    const vesselMat = new THREE.MeshStandardMaterial({ color: 0xc9c2b8, roughness: 0.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    const pulmMat = new THREE.MeshStandardMaterial({ color: 0x8aa0c0, roughness: 0.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.9, 0.1), new THREE.Vector3(0.25, 2.1, 0.05),
      new THREE.Vector3(0.0, 2.9, -0.1), new THREE.Vector3(-0.7, 2.7, -0.5),
      new THREE.Vector3(-0.9, 1.9, -0.6),
    ])
    heart.add(new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 40, 0.36, 16, false), vesselMat))
    const pulmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0.9, 0.7), new THREE.Vector3(-0.7, 2.0, 0.4),
      new THREE.Vector3(0.1, 2.5, 0.2), new THREE.Vector3(0.7, 2.2, -0.1),
    ])
    heart.add(new THREE.Mesh(new THREE.TubeGeometry(pulmCurve, 40, 0.3, 16, false), pulmMat))
    // veias cavas (stubs)
    heart.add(sphere(0.28, 0.6, 0.28, [-1.5, 2.3, 0.2], vesselMat))
    heart.add(sphere(0.3, 0.5, 0.3, [-1.4, 0.2, 0.2], vesselMat))

    // ── sistema de condução (nós + feixes luminosos) ──
    const nodeMat = () => new THREE.MeshStandardMaterial({ color: 0x2fe08a, emissive: 0x2fe08a, emissiveIntensity: 0.3, roughness: 0.4 })
    const P = {
      sa: new THREE.Vector3(-1.55, 1.95, 0.55),
      av: new THREE.Vector3(-0.35, 0.55, 0.15),
      his: new THREE.Vector3(-0.2, 0.05, 0.2),
      split: new THREE.Vector3(-0.2, -0.15, 0.2),
      lv: new THREE.Vector3(0.5, -1.4, 0.0),
      rv: new THREE.Vector3(-1.0, -1.2, 0.7),
    }
    const nodes: Record<string, THREE.Mesh> = {}
    const mkNode = (id: string, p: THREE.Vector3, r: number) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), nodeMat())
      m.position.copy(p); heart.add(m); nodes[id] = m; return m
    }
    mkNode('sa', P.sa, 0.16)
    mkNode('av', P.av, 0.14)

    const beam = (a: THREE.Vector3, b: THREE.Vector3, mid?: THREE.Vector3, r = 0.05) => {
      const curve = new THREE.CatmullRomCurve3(mid ? [a, mid, b] : [a, b])
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 10, false),
        new THREE.MeshStandardMaterial({ color: 0x2fe08a, emissive: 0x2fe08a, emissiveIntensity: 0.25, roughness: 0.4 }))
      heart.add(mesh); return mesh
    }
    // internodal/atrial (SA→AV), His, ramos
    const atrialBeam = beam(P.sa, P.av, new THREE.Vector3(-1.0, 1.3, 0.4), 0.045)
    const hisBeam = beam(P.av, P.his, undefined, 0.06)
    const lbb = beam(P.his, P.lv, new THREE.Vector3(0.1, -0.5, 0.05), 0.05)
    const rbb = beam(P.his, P.rv, new THREE.Vector3(-0.6, -0.5, 0.45), 0.05)
    // Purkinje: pequenas ramificações
    const purkinje: THREE.Mesh[] = []
    const spread = (base: THREE.Vector3, dirs: [number, number, number][]) => {
      for (const d of dirs) {
        const end = base.clone().add(new THREE.Vector3(...d))
        purkinje.push(beam(base, end, undefined, 0.03))
      }
    }
    spread(P.lv, [[0.5, -0.4, 0.3], [0.2, -0.5, -0.4], [0.7, -0.2, -0.1]])
    spread(P.rv, [[-0.4, -0.4, 0.3], [-0.1, -0.5, 0.4], [-0.6, -0.2, 0.1]])

    // ── marcadores de parede (IAM) ──
    const wallMarkers: Record<string, THREE.Mesh> = {}
    for (const [k, pos] of Object.entries(WALL_POS)) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }))
      m.position.set(...pos); m.visible = false; heart.add(m); wallMarkers[k] = m
    }

    // ── origem ectópica ──
    const ectopic = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 }))
    ectopic.visible = false
    heart.add(ectopic)

    // ── frente de despolarização (esfera luminosa que percorre o sistema) ──
    const front = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xeafff3 }))
    heart.add(front)
    const frontPath = new THREE.CatmullRomCurve3([P.sa, new THREE.Vector3(-1.0, 1.3, 0.4), P.av, P.his, P.split, P.lv])

    // ── vetor elétrico ──
    let arrow: THREE.ArrowHelper | null = null

    // ── interação: arrastar p/ girar, roda p/ zoom ──
    let dragging = false, px = 0, py = 0
    let targetRX = 0.18, targetRY = 0, baseRX = 0.18
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY }
    const onUp = () => { dragging = false }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      targetRY += (e.clientX - px) * 0.01
      targetRX = Math.max(-1.0, Math.min(1.2, targetRX + (e.clientY - py) * 0.01))
      px = e.clientX; py = e.clientY
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      camera.position.z = Math.max(5.5, Math.min(15, camera.position.z + e.deltaY * 0.01))
    }
    const el = renderer.domElement
    el.style.touchAction = 'none'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('wheel', onWheel, { passive: false })

    // ── resize ──
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || width
      renderer.setSize(w, height)
      camera.aspect = w / height
      camera.updateProjectionMatrix()
    })
    ro.observe(mount)

    const clock = new THREE.Clock()
    let raf = 0
    const stageIntensity = (id: string, phase: number) => {
      const s = SEQ.find((x) => x.id === id)
      if (!s) return 0.25
      const next = SEQ[SEQ.indexOf(s) + 1]?.t ?? s.t + 0.14
      return phase >= s.t && phase < next + 0.05 ? 1.4 : 0.22
    }

    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const p = propsRef.current
      const t = clock.getElapsedTime()
      const cycle = 60 / Math.max(30, p.rate || 60)
      const phase = (t % cycle) / cycle

      // rotação automática lenta + arrasto do usuário
      if (!dragging) targetRY += 0.0016
      heart.rotation.y += (targetRY - heart.rotation.y) * 0.1
      heart.rotation.x += (targetRX - heart.rotation.x) * 0.1

      // acende nós/feixes conforme a fase
      const abn = p.abnormalConduction
      ;(nodes.sa.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.2 : stageIntensity('sa', phase)
      ;(nodes.av.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.2 : stageIntensity('av', phase)
      ;(atrialBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.15 : stageIntensity('atria', phase)
      ;(hisBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = stageIntensity('his', phase)
      ;(lbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageIntensity('lbb', phase)
      ;(rbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageIntensity('rbb', phase)
      const pk = stageIntensity('purkinje', phase)
      for (const f of purkinje) (f.material as THREE.MeshStandardMaterial).emissiveIntensity = pk

      // "blush" das câmaras: átrios na sístole atrial, ventrículos no QRS
      const atrialGlow = phase > 0.04 && phase < 0.2 ? 0.5 : 0.15
      const ventGlow = phase > 0.44 && phase < 0.72 ? 0.6 : 0.15
      ;(laMat.emissive as THREE.Color).setScalar(0); laMat.emissiveIntensity = atrialGlow; laMat.emissive.setHex(0xa85a5a)
      raMat.emissiveIntensity = atrialGlow
      lvMat.emissiveIntensity = ventGlow
      rvMat.emissiveIntensity = ventGlow

      // frente de despolarização percorrendo o caminho
      if (!abn) {
        const fp = Math.min(0.999, Math.max(0, (phase - 0.0) / 0.55))
        front.visible = phase < 0.6
        frontPath.getPoint(fp, front.position)
      } else {
        front.visible = false
      }

      // realce de parede
      const walls = p.highlightWalls || []
      for (const [k, m] of Object.entries(wallMarkers)) {
        const on = walls.includes(k as WallKey)
        m.visible = on
        if (on) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 0.5 * Math.abs(Math.sin(t * 3))
      }
      // tinge câmara conforme a parede
      const lvInfarct = walls.some((w) => ['anterior', 'septal', 'inferior', 'lateral', 'posterior', 'lv'].includes(w))
      lvMat.color.setHex(lvInfarct ? 0xd23b3b : 0xb23b3b)
      if (lvInfarct) lvMat.emissiveIntensity = Math.max(lvMat.emissiveIntensity, 0.35 + 0.25 * Math.abs(Math.sin(t * 3)))
      rvMat.color.setHex(walls.includes('rv') ? 0xd23b6b : 0x9a4b6b)

      // origem ectópica
      if (p.ectopicOrigin) {
        ectopic.visible = true
        const ex = -1.6 + p.ectopicOrigin.x * 3.2
        const ey = 2.2 - p.ectopicOrigin.y * 4.0
        ectopic.position.set(ex, ey, 0.4)
        ectopic.scale.setScalar(0.8 + 0.4 * Math.abs(Math.sin(t * 4)))
      } else ectopic.visible = false

      // vetor elétrico (plano frontal do grupo)
      if (typeof p.axisDeg === 'number') {
        const rad = (p.axisDeg * Math.PI) / 180
        const dir = new THREE.Vector3(Math.cos(rad), -Math.sin(rad), 0).normalize()
        if (!arrow) {
          arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0.1, -0.3, 0), 2.4, 0x38bdf8, 0.5, 0.3)
          heart.add(arrow)
        } else {
          arrow.setDirection(dir)
        }
      } else if (arrow) { arrow.visible = false }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('wheel', onWheel)
      scene.traverse((o) => {
        const any = o as any
        if (any.geometry) any.geometry.dispose?.()
        if (any.material) {
          const mats = Array.isArray(any.material) ? any.material : [any.material]
          for (const m of mats) m.dispose?.()
        }
      })
      renderer.dispose()
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    // recria a cena apenas quando o tema muda (cores de fundo/estilo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dark])

  if (failed) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-lg border border-white/10 text-center text-xs text-muted-foreground">
        WebGL indisponível neste dispositivo. Use a visualização 2D.
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full cursor-grab overflow-hidden rounded-lg active:cursor-grabbing" style={{ height: 340 }} />
      <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/40 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
        Arraste para girar · role para aproximar
      </div>
    </div>
  )
}
