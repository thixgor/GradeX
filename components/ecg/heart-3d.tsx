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

// Fases da despolarização (fração do ciclo).
const SEQ = [
  { id: 'sa', t: 0.0 }, { id: 'atria', t: 0.06 }, { id: 'av', t: 0.2 },
  { id: 'his', t: 0.3 }, { id: 'lbb', t: 0.38 }, { id: 'rbb', t: 0.38 },
  { id: 'purkinje', t: 0.46 }, { id: 'ventricles', t: 0.54 },
]

const WALL_POS: Record<string, [number, number, number]> = {
  anterior: [0.4, -0.4, 1.5], septal: [-0.4, -0.5, 0.5], inferior: [0.35, -1.9, 0.3],
  lateral: [1.7, -0.5, 0.1], posterior: [0.35, -0.5, -1.5], rv: [-1.3, -0.4, 1.0], lv: [1.0, -0.7, 0.6],
}

// ── shaders do miocárdio (translúcido + fresnel + frente de despolarização) ──
const MYO_VERT = /* glsl */`
  uniform mat4 uGroupInv;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying float vGY;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vGY = (uGroupInv * world).y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const MYO_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uWaveY;
  uniform float uWaveW;
  uniform vec3 uWaveColor;
  uniform float uTime;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying float vGY;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 2.4);
    vec3 col = uColor + fres * uColor * 1.4;
    // frente de despolarização: banda luminosa que varre o eixo do coração
    float band = 1.0 - smoothstep(0.0, uWaveW, abs(vGY - uWaveY));
    band *= step(-90.0, uWaveY); // desativado quando uWaveY muito negativo
    col += uWaveColor * band * 1.6;
    float alpha = clamp(uOpacity + fres * 0.5 + band * 0.5, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`

const noise = new ImprovedNoise()
/** Elipsoide orgânica (deformada por ruído) para as câmaras. */
function organicBlob(rx: number, ry: number, rz: number, apex = 0, wobble = 0.12, seg = 64) {
  const geo = new THREE.SphereGeometry(1, seg, Math.floor(seg * 0.7))
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const ny = v.y
    let taper = 1
    if (apex > 0 && ny < 0) taper = 1 - apex * (-ny) // afina em direção ao ápice
    const n = noise.noise(v.x * 1.7 + 5, v.y * 1.7, v.z * 1.7) * wobble
    const s = 1 + n
    let y = ny < 0 && apex > 0 ? v.y * (1 + apex * 0.35) : v.y
    pos.setXYZ(i, v.x * rx * taper * s, y * ry * s, v.z * rz * taper * s)
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Coração 3D em WebGL com pós-processamento (bloom), miocárdio translúcido com
 * frente de despolarização que varre o músculo, artérias coronárias destacáveis,
 * sistema de condução luminoso, vetor elétrico e contração sincronizada.
 */
export function Heart3D(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch { setFailed(true); return }
    let disposed = false
    const width = mount.clientWidth || 340
    const height = 380
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    // fundo: gradiente radial escuro (palco 3D) para o bloom se destacar
    const bg = document.createElement('canvas'); bg.width = 16; bg.height = 256
    const bgx = bg.getContext('2d')!
    const grad = bgx.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0, props.dark ? '#0b1414' : '#0a1118')
    grad.addColorStop(1, props.dark ? '#05100b' : '#050a0f')
    bgx.fillStyle = grad; bgx.fillRect(0, 0, 16, 256)
    const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace
    scene.background = bgTex

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0.3, 9.5)
    camera.lookAt(0, -0.3, 0)

    // iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    scene.add(new THREE.HemisphereLight(0xffd8d8, 0x0a1418, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(5, 7, 8); scene.add(key)
    const rim = new THREE.DirectionalLight(0x5a8cff, 0.7); rim.position.set(-7, -1, -6); scene.add(rim)
    const innerGlow = new THREE.PointLight(0xff5a5a, 1.2, 12, 2); innerGlow.position.set(0, -0.4, 0); scene.add(innerGlow)

    const heart = new THREE.Group()
    heart.rotation.z = -0.26; heart.rotation.x = 0.16
    scene.add(heart)

    // ── miocárdio (shader translúcido) ──
    const myoMats: THREE.ShaderMaterial[] = []
    const mkMyo = (hex: number, opacity: number) => {
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(hex) }, uOpacity: { value: opacity },
          uWaveY: { value: -999 }, uWaveW: { value: 0.6 }, uWaveColor: { value: new THREE.Color(0x4dff9e) },
          uTime: { value: 0 }, uGroupInv: { value: new THREE.Matrix4() },
        },
        vertexShader: MYO_VERT, fragmentShader: MYO_FRAG,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
      })
      myoMats.push(m); return m
    }
    const lvMat = mkMyo(0xc0454a, 0.26)
    const rvMat = mkMyo(0xb15070, 0.24)
    const laMat = mkMyo(0xc06a6a, 0.24)
    const raMat = mkMyo(0xa86078, 0.24)

    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number]) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.renderOrder = 2; return m
    }
    const lv = mesh(organicBlob(1.5, 1.85, 1.45, 0.42), lvMat, [0.35, -0.5, 0])
    const rv = mesh(organicBlob(1.15, 1.6, 1.2, 0.25), rvMat, [-1.0, -0.3, 0.55])
    const la = mesh(organicBlob(0.95, 0.85, 0.95, 0), laMat, [0.75, 1.5, -0.4])
    const ra = mesh(organicBlob(1.0, 0.95, 1.0, 0), raMat, [-1.15, 1.4, 0.2])
    heart.add(lv, rv, la, ra)
    const ventMeshes = [lv, rv]; const atrialMeshes = [la, ra]

    // ── grandes vasos ──
    const vesselMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc2, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    const pulmMat = new THREE.MeshStandardMaterial({ color: 0x93a8c8, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    const tube = (pts: number[][], r: number, mat: THREE.Material) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
      return new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 18, false), mat)
    }
    heart.add(tube([[0.2, 1.0, 0.1], [0.3, 2.2, 0.05], [0.05, 3.1, -0.1], [-0.7, 2.9, -0.5], [-1.0, 2.0, -0.6]], 0.34, vesselMat))
    heart.add(tube([[-0.9, 1.0, 0.7], [-0.6, 2.2, 0.4], [0.2, 2.7, 0.2], [0.8, 2.4, -0.05]], 0.3, pulmMat))
    heart.add(tube([[-1.5, 2.5, 0.2], [-1.4, 1.6, 0.2]], 0.24, vesselMat)) // VCS
    heart.add(tube([[-1.4, -0.2, 0.2], [-1.3, -1.0, 0.2]], 0.26, vesselMat)) // VCI

    // ── artérias coronárias (destacáveis) ──
    const coronMat = () => new THREE.MeshStandardMaterial({ color: 0x8a2f2f, emissive: 0x3a0f0f, emissiveIntensity: 0.4, roughness: 0.4 })
    const lad = tube([[0.15, 1.7, 1.25], [0.05, 0.6, 1.5], [0.15, -0.8, 1.35], [0.25, -2.3, 0.7]], 0.07, coronMat())
    const lcx = tube([[0.35, 1.7, 0.95], [1.1, 1.2, 0.55], [1.75, 0.1, -0.2], [1.5, -0.7, -0.5]], 0.07, coronMat())
    const rca = tube([[-1.0, 1.7, 0.95], [-1.7, 0.7, 0.3], [-1.6, -0.4, -0.3], [-1.1, -1.2, -0.5]], 0.07, coronMat())
    heart.add(lad, lcx, rca)
    const coronaries: { mesh: THREE.Mesh; keys: string[] }[] = [
      { mesh: lad, keys: ['descendente anterior', 'da/', ' da', 'lad', 'diagonal'] },
      { mesh: lcx, keys: ['circunflexa', 'cx', 'marginal'] },
      { mesh: rca, keys: ['direita', 'cd', 'coronária direita', 'rca'] },
    ]

    // ── sistema de condução ──
    const P = {
      sa: new THREE.Vector3(-1.55, 2.0, 0.6), av: new THREE.Vector3(-0.35, 0.5, 0.2),
      his: new THREE.Vector3(-0.2, 0.0, 0.25), split: new THREE.Vector3(-0.2, -0.2, 0.25),
      lv: new THREE.Vector3(0.5, -1.6, 0.1), rv: new THREE.Vector3(-1.0, -1.3, 0.75),
    }
    const condMat = () => new THREE.MeshStandardMaterial({ color: 0x39f5c0, emissive: 0x2fe0a0, emissiveIntensity: 0.4, roughness: 0.3, toneMapped: false })
    const nodes: Record<string, THREE.Mesh> = {}
    const mkNode = (id: string, p: THREE.Vector3, r: number) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 18), condMat()); m.position.copy(p); m.renderOrder = 3; heart.add(m); nodes[id] = m
    }
    mkNode('sa', P.sa, 0.17); mkNode('av', P.av, 0.15)
    const beam = (a: THREE.Vector3, b: THREE.Vector3, mid: THREE.Vector3 | undefined, r: number) => {
      const c = new THREE.CatmullRomCurve3(mid ? [a, mid, b] : [a, b])
      const m = new THREE.Mesh(new THREE.TubeGeometry(c, 28, r, 12, false), condMat()); m.renderOrder = 3; heart.add(m); return m
    }
    const atrialBeam = beam(P.sa, P.av, new THREE.Vector3(-1.0, 1.3, 0.45), 0.05)
    const hisBeam = beam(P.av, P.his, undefined, 0.07)
    const lbb = beam(P.his, P.lv, new THREE.Vector3(0.1, -0.6, 0.05), 0.055)
    const rbb = beam(P.his, P.rv, new THREE.Vector3(-0.6, -0.6, 0.5), 0.055)
    const purkinje: THREE.Mesh[] = []
    const spread = (base: THREE.Vector3, dirs: number[][]) => { for (const d of dirs) purkinje.push(beam(base, base.clone().add(new THREE.Vector3(d[0], d[1], d[2])), undefined, 0.032)) }
    spread(P.lv, [[0.6, -0.4, 0.35], [0.25, -0.5, -0.45], [0.85, -0.15, -0.1], [0.2, -0.6, 0.4]])
    spread(P.rv, [[-0.5, -0.4, 0.35], [-0.1, -0.55, 0.45], [-0.7, -0.2, 0.15]])

    // ── frente luminosa (percorre o caminho, com bloom) ──
    const front = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), new THREE.MeshBasicMaterial({ color: 0xeafff6, toneMapped: false }))
    front.renderOrder = 4; heart.add(front)
    const frontPath = new THREE.CatmullRomCurve3([P.sa, new THREE.Vector3(-1.0, 1.3, 0.45), P.av, P.his, P.split, P.lv])

    // ── marcadores de parede (IAM) ──
    const wallMarkers: Record<string, THREE.Mesh> = {}
    for (const [k, pos] of Object.entries(WALL_POS)) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), new THREE.MeshStandardMaterial({ color: 0xff3535, emissive: 0xff2020, emissiveIntensity: 0.8, transparent: true, opacity: 0.92, toneMapped: false }))
      m.position.set(...pos); m.visible = false; m.renderOrder = 4; heart.add(m); wallMarkers[k] = m
    }
    // ── origem ectópica ──
    const ectopic = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffc23a, emissive: 0xffb020, emissiveIntensity: 1.0, toneMapped: false }))
    ectopic.visible = false; ectopic.renderOrder = 4; heart.add(ectopic)

    // ── pós-processamento (bloom) ──
    let composer: EffectComposer | null = null
    try {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.9, 0.7, 0.2)
      composer.addPass(bloom)
      composer.addPass(new OutputPass())
      composer.setSize(width, height)
    } catch { composer = null }

    // ── vetor elétrico ──
    let arrow: THREE.ArrowHelper | null = null

    // ── interação ──
    let dragging = false, lx = 0, ly = 0, targetRX = 0.16, targetRY = 0
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY }
    const onUp = () => { dragging = false }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      targetRY += (e.clientX - lx) * 0.01
      targetRX = Math.max(-1.0, Math.min(1.2, targetRX + (e.clientY - ly) * 0.01))
      lx = e.clientX; ly = e.clientY
    }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); camera.position.z = Math.max(6, Math.min(15, camera.position.z + e.deltaY * 0.01)) }
    const el = renderer.domElement; el.style.touchAction = 'none'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('wheel', onWheel, { passive: false })

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || width
      renderer.setSize(w, height); composer?.setSize(w, height)
      camera.aspect = w / height; camera.updateProjectionMatrix()
    })
    ro.observe(mount)

    const clock = new THREE.Clock()
    const groupInv = new THREE.Matrix4()
    let raf = 0
    const stageOn = (id: string, phase: number) => {
      const s = SEQ.find((x) => x.id === id); if (!s) return 0.3
      const next = SEQ[SEQ.indexOf(s) + 1]?.t ?? s.t + 0.14
      return phase >= s.t && phase < next + 0.05 ? 2.4 : 0.28
    }

    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const p = propsRef.current
      const t = clock.getElapsedTime()
      const cycle = 60 / Math.max(30, p.rate || 60)
      const phase = (t % cycle) / cycle
      const abn = p.abnormalConduction

      if (!dragging) targetRY += 0.0016
      heart.rotation.y += (targetRY - heart.rotation.y) * 0.1
      heart.rotation.x += (targetRX - heart.rotation.x) * 0.1
      heart.updateMatrixWorld()
      groupInv.copy(heart.matrixWorld).invert()

      // condução
      ;(nodes.sa.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('sa', phase)
      ;(nodes.av.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.25 : stageOn('av', phase)
      ;(atrialBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = abn ? 0.18 : stageOn('atria', phase)
      ;(hisBeam.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('his', phase)
      ;(lbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('lbb', phase)
      ;(rbb.material as THREE.MeshStandardMaterial).emissiveIntensity = stageOn('rbb', phase)
      const pk = stageOn('purkinje', phase)
      for (const f of purkinje) (f.material as THREE.MeshStandardMaterial).emissiveIntensity = pk

      // frente de despolarização no músculo (varre base→ápice durante o QRS)
      const inVent = phase > 0.44 && phase < 0.74
      const waveY = inVent ? 2.2 - ((phase - 0.44) / 0.30) * 5.2 : -999
      const inAtria = phase > 0.05 && phase < 0.2
      const atriaWaveY = inAtria ? 2.4 - ((phase - 0.05) / 0.15) * 1.6 : -999
      for (const m of myoMats) { m.uniforms.uTime.value = t; m.uniforms.uGroupInv.value = groupInv }
      lvMat.uniforms.uWaveY.value = waveY; lvMat.uniforms.uWaveColor.value.setHex(0x4dff9e)
      rvMat.uniforms.uWaveY.value = waveY; rvMat.uniforms.uWaveColor.value.setHex(0x4dff9e)
      laMat.uniforms.uWaveY.value = atriaWaveY; laMat.uniforms.uWaveColor.value.setHex(0x5ad0ff)
      raMat.uniforms.uWaveY.value = atriaWaveY; raMat.uniforms.uWaveColor.value.setHex(0x5ad0ff)

      // contração mecânica (sístole ventricular após o QRS)
      const ventSys = phase > 0.5 && phase < 0.82 ? Math.sin(((phase - 0.5) / 0.32) * Math.PI) : 0
      const vs = 1 - 0.06 * ventSys
      for (const vm of ventMeshes) vm.scale.setScalar(vs)
      const atrSys = inAtria ? Math.sin(((phase - 0.05) / 0.15) * Math.PI) : 0
      for (const am of atrialMeshes) am.scale.setScalar(1 - 0.05 * atrSys)
      innerGlow.intensity = 0.7 + 1.6 * ventSys

      // frente luminosa
      if (!abn) { const fp = Math.min(0.999, Math.max(0, phase / 0.55)); front.visible = phase < 0.6; frontPath.getPoint(fp, front.position) }
      else front.visible = false

      // realce de parede
      const walls = p.highlightWalls || []
      for (const [k, m] of Object.entries(wallMarkers)) {
        const on = walls.includes(k as WallKey); m.visible = on
        if (on) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + 0.7 * Math.abs(Math.sin(t * 3))
      }
      const lvInfarct = walls.some((w) => ['anterior', 'septal', 'inferior', 'lateral', 'posterior', 'lv'].includes(w))
      lvMat.uniforms.uColor.value.setHex(lvInfarct ? 0xe23838 : 0xc0454a)
      rvMat.uniforms.uColor.value.setHex(walls.includes('rv') ? 0xe23870 : 0xb15070)

      // artéria culpada
      const al = (p.arteryLabel || '').toLowerCase()
      for (const c of coronaries) {
        const hit = !!p.arteryLabel && c.keys.some((k) => al.includes(k.trim()))
        const mat = c.mesh.material as THREE.MeshStandardMaterial
        mat.emissive.setHex(hit ? 0xff2a2a : 0x3a0f0f)
        mat.emissiveIntensity = hit ? 0.9 + 0.6 * Math.abs(Math.sin(t * 3)) : 0.35
        mat.color.setHex(hit ? 0xff5050 : 0x8a2f2f)
      }

      // origem ectópica
      if (p.ectopicOrigin) {
        ectopic.visible = true
        ectopic.position.set(-1.6 + p.ectopicOrigin.x * 3.2, 2.3 - p.ectopicOrigin.y * 4.2, 0.5)
        ectopic.scale.setScalar(0.85 + 0.4 * Math.abs(Math.sin(t * 4)))
      } else ectopic.visible = false

      // vetor elétrico
      if (typeof p.axisDeg === 'number') {
        const rad = (p.axisDeg * Math.PI) / 180
        const dir = new THREE.Vector3(Math.cos(rad), -Math.sin(rad), 0).normalize()
        if (!arrow) { arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0.1, -0.2, 0), 2.6, 0x38bdf8, 0.55, 0.32); heart.add(arrow) }
        else { arrow.visible = true; arrow.setDirection(dir) }
      } else if (arrow) arrow.visible = false

      if (composer) composer.render(); else renderer.render(scene, camera)
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
      composer?.dispose()
      bgTex.dispose()
      scene.traverse((o) => {
        const a = o as any
        a.geometry?.dispose?.()
        if (a.material) (Array.isArray(a.material) ? a.material : [a.material]).forEach((m: any) => m.dispose?.())
      })
      renderer.dispose()
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.dark])

  if (failed) {
    return (
      <div className="flex h-[380px] items-center justify-center rounded-xl border border-white/10 text-center text-xs text-muted-foreground">
        WebGL indisponível neste dispositivo. Use a visualização 2D.
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full cursor-grab overflow-hidden rounded-xl border border-white/10 shadow-inner active:cursor-grabbing" style={{ height: 380 }} />
      <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">
        Arraste para girar · role para aproximar
      </div>
    </div>
  )
}
