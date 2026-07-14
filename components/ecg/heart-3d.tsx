'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
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

const SEQ = [
  { id: 'sa', t: 0.0 }, { id: 'atria', t: 0.06 }, { id: 'av', t: 0.2 },
  { id: 'his', t: 0.3 }, { id: 'lbb', t: 0.38 }, { id: 'rbb', t: 0.38 },
  { id: 'purkinje', t: 0.46 }, { id: 'ventricles', t: 0.54 },
]

const WALL_POS: Record<string, [number, number, number]> = {
  anterior: [0.4, -0.4, 1.5], septal: [-0.4, -0.5, 0.5], inferior: [0.35, -1.9, 0.3],
  lateral: [1.7, -0.5, 0.1], posterior: [0.35, -0.5, -1.5], rv: [-1.3, -0.4, 1.0], lv: [1.0, -0.7, 0.6],
}

// marcadores anatômicos (coordenadas locais do coração)
const LABELS: { k: string; t: string; p: [number, number, number] }[] = [
  { k: 'aorta', t: 'Aorta', p: [-0.55, 2.9, -0.5] },
  { k: 'pa', t: 'Artéria pulmonar', p: [0.75, 2.6, -0.05] },
  { k: 'vcs', t: 'Veia cava sup.', p: [-1.55, 2.5, 0.2] },
  { k: 'ra', t: 'Átrio direito', p: [-1.55, 1.5, 0.6] },
  { k: 'la', t: 'Átrio esquerdo', p: [1.1, 1.7, -0.3] },
  { k: 'rv', t: 'Ventrículo direito', p: [-1.45, -0.5, 1.0] },
  { k: 'lv', t: 'Ventrículo esquerdo', p: [1.75, -0.6, 0.4] },
  { k: 'apex', t: 'Ápice', p: [0.35, -2.55, 0.2] },
  { k: 'sa', t: 'Nó sinoatrial (SA)', p: [-1.55, 2.05, 0.6] },
  { k: 'av', t: 'Nó AV', p: [-0.35, 0.55, 0.25] },
  { k: 'lad', t: 'Coronária (DA)', p: [0.15, -0.8, 1.5] },
]

const noise = new ImprovedNoise()

function organicBlob(rx: number, ry: number, rz: number, apex = 0, wobble = 0.1, seg = 72) {
  const geo = new THREE.SphereGeometry(1, seg, Math.floor(seg * 0.7))
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    let taper = 1
    if (apex > 0 && v.y < 0) taper = 1 - apex * (-v.y)
    const n = noise.noise(v.x * 1.8 + 5, v.y * 1.8, v.z * 1.8) * wobble
    const s = 1 + n
    const y = v.y < 0 && apex > 0 ? v.y * (1 + apex * 0.35) : v.y
    pos.setXYZ(i, v.x * rx * taper * s, y * ry * s, v.z * rz * taper * s)
  }
  geo.computeVertexNormals()
  return geo
}

/** Textura de relevo procedural (fibras/superfície do miocárdio). */
function makeBumpTexture() {
  const s = 256
  const c = document.createElement('canvas'); c.width = c.height = s
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(s, s)
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let val = 0, amp = 1, f = 0.05
    for (let o = 0; o < 4; o++) { val += amp * noise.noise(x * f, y * f, 3.3); f *= 2.1; amp *= 0.5 }
    // leve anisotropia vertical (fibras)
    val += 0.15 * Math.sin(y * 0.5 + noise.noise(x * 0.15, y * 0.15, 1) * 3)
    const g = Math.max(0, Math.min(255, Math.floor(150 + val * 90)))
    const i = (y * s + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = g; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3)
  return t
}

/**
 * Coração 3D procedural realista: miocárdio opaco com relevo (bump procedural),
 * gordura epicárdica, coronárias e grandes vasos com cores anatômicas,
 * sistema de condução que acende em sequência, contração e marcadores rotulados.
 */
export function Heart3D(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const labelLayerRef = useRef<HTMLDivElement>(null)
  const labelEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const [failed, setFailed] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const labelsOnRef = useRef(true)
  labelsOnRef.current = showLabels
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }) }
    catch { setFailed(true); return }
    let disposed = false
    let curW = mount.clientWidth || 340
    let curH = 380
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(curW, curH)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const bg = document.createElement('canvas'); bg.width = 16; bg.height = 256
    const bx = bg.getContext('2d')!
    const gr = bx.createLinearGradient(0, 0, 0, 256)
    gr.addColorStop(0, '#161a20'); gr.addColorStop(1, '#0a0d11')
    bx.fillStyle = gr; bx.fillRect(0, 0, 16, 256)
    const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace
    scene.background = bgTex

    const camera = new THREE.PerspectiveCamera(40, curW / curH, 0.1, 100)
    camera.position.set(0, 0.3, 9.5)
    camera.lookAt(0, -0.3, 0)

    // iluminação suave e realista
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    scene.add(new THREE.HemisphereLight(0xffe6e0, 0x0c1014, 0.55))
    const key = new THREE.DirectionalLight(0xfff2ec, 1.15); key.position.set(4, 6, 7); scene.add(key)
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35); fill.position.set(-5, 1, 4); scene.add(fill)
    const rim = new THREE.DirectionalLight(0x88a8ff, 0.4); rim.position.set(-4, -2, -6); scene.add(rim)

    const heart = new THREE.Group()
    heart.rotation.z = -0.26; heart.rotation.x = 0.14
    scene.add(heart)

    const bumpTex = makeBumpTexture()

    // ── miocárdio (opaco, realista, com relevo) ──
    const myoMat = (hex: number) => new THREE.MeshStandardMaterial({
      color: hex, roughness: 0.74, metalness: 0.02,
      bumpMap: bumpTex, bumpScale: 0.05,
      emissive: new THREE.Color(0x300808), emissiveIntensity: 0.12,
      transparent: true, opacity: 0.9, side: THREE.FrontSide,
    })
    const lvMat = myoMat(0x9c3636); lvMat.userData.baseHex = 0x9c3636
    const rvMat = myoMat(0x93374a); rvMat.userData.baseHex = 0x93374a
    const laMat = myoMat(0xa24848); laMat.userData.baseHex = 0xa24848
    const raMat = myoMat(0x9c4a58); raMat.userData.baseHex = 0x9c4a58
    const chamberMats = [lvMat, rvMat, laMat, raMat]

    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], ro = 2) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.renderOrder = ro; return m
    }
    const lv = mesh(organicBlob(1.5, 1.85, 1.45, 0.42), lvMat, [0.35, -0.5, 0])
    const rv = mesh(organicBlob(1.15, 1.6, 1.2, 0.25), rvMat, [-1.0, -0.3, 0.55])
    const la = mesh(organicBlob(0.95, 0.85, 0.95, 0), laMat, [0.75, 1.5, -0.4])
    const ra = mesh(organicBlob(1.0, 0.95, 1.0, 0), raMat, [-1.15, 1.4, 0.2])
    heart.add(lv, rv, la, ra)
    const ventMeshes = [lv, rv]; const atrialMeshes = [la, ra]

    // ── gordura epicárdica (tecido creme nos sulcos) ──
    const fatMat = new THREE.MeshStandardMaterial({ color: 0xe4d6b0, roughness: 0.85, metalness: 0, bumpMap: bumpTex, bumpScale: 0.03 })
    const fat = (rx: number, ry: number, rz: number, p: [number, number, number]) => heart.add(mesh(organicBlob(rx, ry, rz, 0, 0.18, 40), fatMat, p, 3))
    fat(0.55, 0.5, 0.45, [-0.15, 0.55, 1.15])
    fat(0.4, 0.7, 0.4, [-0.5, -0.3, 1.25])
    fat(0.35, 0.4, 0.4, [0.9, 0.5, 0.9])

    // ── grandes vasos ──
    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xc99a86, roughness: 0.6, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.03 })
    const pulmMat = new THREE.MeshStandardMaterial({ color: 0xb894a0, roughness: 0.6, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.03 })
    const cavaMat = new THREE.MeshStandardMaterial({ color: 0x9fb0c0, roughness: 0.62, metalness: 0.02 })
    const tube = (pts: number[][], r: number, mat: THREE.Material) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
      return new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 20, false), mat)
    }
    heart.add(tube([[0.2, 1.0, 0.1], [0.3, 2.2, 0.05], [0.05, 3.15, -0.1], [-0.7, 2.95, -0.55], [-1.0, 2.0, -0.6]], 0.34, aortaMat))
    heart.add(tube([[-0.9, 1.0, 0.7], [-0.6, 2.2, 0.4], [0.2, 2.75, 0.2], [0.85, 2.45, -0.05]], 0.3, pulmMat))
    heart.add(tube([[-1.5, 2.55, 0.2], [-1.4, 1.6, 0.2]], 0.24, cavaMat))
    heart.add(tube([[-1.4, -0.2, 0.2], [-1.3, -1.0, 0.2]], 0.26, cavaMat))

    // ── coronárias (realistas, destacáveis) ──
    const coronMat = () => new THREE.MeshStandardMaterial({ color: 0x8f3232, roughness: 0.45, metalness: 0.05, emissive: 0x1a0505, emissiveIntensity: 0.3 })
    const lad = tube([[0.15, 1.7, 1.28], [0.05, 0.6, 1.55], [0.15, -0.8, 1.4], [0.25, -2.3, 0.7]], 0.065, coronMat())
    const lcx = tube([[0.35, 1.7, 0.98], [1.1, 1.2, 0.58], [1.78, 0.1, -0.2], [1.5, -0.7, -0.5]], 0.06, coronMat())
    const rca = tube([[-1.0, 1.7, 0.98], [-1.72, 0.7, 0.3], [-1.62, -0.4, -0.3], [-1.1, -1.2, -0.5]], 0.06, coronMat())
    // ramos menores
    const ladD = tube([[0.15, 0.3, 1.5], [0.9, 0.1, 1.15], [1.35, -0.4, 0.6]], 0.04, coronMat())
    heart.add(lad, lcx, rca, ladD)
    const coronaries: { mesh: THREE.Mesh; keys: string[] }[] = [
      { mesh: lad, keys: ['descendente anterior', 'da', 'lad', 'diagonal'] },
      { mesh: ladD, keys: ['diagonal', 'descendente anterior', 'da', 'lad'] },
      { mesh: lcx, keys: ['circunflexa', 'cx', 'marginal'] },
      { mesh: rca, keys: ['direita', 'cd', 'rca'] },
    ]

    // ── sistema de condução (glow controlado; visível através do miocárdio) ──
    const P = {
      sa: new THREE.Vector3(-1.55, 2.0, 0.6), av: new THREE.Vector3(-0.35, 0.5, 0.2),
      his: new THREE.Vector3(-0.2, 0.0, 0.25), lv: new THREE.Vector3(0.5, -1.6, 0.1), rv: new THREE.Vector3(-1.0, -1.3, 0.75),
    }
    const condMat = () => new THREE.MeshStandardMaterial({ color: 0x2fe0a0, emissive: 0x2fe0a0, emissiveIntensity: 0.35, roughness: 0.3, toneMapped: false, transparent: true, opacity: 0.95 })
    const nodes: Record<string, THREE.Mesh> = {}
    const mkNode = (id: string, p: THREE.Vector3, r: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), condMat()); m.position.copy(p); m.renderOrder = 5; heart.add(m); nodes[id] = m }
    mkNode('sa', P.sa, 0.15); mkNode('av', P.av, 0.13)
    const beam = (a: THREE.Vector3, b: THREE.Vector3, mid: THREE.Vector3 | undefined, r: number) => {
      const c = new THREE.CatmullRomCurve3(mid ? [a, mid, b] : [a, b])
      const m = new THREE.Mesh(new THREE.TubeGeometry(c, 26, r, 10, false), condMat()); m.renderOrder = 5; heart.add(m); return m
    }
    const atrialBeam = beam(P.sa, P.av, new THREE.Vector3(-1.0, 1.3, 0.45), 0.045)
    const hisBeam = beam(P.av, P.his, undefined, 0.06)
    const lbb = beam(P.his, P.lv, new THREE.Vector3(0.1, -0.6, 0.05), 0.05)
    const rbb = beam(P.his, P.rv, new THREE.Vector3(-0.6, -0.6, 0.5), 0.05)
    const purkinje: THREE.Mesh[] = []
    const spread = (base: THREE.Vector3, dirs: number[][]) => { for (const d of dirs) purkinje.push(beam(base, base.clone().add(new THREE.Vector3(d[0], d[1], d[2])), undefined, 0.028)) }
    spread(P.lv, [[0.6, -0.4, 0.35], [0.25, -0.5, -0.45], [0.85, -0.15, -0.1]])
    spread(P.rv, [[-0.5, -0.4, 0.35], [-0.1, -0.55, 0.45], [-0.7, -0.2, 0.15]])

    // frente de ativação (marcador discreto)
    const front = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd8fff0, toneMapped: false }))
    front.renderOrder = 6; heart.add(front)
    const frontPath = new THREE.CatmullRomCurve3([P.sa, new THREE.Vector3(-1.0, 1.3, 0.45), P.av, P.his, new THREE.Vector3(-0.2, -0.2, 0.25), P.lv])

    // marcadores de parede (IAM)
    const wallMarkers: Record<string, THREE.Mesh> = {}
    for (const [k, pos] of Object.entries(WALL_POS)) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2323, emissiveIntensity: 0.7, transparent: true, opacity: 0.9, toneMapped: false }))
      m.position.set(...pos); m.visible = false; m.renderOrder = 6; heart.add(m); wallMarkers[k] = m
    }
    const ectopic = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffc23a, emissive: 0xffb020, emissiveIntensity: 0.9, toneMapped: false }))
    ectopic.visible = false; ectopic.renderOrder = 6; heart.add(ectopic)

    // ── bloom sutil (só o sistema de condução, muito brilhante, floresce) ──
    let composer: EffectComposer | null = null
    try {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(curW, curH), 0.35, 0.4, 0.82))
      composer.addPass(new OutputPass())
      composer.setSize(curW, curH)
    } catch { composer = null }

    let arrow: THREE.ArrowHelper | null = null

    // interação
    let dragging = false, lx = 0, ly = 0, targetRX = 0.14, targetRY = 0
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY }
    const onUp = () => { dragging = false }
    const onMove = (e: PointerEvent) => { if (!dragging) return; targetRY += (e.clientX - lx) * 0.01; targetRX = Math.max(-1.0, Math.min(1.2, targetRX + (e.clientY - ly) * 0.01)); lx = e.clientX; ly = e.clientY }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); camera.position.z = Math.max(6, Math.min(15, camera.position.z + e.deltaY * 0.01)) }
    const el = renderer.domElement; el.style.touchAction = 'none'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('wheel', onWheel, { passive: false })

    const ro = new ResizeObserver(() => {
      curW = mount.clientWidth || curW
      renderer.setSize(curW, curH); composer?.setSize(curW, curH)
      camera.aspect = curW / curH; camera.updateProjectionMatrix()
    })
    ro.observe(mount)

    // marcadores rotulados (projeção 3D → HTML)
    const labelVecs = LABELS.map((l) => ({ k: l.k, v: new THREE.Vector3(...l.p) }))
    const tmp = new THREE.Vector3()

    const clock = new THREE.Clock()
    let raf = 0
    const stageOn = (id: string, phase: number) => {
      const s = SEQ.find((x) => x.id === id); if (!s) return 0.32
      const next = SEQ[SEQ.indexOf(s) + 1]?.t ?? s.t + 0.14
      return phase >= s.t && phase < next + 0.05 ? 1.6 : 0.3
    }

    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const p = propsRef.current
      const t = clock.getElapsedTime()
      const cycle = 60 / Math.max(30, p.rate || 60)
      const phase = (t % cycle) / cycle
      const abn = p.abnormalConduction

      if (!dragging) targetRY += 0.0015
      heart.rotation.y += (targetRY - heart.rotation.y) * 0.1
      heart.rotation.x += (targetRX - heart.rotation.x) * 0.1
      heart.updateMatrixWorld()

      // condução acende em sequência
      ;(nodes.sa.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('sa', phase)
      ;(nodes.av.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('av', phase)
      ;(atrialBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.18 : stageOn('atria', phase)
      ;(hisBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('his', phase)
      ;(lbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('lbb', phase)
      ;(rbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('rbb', phase)
      const pk = stageOn('purkinje', phase)
      for (const f of purkinje) (f.material as THREE.MeshStandardMaterial).emissiveIntensity = pk

      // "blush" discreto das câmaras (ativação) + contração
      const atriaGlow = phase > 0.05 && phase < 0.2 && !abn ? 0.4 : 0.12
      const ventGlow = phase > 0.44 && phase < 0.72 ? 0.45 : 0.12
      for (const m of atrialMeshes) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = atriaGlow
      const ventSys = phase > 0.5 && phase < 0.82 ? Math.sin(((phase - 0.5) / 0.32) * Math.PI) : 0
      const vs = 1 - 0.05 * ventSys
      for (const vm of ventMeshes) { vm.scale.setScalar(vs); (vm.material as THREE.MeshStandardMaterial).emissiveIntensity = ventGlow }
      const atrSys = phase > 0.05 && phase < 0.2 ? Math.sin(((phase - 0.05) / 0.15) * Math.PI) : 0
      for (const am of atrialMeshes) am.scale.setScalar(1 - 0.04 * atrSys)

      // frente de ativação
      if (!abn) { const fp = Math.min(0.999, Math.max(0, phase / 0.55)); front.visible = phase < 0.6; frontPath.getPoint(fp, front.position) }
      else front.visible = false

      // realce de parede + tinte de câmara
      const walls = p.highlightWalls || []
      for (const [k, m] of Object.entries(wallMarkers)) {
        const on = walls.includes(k as WallKey); m.visible = on
        if (on) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.5 * Math.abs(Math.sin(t * 3))
      }
      const lvInfarct = walls.some((w) => ['anterior', 'septal', 'inferior', 'lateral', 'posterior', 'lv'].includes(w))
      lvMat.color.setHex(lvInfarct ? 0xba3838 : 0x9c3636)
      rvMat.color.setHex(walls.includes('rv') ? 0xba385a : 0x93374a)

      // artéria culpada
      const al = (p.arteryLabel || '').toLowerCase()
      for (const c of coronaries) {
        const hit = !!p.arteryLabel && c.keys.some((k) => al.includes(k))
        const mat = c.mesh.material as THREE.MeshStandardMaterial
        mat.emissive.setHex(hit ? 0xff2a2a : 0x1a0505)
        mat.emissiveIntensity = hit ? 0.7 + 0.5 * Math.abs(Math.sin(t * 3)) : 0.3
        mat.color.setHex(hit ? 0xff5555 : 0x8f3232)
      }

      // origem ectópica
      if (p.ectopicOrigin) {
        ectopic.visible = true
        ectopic.position.set(-1.6 + p.ectopicOrigin.x * 3.2, 2.3 - p.ectopicOrigin.y * 4.2, 0.8)
        ectopic.scale.setScalar(0.85 + 0.4 * Math.abs(Math.sin(t * 4)))
      } else ectopic.visible = false

      // vetor elétrico
      if (typeof p.axisDeg === 'number') {
        const rad = (p.axisDeg * Math.PI) / 180
        const dir = new THREE.Vector3(Math.cos(rad), -Math.sin(rad), 0).normalize()
        if (!arrow) { arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0.1, -0.2, 0), 2.5, 0x49b6ff, 0.5, 0.3); (arrow.line.material as THREE.Material).toneMapped = false; heart.add(arrow) }
        else { arrow.visible = true; arrow.setDirection(dir) }
      } else if (arrow) arrow.visible = false

      if (composer) composer.render(); else renderer.render(scene, camera)

      // rótulos anatômicos (projeção)
      const layerOn = labelsOnRef.current
      if (labelLayerRef.current) labelLayerRef.current.style.display = layerOn ? 'block' : 'none'
      if (layerOn) {
        for (const { k, v } of labelVecs) {
          const elm = labelEls.current.get(k); if (!elm) continue
          tmp.copy(v).applyMatrix4(heart.matrixWorld).project(camera)
          const inFront = tmp.z < 1
          const x = (tmp.x * 0.5 + 0.5) * curW
          const y = (-tmp.y * 0.5 + 0.5) * curH
          elm.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`
          elm.style.opacity = inFront && x > -20 && x < curW + 20 ? '1' : '0'
        }
      }
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
      composer?.dispose(); bgTex.dispose(); bumpTex.dispose()
      scene.traverse((o) => { const a = o as any; a.geometry?.dispose?.(); if (a.material) (Array.isArray(a.material) ? a.material : [a.material]).forEach((m: any) => m.dispose?.()) })
      renderer.dispose()
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dark])

  if (failed) {
    return <div className="flex h-[380px] items-center justify-center rounded-xl border border-white/10 text-center text-xs text-muted-foreground">WebGL indisponível neste dispositivo. Use a visualização 2D.</div>
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full cursor-grab overflow-hidden rounded-xl border border-white/10 shadow-inner active:cursor-grabbing" style={{ height: 380 }} />
      {/* camada de rótulos anatômicos */}
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {LABELS.map((l) => (
          <div key={l.k}
            ref={(e) => { if (e) labelEls.current.set(l.k, e) }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[9.5px] font-bold text-white/90 shadow backdrop-blur-sm"
            style={{ willChange: 'transform, opacity' }}>
            <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-cyan-300 align-middle" />{l.t}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">Arraste para girar · role para aproximar</div>
      <button onClick={() => setShowLabels((v) => !v)}
        className={`absolute right-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-bold backdrop-blur transition ${showLabels ? 'bg-cyan-500/80 text-white' : 'bg-black/45 text-white/80 hover:bg-black/60'}`}>
        {showLabels ? 'Ocultar marcadores' : 'Mostrar marcadores'}
      </button>
    </div>
  )
}
