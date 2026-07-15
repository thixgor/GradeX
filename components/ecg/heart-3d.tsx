'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { WallKey } from './conduction-system'

// Coloque um GLB em public/models/heart.glb para habilitar o modo "Modelo 3D".
const MODEL_URL = '/models/heart.glb'

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

const LABELS: { k: string; t: string }[] = [
  { k: 'apex', t: 'Ápice' },
  { k: 'aorta', t: 'Aorta' },
  { k: 'pa', t: 'Tronco pulmonar' },
  { k: 'vcs', t: 'Veia cava sup.' },
  { k: 'ra', t: 'Átrio direito' },
  { k: 'la', t: 'Átrio esquerdo' },
  { k: 'rv', t: 'Ventrículo direito' },
  { k: 'lv', t: 'Ventrículo esquerdo' },
  { k: 'sa', t: 'Nó sinoatrial (SA)' },
  { k: 'av', t: 'Nó AV' },
  { k: 'lad', t: 'Coronária (DA)' },
]

// Âncoras dos marcadores no frame local do coração — calibradas por render
// para cada geometria (o modelo GLB e o coração procedural têm proporções
// diferentes, então cada um tem seu conjunto para ficar fidedigno).
const MODEL_ANCHORS: Record<string, [number, number, number]> = {
  apex: [-0.15, -3.0, 0.25], aorta: [0.15, 1.7, -0.15], pa: [-0.35, 1.75, 0.55], vcs: [-0.85, 1.55, 0.05],
  ra: [-1.05, 0.55, 0.35], la: [0.9, 1.15, -0.55], rv: [-0.5, -0.7, 0.75], lv: [1.0, -1.1, 0.15],
  sa: [-0.9, 1.25, 0.35], av: [-0.15, 0.25, 0.3], lad: [-0.05, -0.5, 1.15],
}
const PROC_ANCHORS: Record<string, [number, number, number]> = {
  apex: [0.35, -2.55, 0.2], aorta: [-0.55, 2.9, -0.5], pa: [0.75, 2.6, -0.05], vcs: [-1.55, 2.5, 0.2],
  ra: [-1.55, 1.5, 0.6], la: [1.1, 1.7, -0.3], rv: [-1.45, -0.5, 1.0], lv: [1.75, -0.6, 0.4],
  sa: [-1.55, 2.05, 0.6], av: [-0.35, 0.55, 0.25], lad: [0.15, -0.8, 1.5],
}

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

function makeBumpTexture() {
  const s = 256
  const c = document.createElement('canvas'); c.width = c.height = s
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(s, s)
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let val = 0, amp = 1, f = 0.05
    for (let o = 0; o < 4; o++) { val += amp * noise.noise(x * f, y * f, 3.3); f *= 2.1; amp *= 0.5 }
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
 * Coração 3D com dois modos alternáveis:
 *  - "Modelo 3D": carrega public/models/heart.glb (materiais originais).
 *  - "Procedural": coração construído em código (realista, com condução).
 * Marcadores anatômicos, realce de parede, vetor elétrico e contração em ambos.
 */
export function Heart3D(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const labelLayerRef = useRef<HTMLDivElement>(null)
  const labelEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const [failed, setFailed] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [modelAvailable, setModelAvailable] = useState(false)
  const [mode, setMode] = useState<'procedural' | 'model'>('procedural')
  const [loadPct, setLoadPct] = useState<number | null>(null)
  const labelsOnRef = useRef(true); labelsOnRef.current = showLabels
  const modeRef = useRef<'procedural' | 'model'>('procedural'); modeRef.current = mode
  const userPickedRef = useRef(false)
  const propsRef = useRef(props); propsRef.current = props

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
    renderer.toneMappingExposure = 0.95
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
    camera.position.set(0, 0.3, 9.5); camera.lookAt(0, -0.3, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    scene.add(new THREE.HemisphereLight(0xffe6e0, 0x0c1014, 0.6))
    const key = new THREE.DirectionalLight(0xfff2ec, 1.2); key.position.set(4, 6, 7); scene.add(key)
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.4); fill.position.set(-5, 1, 4); scene.add(fill)
    const rim = new THREE.DirectionalLight(0x88a8ff, 0.45); rim.position.set(-4, -2, -6); scene.add(rim)

    const heart = new THREE.Group()
    heart.rotation.z = -0.26; heart.rotation.x = 0.14
    scene.add(heart)

    // ═══ grupo procedural ═══
    const proc = new THREE.Group(); heart.add(proc)
    const bumpTex = makeBumpTexture()
    const myoMat = (hex: number) => new THREE.MeshStandardMaterial({
      color: hex, roughness: 0.74, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.05,
      emissive: new THREE.Color(0x300808), emissiveIntensity: 0.12, transparent: true, opacity: 0.9, side: THREE.FrontSide,
    })
    const lvMat = myoMat(0x9c3636), rvMat = myoMat(0x93374a), laMat = myoMat(0xa24848), raMat = myoMat(0x9c4a58)
    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], ro = 2) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.renderOrder = ro; return m }
    const lv = mesh(organicBlob(1.5, 1.85, 1.45, 0.42), lvMat, [0.35, -0.5, 0])
    const rv = mesh(organicBlob(1.15, 1.6, 1.2, 0.25), rvMat, [-1.0, -0.3, 0.55])
    const la = mesh(organicBlob(0.95, 0.85, 0.95, 0), laMat, [0.75, 1.5, -0.4])
    const ra = mesh(organicBlob(1.0, 0.95, 1.0, 0), raMat, [-1.15, 1.4, 0.2])
    proc.add(lv, rv, la, ra)
    const ventMeshes = [lv, rv], atrialMeshes = [la, ra]

    const fatMat = new THREE.MeshStandardMaterial({ color: 0xe4d6b0, roughness: 0.85, metalness: 0, bumpMap: bumpTex, bumpScale: 0.03 })
    const fat = (rx: number, ry: number, rz: number, p: [number, number, number]) => proc.add(mesh(organicBlob(rx, ry, rz, 0, 0.18, 40), fatMat, p, 3))
    fat(0.55, 0.5, 0.45, [-0.15, 0.55, 1.15]); fat(0.4, 0.7, 0.4, [-0.5, -0.3, 1.25]); fat(0.35, 0.4, 0.4, [0.9, 0.5, 0.9])

    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xc99a86, roughness: 0.6, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.03 })
    const pulmMat = new THREE.MeshStandardMaterial({ color: 0xb894a0, roughness: 0.6, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.03 })
    const cavaMat = new THREE.MeshStandardMaterial({ color: 0x9fb0c0, roughness: 0.62, metalness: 0.02 })
    const tube = (pts: number[][], r: number, mat: THREE.Material) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), 48, r, 20, false), mat)
    proc.add(tube([[0.2, 1.0, 0.1], [0.3, 2.2, 0.05], [0.05, 3.15, -0.1], [-0.7, 2.95, -0.55], [-1.0, 2.0, -0.6]], 0.34, aortaMat))
    proc.add(tube([[-0.9, 1.0, 0.7], [-0.6, 2.2, 0.4], [0.2, 2.75, 0.2], [0.85, 2.45, -0.05]], 0.3, pulmMat))
    proc.add(tube([[-1.5, 2.55, 0.2], [-1.4, 1.6, 0.2]], 0.24, cavaMat))
    proc.add(tube([[-1.4, -0.2, 0.2], [-1.3, -1.0, 0.2]], 0.26, cavaMat))

    const coronMat = () => new THREE.MeshStandardMaterial({ color: 0x8f3232, roughness: 0.45, metalness: 0.05, emissive: 0x1a0505, emissiveIntensity: 0.3 })
    const lad = tube([[0.15, 1.7, 1.28], [0.05, 0.6, 1.55], [0.15, -0.8, 1.4], [0.25, -2.3, 0.7]], 0.065, coronMat())
    const lcx = tube([[0.35, 1.7, 0.98], [1.1, 1.2, 0.58], [1.78, 0.1, -0.2], [1.5, -0.7, -0.5]], 0.06, coronMat())
    const rca = tube([[-1.0, 1.7, 0.98], [-1.72, 0.7, 0.3], [-1.62, -0.4, -0.3], [-1.1, -1.2, -0.5]], 0.06, coronMat())
    const ladD = tube([[0.15, 0.3, 1.5], [0.9, 0.1, 1.15], [1.35, -0.4, 0.6]], 0.04, coronMat())
    proc.add(lad, lcx, rca, ladD)
    const coronaries = [
      { mesh: lad, keys: ['descendente anterior', 'da', 'lad', 'diagonal'] },
      { mesh: ladD, keys: ['diagonal', 'descendente anterior', 'da', 'lad'] },
      { mesh: lcx, keys: ['circunflexa', 'cx', 'marginal'] },
      { mesh: rca, keys: ['direita', 'cd', 'rca'] },
    ]

    const P = { sa: new THREE.Vector3(-1.55, 2.0, 0.6), av: new THREE.Vector3(-0.35, 0.5, 0.2), his: new THREE.Vector3(-0.2, 0.0, 0.25), lv: new THREE.Vector3(0.5, -1.6, 0.1), rv: new THREE.Vector3(-1.0, -1.3, 0.75) }
    const condMat = () => new THREE.MeshStandardMaterial({ color: 0x2fe0a0, emissive: 0x2fe0a0, emissiveIntensity: 0.35, roughness: 0.3, toneMapped: false, transparent: true, opacity: 0.95 })
    const nodes: Record<string, THREE.Mesh> = {}
    const mkNode = (id: string, p: THREE.Vector3, r: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), condMat()); m.position.copy(p); m.renderOrder = 5; proc.add(m); nodes[id] = m }
    mkNode('sa', P.sa, 0.15); mkNode('av', P.av, 0.13)
    const beam = (a: THREE.Vector3, b: THREE.Vector3, mid: THREE.Vector3 | undefined, r: number) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mid ? [a, mid, b] : [a, b]), 26, r, 10, false), condMat()); m.renderOrder = 5; proc.add(m); return m }
    const atrialBeam = beam(P.sa, P.av, new THREE.Vector3(-1.0, 1.3, 0.45), 0.045)
    const hisBeam = beam(P.av, P.his, undefined, 0.06)
    const lbb = beam(P.his, P.lv, new THREE.Vector3(0.1, -0.6, 0.05), 0.05)
    const rbb = beam(P.his, P.rv, new THREE.Vector3(-0.6, -0.6, 0.5), 0.05)
    const purkinje: THREE.Mesh[] = []
    const spread = (base: THREE.Vector3, dirs: number[][]) => { for (const d of dirs) purkinje.push(beam(base, base.clone().add(new THREE.Vector3(d[0], d[1], d[2])), undefined, 0.028)) }
    spread(P.lv, [[0.6, -0.4, 0.35], [0.25, -0.5, -0.45], [0.85, -0.15, -0.1]]); spread(P.rv, [[-0.5, -0.4, 0.35], [-0.1, -0.55, 0.45], [-0.7, -0.2, 0.15]])
    const front = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd8fff0, toneMapped: false }))
    front.renderOrder = 6; proc.add(front)
    const frontPath = new THREE.CatmullRomCurve3([P.sa, new THREE.Vector3(-1.0, 1.3, 0.45), P.av, P.his, new THREE.Vector3(-0.2, -0.2, 0.25), P.lv])

    // ═══ overlays compartilhados (funcionam nos dois modos) ═══
    const wallMarkers: Record<string, THREE.Mesh> = {}
    for (const [k, pos] of Object.entries(WALL_POS)) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2323, emissiveIntensity: 0.7, transparent: true, opacity: 0.9, toneMapped: false }))
      m.position.set(...pos); m.visible = false; m.renderOrder = 7; heart.add(m); wallMarkers[k] = m
    }
    const ectopic = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffc23a, emissive: 0xffb020, emissiveIntensity: 0.9, toneMapped: false }))
    ectopic.visible = false; ectopic.renderOrder = 7; heart.add(ectopic)

    // ═══ efeito de sangue (líquido torcendo a cada contração) ═══
    // Coluna helicoidal de partículas vermelhas translúcidas ejetada pela via de
    // saída (aorta/tronco pulmonar) a cada sístole — como sangue sendo bombeado.
    const BN = 64
    const bPos = new Float32Array(BN * 3)
    const bAlpha = new Float32Array(BN)
    const bSeed = Array.from({ length: BN }, () => ({ a0: Math.random() * Math.PI * 2, r0: 0.1 + Math.random() * 0.42, off: Math.random(), sw: 0.8 + Math.random() * 0.5 }))
    const bGeo = new THREE.BufferGeometry()
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3))
    bGeo.setAttribute('aAlpha', new THREE.BufferAttribute(bAlpha, 1))
    const bMat = new THREE.ShaderMaterial({
      uniforms: { uSize: { value: 150 }, uColor: { value: new THREE.Color(0x9e1622) } },
      vertexShader: `attribute float aAlpha; varying float vA; uniform float uSize;
        void main(){ vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=uSize/max(0.2,-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; uniform vec3 uColor;
        void main(){ float d=length(gl_PointCoord-0.5); float m=smoothstep(0.5,0.14,d); if(m*vA<0.015) discard; gl_FragColor=vec4(uColor, m*vA*0.8); }`,
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.NormalBlending, toneMapped: false,
    })
    const blood = new THREE.Points(bGeo, bMat); blood.renderOrder = 8; blood.frustumCulled = false; heart.add(blood)

    // ═══ modelo 3D (GLTF) ═══
    let modelGroup: THREE.Group | null = null
    let modelFit = 1
    if (!disposed) setLoadPct(0)
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) { gltf.scene.traverse((o: any) => o.geometry?.dispose?.()); return }
        const root = gltf.scene
        const box = new THREE.Box3().setFromObject(root)
        const size = new THREE.Vector3(); box.getSize(size)
        const center = new THREE.Vector3(); box.getCenter(center)
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        modelFit = 5.4 / maxDim
        root.position.sub(center)
        root.traverse((o) => { const m = o as any; if (m.isMesh && m.material) { m.material.side = THREE.FrontSide; if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals() } })
        const g = new THREE.Group(); g.add(root); g.scale.setScalar(modelFit); g.position.set(0, -0.3, 0); g.visible = false
        heart.add(g); modelGroup = g
        setModelAvailable(true); setLoadPct(null)
        if (!userPickedRef.current) setMode('model')
      },
      (ev) => { if (!disposed && ev.total) setLoadPct(Math.round((ev.loaded / ev.total) * 100)) },
      () => { if (!disposed) setLoadPct(null) }, // ausente/erro → só procedural
    )

    // ═══ bloom sutil ═══
    let composer: EffectComposer | null = null
    try {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(curW, curH), 0.35, 0.4, 0.82))
      composer.addPass(new OutputPass())
      composer.setSize(curW, curH)
    } catch { composer = null }

    let arrow: THREE.ArrowHelper | null = null

    let dragging = false, lx = 0, ly = 0, targetRX = 0.14, targetRY = 0
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY }
    const onUp = () => { dragging = false }
    const onMove = (e: PointerEvent) => { if (!dragging) return; targetRY += (e.clientX - lx) * 0.01; targetRX = Math.max(-1.0, Math.min(1.2, targetRX + (e.clientY - ly) * 0.01)); lx = e.clientX; ly = e.clientY }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); camera.position.z = Math.max(6, Math.min(15, camera.position.z + e.deltaY * 0.01)) }
    const el = renderer.domElement; el.style.touchAction = 'none'
    el.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp); window.addEventListener('pointermove', onMove); el.addEventListener('wheel', onWheel, { passive: false })

    const ro = new ResizeObserver(() => { curW = mount.clientWidth || curW; renderer.setSize(curW, curH); composer?.setSize(curW, curH); camera.aspect = curW / curH; camera.updateProjectionMatrix() })
    ro.observe(mount)

    const labelVec: Record<string, THREE.Vector3> = {}
    for (const l of LABELS) labelVec[l.k] = new THREE.Vector3()
    const tmp = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf = 0
    const stageOn = (id: string, phase: number) => { const s = SEQ.find((x) => x.id === id); if (!s) return 0.3; const next = SEQ[SEQ.indexOf(s) + 1]?.t ?? s.t + 0.14; return phase >= s.t && phase < next + 0.05 ? 1.6 : 0.3 }

    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const p = propsRef.current
      const t = clock.getElapsedTime()
      const cycle = 60 / Math.max(30, p.rate || 60)
      const phase = (t % cycle) / cycle
      const abn = p.abnormalConduction
      const usingModel = modeRef.current === 'model' && !!modelGroup

      proc.visible = !usingModel
      if (modelGroup) modelGroup.visible = usingModel

      if (!dragging) targetRY += 0.0015
      heart.rotation.y += (targetRY - heart.rotation.y) * 0.1
      heart.rotation.x += (targetRX - heart.rotation.x) * 0.1
      heart.updateMatrixWorld()

      // contração realista: sístole ventricular = encurtamento longitudinal (Y),
      // espessamento radial (X/Z) e leve torção (wringing) do coração.
      const ventSys = phase > 0.5 && phase < 0.82 ? Math.sin(((phase - 0.5) / 0.32) * Math.PI) : 0
      if (usingModel && modelGroup) {
        modelGroup.scale.set(modelFit * (1 + 0.04 * ventSys), modelFit * (1 - 0.085 * ventSys), modelFit * (1 + 0.04 * ventSys))
        modelGroup.rotation.y = 0.07 * ventSys           // torção sistólica
        modelGroup.position.y = -0.3 - 0.14 * ventSys     // base desce em direção ao ápice
      }

      // sangue líquido: coluna helicoidal ejetada pela via de saída na sístole
      const eject = Math.max(ventSys, phase > 0.46 && phase < 0.86 ? 0.25 : 0)
      for (let i = 0; i < BN; i++) {
        const s = bSeed[i]
        const u = (t * 0.5 + s.off) % 1
        const ang = s.a0 + u * s.sw * 2.4 * Math.PI + t * 0.7
        const rad = s.r0 * (1 - 0.42 * u)
        bPos[i * 3] = Math.cos(ang) * rad
        bPos[i * 3 + 1] = 0.2 + u * 2.55
        bPos[i * 3 + 2] = 0.05 + Math.sin(ang) * rad
        bAlpha[i] = eject * Math.sin(u * Math.PI)
      }
      bGeo.attributes.position.needsUpdate = true
      ;(bGeo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true

      if (!usingModel) {
        ;(nodes.sa.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('sa', phase)
        ;(nodes.av.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('av', phase)
        ;(atrialBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.18 : stageOn('atria', phase)
        ;(hisBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('his', phase)
        ;(lbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('lbb', phase)
        ;(rbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('rbb', phase)
        const pk = stageOn('purkinje', phase); for (const f of purkinje) (f.material as THREE.MeshStandardMaterial).emissiveIntensity = pk
        const atriaGlow = phase > 0.05 && phase < 0.2 && !abn ? 0.4 : 0.12
        const ventGlow = phase > 0.44 && phase < 0.72 ? 0.45 : 0.12
        for (const m of atrialMeshes) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = atriaGlow
        // contração não-uniforme: encurta no eixo longo (Y), engrossa no plano (X/Z)
        for (const vm of ventMeshes) { vm.scale.set(1 + 0.03 * ventSys, 1 - 0.07 * ventSys, 1 + 0.03 * ventSys); (vm.material as THREE.MeshStandardMaterial).emissiveIntensity = ventGlow }
        const atrSys = phase > 0.05 && phase < 0.2 ? Math.sin(((phase - 0.05) / 0.15) * Math.PI) : 0
        for (const am of atrialMeshes) am.scale.set(1 - 0.03 * atrSys, 1 - 0.05 * atrSys, 1 - 0.03 * atrSys)
        if (!abn) { const fp = Math.min(0.999, Math.max(0, phase / 0.55)); front.visible = phase < 0.6; frontPath.getPoint(fp, front.position) } else front.visible = false
        const walls0 = p.highlightWalls || []
        const lvInfarct = walls0.some((w) => ['anterior', 'septal', 'inferior', 'lateral', 'posterior', 'lv'].includes(w))
        lvMat.color.setHex(lvInfarct ? 0xba3838 : 0x9c3636); rvMat.color.setHex(walls0.includes('rv') ? 0xba385a : 0x93374a)
        const al = (p.arteryLabel || '').toLowerCase()
        for (const c of coronaries) { const hit = !!p.arteryLabel && c.keys.some((kk) => al.includes(kk)); const mat = c.mesh.material as THREE.MeshStandardMaterial; mat.emissive.setHex(hit ? 0xff2a2a : 0x1a0505); mat.emissiveIntensity = hit ? 0.7 + 0.5 * Math.abs(Math.sin(t * 3)) : 0.3; mat.color.setHex(hit ? 0xff5555 : 0x8f3232) }
      }

      // realce de parede (ambos os modos)
      const walls = p.highlightWalls || []
      for (const [k, m] of Object.entries(wallMarkers)) { const on = walls.includes(k as WallKey); m.visible = on; if (on) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + 0.5 * Math.abs(Math.sin(t * 3)) }

      if (p.ectopicOrigin) { ectopic.visible = true; ectopic.position.set(-1.6 + p.ectopicOrigin.x * 3.2, 2.3 - p.ectopicOrigin.y * 4.2, 0.8); ectopic.scale.setScalar(0.85 + 0.4 * Math.abs(Math.sin(t * 4))) } else ectopic.visible = false

      if (typeof p.axisDeg === 'number') {
        const rad = (p.axisDeg * Math.PI) / 180
        const dir = new THREE.Vector3(Math.cos(rad), -Math.sin(rad), 0).normalize()
        if (!arrow) { arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0.1, -0.2, 0), 2.5, 0x49b6ff, 0.5, 0.3); (arrow.line.material as THREE.Material).toneMapped = false; heart.add(arrow) }
        else { arrow.visible = true; arrow.setDirection(dir) }
      } else if (arrow) arrow.visible = false

      if (composer) composer.render(); else renderer.render(scene, camera)

      const layerOn = labelsOnRef.current
      if (labelLayerRef.current) labelLayerRef.current.style.display = layerOn ? 'block' : 'none'
      if (layerOn) {
        const anchors = usingModel ? MODEL_ANCHORS : PROC_ANCHORS
        for (const { k } of LABELS) {
          const elm = labelEls.current.get(k); const a = anchors[k]; if (!elm || !a) continue
          tmp.copy(labelVec[k].set(a[0], a[1], a[2])).applyMatrix4(heart.matrixWorld).project(camera)
          const x = (tmp.x * 0.5 + 0.5) * curW, y = (-tmp.y * 0.5 + 0.5) * curH
          elm.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`
          elm.style.opacity = tmp.z < 1 && x > -20 && x < curW + 20 ? '1' : '0'
        }
      }
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf); ro.disconnect()
      el.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointermove', onMove); el.removeEventListener('wheel', onWheel)
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
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {LABELS.map((l) => (
          <div key={l.k} ref={(e) => { if (e) labelEls.current.set(l.k, e) }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[9.5px] font-bold text-white/90 shadow backdrop-blur-sm"
            style={{ willChange: 'transform, opacity' }}>
            <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-cyan-300 align-middle" />{l.t}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">Arraste para girar · role para aproximar</div>

      {/* alternância Modelo 3D / Procedural */}
      {modelAvailable && (
        <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1 rounded-lg bg-black/50 p-1 backdrop-blur">
          <button onClick={() => { userPickedRef.current = true; setMode('model') }}
            className={`rounded px-2 py-1 text-[10px] font-bold transition ${mode === 'model' ? 'bg-cyan-500 text-white' : 'text-white/75 hover:text-white'}`}>Modelo 3D</button>
          <button onClick={() => { userPickedRef.current = true; setMode('procedural') }}
            className={`rounded px-2 py-1 text-[10px] font-bold transition ${mode === 'procedural' ? 'bg-cyan-500 text-white' : 'text-white/75 hover:text-white'}`}>Procedural</button>
        </div>
      )}
      {loadPct !== null && (
        <div className="pointer-events-none absolute left-2.5 bottom-2.5 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">Carregando modelo 3D… {loadPct}%</div>
      )}

      <button onClick={() => setShowLabels((v) => !v)}
        className={`absolute right-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-bold backdrop-blur transition ${showLabels ? 'bg-cyan-500/80 text-white' : 'bg-black/45 text-white/80 hover:bg-black/60'}`}>
        {showLabels ? 'Ocultar marcadores' : 'Mostrar marcadores'}
      </button>

      {/* Atribuição exigida pela licença CC BY 4.0 do modelo */}
      {modelAvailable && mode === 'model' && (
        <div className="pointer-events-auto absolute bottom-1.5 right-2 text-[8px] leading-tight text-white/45">
          Modelo: <a href="https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">“Realistic Human Heart”</a> por neshallads · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">CC BY 4.0</a>
        </div>
      )}
    </div>
  )
}
