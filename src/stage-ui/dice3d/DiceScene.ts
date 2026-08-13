import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as CANNON from 'cannon-es'
import type { DiceTheme, RolledDie } from '@shared/dice'
import { createDieShape, upwardFace, type DieShape } from './geometry'
import { materialsFor, numeralTexture, type ThemeMaterials } from './materials'

/**
 * A real dice tray: rigid-body physics, viewed from above.
 *
 * The dice are thrown inward from the edges and genuinely simulated — they
 * collide with the felt, the walls, and each other, tumble, lose energy and
 * come to rest wherever they happen to.
 *
 * The trick that lets real physics coexist with a result everyone must agree
 * on: we do NOT force the dice to land on anything. We let them fall, see
 * which face ends up on top, and then paint the required number onto that
 * face. Every face is geometrically identical, so the roll is honest to look
 * at and still shows the number the roller generated. Forcing the pose instead
 * would mean visibly un-physical dice, and simulating until we happened to get
 * the right answer could take unbounded time.
 */

/**
 * Half-extents of the tray in world units. Deliberately snug: a wide tray lets
 * dice scatter to the edges and come to rest against the frame, which reads as
 * untidy rather than dramatic.
 */
const TRAY_X = 4.6
const TRAY_Z = 2.7

/** Give up waiting for stillness and settle anyway. */
const MAX_SIM_MS = 5000
/**
 * Never call a roll finished before this, however quickly the dice settle.
 * The result appearing the instant you click is the one thing that makes the
 * whole roll feel fake.
 */
const MIN_ROLL_MS = 1300
/** Speed below which a die counts as stopped. */
const REST_SPEED = 0.16

interface ActiveDie {
  mesh: THREE.Group
  body: CANNON.Body
  shape: DieShape
  sides: number
  value: number
  /** Numeral plates, indexed the same as shape.faces. */
  plates: THREE.Mesh[]
}

export class DiceScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private world: CANNON.World
  private diceMaterial: CANNON.Material
  private shapes = new Map<number, DieShape>()
  private materials: ThemeMaterials | null = null
  private themeId: string | null = null

  private dice: ActiveDie[] = []
  private frame = 0
  private lastTime = 0
  private startedAt = 0
  private settled = false
  private observer: ResizeObserver
  private onSettled: ((results: number[]) => void) | null = null

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'
    container.appendChild(this.renderer.domElement)

    // Near-overhead, tilted just enough to read the sides of the dice.
    this.camera = new THREE.PerspectiveCamera(32, 1.78, 0.1, 100)
    this.camera.position.set(0, 13.6, 4)
    this.camera.lookAt(0, 0, 0)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9))

    const key = new THREE.DirectionalLight(0xfff2dd, 2.6)
    key.position.set(4, 14, 6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -12
    key.shadow.camera.right = 12
    key.shadow.camera.top = 12
    key.shadow.camera.bottom = -12
    this.scene.add(key)

    const fill = new THREE.DirectionalLight(0xffffff, 0.9)
    fill.position.set(-5, 6, 9)
    this.scene.add(fill)

    // Catches contact shadows without painting a visible table over the scene.
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.45 })
    )
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.receiveShadow = true
    this.scene.add(floorMesh)

    // --- physics ---
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0) })
    this.world.allowSleep = true
    this.world.defaultContactMaterial.friction = 0.09

    this.diceMaterial = new CANNON.Material('dice')
    const floorMaterial = new CANNON.Material('floor')

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.diceMaterial, floorMaterial, {
        friction: 0.42,
        // Dice bounce a little on felt, but shouldn't behave like rubber.
        restitution: 0.28
      })
    )
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.diceMaterial, this.diceMaterial, {
        friction: 0.16,
        restitution: 0.4
      })
    )

    const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMaterial })
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(floor)

    // Invisible walls so dice can't skitter out of frame.
    const walls: Array<[CANNON.Vec3, CANNON.Vec3]> = [
      [new CANNON.Vec3(-TRAY_X, 0, 0), new CANNON.Vec3(1, 0, 0)],
      [new CANNON.Vec3(TRAY_X, 0, 0), new CANNON.Vec3(-1, 0, 0)],
      [new CANNON.Vec3(0, 0, -TRAY_Z), new CANNON.Vec3(0, 0, 1)],
      [new CANNON.Vec3(0, 0, TRAY_Z), new CANNON.Vec3(0, 0, -1)]
    ]
    for (const [position, normal] of walls) {
      const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMaterial })
      wall.position.copy(position)
      wall.quaternion.setFromVectors(new CANNON.Vec3(0, 0, 1), normal)
      this.world.addBody(wall)
    }

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()
  }

  private resize(): void {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private shapeFor(sides: number): DieShape {
    let shape = this.shapes.get(sides)
    if (!shape) {
      shape = createDieShape(sides as never, 1)
      this.shapes.set(sides, shape)
    }
    return shape
  }

  private useTheme(theme: DiceTheme): ThemeMaterials {
    if (this.themeId !== theme.id || !this.materials) {
      this.materials?.dispose()
      this.materials = materialsFor(theme)
      this.themeId = theme.id
    }
    return this.materials
  }

  /**
   * Throws the dice. `onSettled` fires once they stop, with the value each die
   * is showing — which is what the result banner waits for.
   */
  roll(dice: RolledDie[], theme: DiceTheme, onSettled?: (results: number[]) => void): void {
    this.clear()
    if (!dice.length) return
    this.resize()

    this.onSettled = onSettled ?? null
    const materials = this.useTheme(theme)
    const scale = Math.max(0.65, Math.min(1.15, 2.3 / Math.sqrt(dice.length + 1)))

    dice.forEach((die, index) => {
      const shape = this.shapeFor(die.sides)
      const { group, plates } = this.buildDie(shape, materials, scale, die.sides)

      // Alternate sides so a handful spreads out, but start on a random side
      // so a single die doesn't always arrive from the left.
      const fromLeft = (index + (Math.random() < 0.5 ? 0 : 1)) % 2 === 0
      const startX = fromLeft ? -TRAY_X - 2 : TRAY_X + 2
      const startZ = (Math.random() - 0.5) * TRAY_Z
      const body = new CANNON.Body({
        mass: 1,
        material: this.diceMaterial,
        shape: toConvex(shape, scale),
        position: new CANNON.Vec3(startX, 5 + Math.random() * 2.5, startZ),
        allowSleep: true,
        sleepSpeedLimit: REST_SPEED,
        sleepTimeLimit: 0.25,
        angularDamping: 0.16,
        linearDamping: 0.14
      })

      // Enough speed to tumble convincingly, but not so much that dice slam
      // into the far wall and come to rest against the edge of frame.
      body.velocity.set(
        (fromLeft ? 1 : -1) * (6.5 + Math.random() * 2.5),
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2.6
      )
      body.angularVelocity.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22
      )
      body.quaternion.setFromEuler(Math.random() * 6, Math.random() * 6, Math.random() * 6)

      this.world.addBody(body)
      this.scene.add(group)
      this.dice.push({ mesh: group, body, shape, sides: die.sides, value: die.value, plates })
    })

    this.startedAt = performance.now()
    this.lastTime = this.startedAt
    this.settled = false
    this.frame = requestAnimationFrame(this.tick)
  }

  private buildDie(
    shape: DieShape,
    materials: ThemeMaterials,
    scale: number,
    sides: number
  ): { group: THREE.Group; plates: THREE.Mesh[] } {
    const group = new THREE.Group()
    const body = new THREE.Mesh(shape.geometry, materials.body)
    body.castShadow = true
    group.add(body)

    const plates: THREE.Mesh[] =
      sides === 4 ? buildD4Numerals(shape, materials) : buildFaceNumerals(shape, materials, sides)

    for (const plate of plates) group.add(plate)
    group.scale.setScalar(scale)
    return { group, plates }
  }

  /**
   * Paints the die so whatever face is currently uppermost shows the rolled
   * value.
   *
   * Called every frame, not once at the end. The first version only relabeled
   * once physics stopped — dice tumbled with arbitrary placeholder numbers,
   * then every face snapped to its real number in one instant swap the moment
   * they settled. If the placeholder that happened to be on top matched what
   * a viewer expected, the die visibly "landed on 3" and then jumped to a
   * different number a beat later. Relabeling continuously removes the
   * discrete swap entirely: during the fast tumble nobody can track a single
   * face anyway, and once the die stops moving the up-face stops changing, so
   * the last frame's label is already correct with no separate event to see.
   */
  private applyLabel(die: ActiveDie, materials: ThemeMaterials): void {
    const quaternion = new THREE.Quaternion(
      die.body.quaternion.x,
      die.body.quaternion.y,
      die.body.quaternion.z,
      die.body.quaternion.w
    )

    /** Spreads the remaining numbers over the other slots, none repeated. */
    const fill = (count: number, landedSlot: number): number[] => {
      const values = new Array<number>(count)
      values[landedSlot] = die.value
      let next = 1
      for (let i = 0; i < count; i++) {
        if (i === landedSlot) continue
        while (next === die.value) next++
        values[i] = next
        next++
      }
      return values
    }

    if (die.sides === 4) {
      // A d4 is read from the number at its top point.
      let topVertex = 0
      let highest = -Infinity
      die.shape.hull.vertices.forEach((v, i) => {
        const y = v.clone().applyQuaternion(quaternion).y
        if (y > highest) {
          highest = y
          topVertex = i
        }
      })

      const values = fill(die.shape.hull.vertices.length, topVertex)
      for (const plate of die.plates) {
        const vertexIndex = plate.userData['vertexIndex'] as number
        const material = plate.material as THREE.MeshBasicMaterial
        material.map = numeralTexture(values[vertexIndex]!, materials.numeralColor)
        material.needsUpdate = true
      }
      return
    }

    const landed = upwardFace(die.shape, quaternion)
    const values = fill(die.shape.faces.length, landed.index)
    for (const plate of die.plates) {
      const faceIndex = plate.userData['faceIndex'] as number
      const material = plate.material as THREE.MeshBasicMaterial
      material.map = numeralTexture(values[faceIndex]!, materials.numeralColor)
      material.needsUpdate = true
    }
  }

  private tick = (): void => {
    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 30)
    this.lastTime = now

    this.world.step(1 / 60, dt, 4)

    const materials = this.materials
    for (const die of this.dice) {
      die.mesh.position.set(die.body.position.x, die.body.position.y, die.body.position.z)
      die.mesh.quaternion.set(
        die.body.quaternion.x,
        die.body.quaternion.y,
        die.body.quaternion.z,
        die.body.quaternion.w
      )
      // Keep the up-face correct on every frame — see applyLabel for why.
      if (materials) this.applyLabel(die, materials)
    }

    if (!this.settled) {
      const elapsed = now - this.startedAt
      const stopped = this.dice.every(
        (d) => d.body.sleepState === CANNON.Body.SLEEPING || d.body.velocity.length() < REST_SPEED
      )
      if ((stopped && elapsed > MIN_ROLL_MS) || elapsed > MAX_SIM_MS) {
        this.settled = true
        this.onSettled?.(this.dice.map((d) => d.value))
      }
    }

    this.renderer.render(this.scene, this.camera)
    // Keep drawing while dice are on the tray: a buffer that is never redrawn
    // can be dropped by the compositor, blanking the dice mid-result.
    this.frame = requestAnimationFrame(this.tick)
  }

  clear(): void {
    cancelAnimationFrame(this.frame)
    for (const die of this.dice) {
      this.world.removeBody(die.body)
      this.scene.remove(die.mesh)
      for (const plate of die.plates) {
        plate.geometry.dispose()
        ;(plate.material as THREE.Material).dispose()
      }
    }
    this.dice = []
    this.settled = false
    this.onSettled = null
    this.renderer.clear()
  }

  dispose(): void {
    this.clear()
    this.observer.disconnect()
    this.materials?.dispose()
    for (const shape of this.shapes.values()) shape.geometry.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

/** Shared look for every numeral plate. */
function numeralPlate(size: number): THREE.Mesh {
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: false
    })
  )
  plate.renderOrder = 1
  return plate
}

/**
 * One numeral per face, centred. Numbers are applied up front so the dice are
 * marked while they tumble — blank dice that only gain numbers once they stop
 * look like a loading bug.
 */
function buildFaceNumerals(
  shape: DieShape,
  materials: ThemeMaterials,
  sides: number
): THREE.Mesh[] {
  const size = shape.radius * (sides === 6 ? 0.78 : sides === 20 ? 0.5 : 0.58)

  return shape.faces.map((face) => {
    const plate = numeralPlate(size)
    plate.position.copy(face.center).addScaledVector(face.normal, shape.radius * 0.03)

    // A full basis, so numerals sit upright rather than at random rolls.
    const normal = face.normal.clone().normalize()
    let up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(normal.dot(up)) > 0.95) up = new THREE.Vector3(0, 0, 1)
    const right = new THREE.Vector3().crossVectors(up, normal).normalize()
    const trueUp = new THREE.Vector3().crossVectors(normal, right).normalize()
    plate.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, trueUp, normal))

    plate.userData['faceIndex'] = face.index
    const material = plate.material as THREE.MeshBasicMaterial
    material.map = numeralTexture(face.index + 1, materials.numeralColor)
    return plate
  })
}

/**
 * A d4 carries its numbers at the corners, not the middle of a face, and you
 * read the one at the top point — so each of the four numbers appears three
 * times, once on every face meeting that corner. Twelve plates in total.
 */
function buildD4Numerals(shape: DieShape, materials: ThemeMaterials): THREE.Mesh[] {
  const size = shape.radius * 0.56
  const plates: THREE.Mesh[] = []

  shape.hull.faces.forEach((corners, faceIndex) => {
    const face = shape.faces[faceIndex]!
    const normal = face.normal.clone().normalize()

    for (const vertexIndex of corners) {
      const corner = shape.hull.vertices[vertexIndex]!
      const plate = numeralPlate(size)

      // Sit between the face centre and the corner, not right on the point.
      plate.position
        .copy(face.center)
        .lerp(corner, 0.56)
        .addScaledVector(normal, shape.radius * 0.03)

      // Numerals point outward toward their corner, the way a real d4 reads.
      const up = new THREE.Vector3().subVectors(corner, face.center).normalize()
      const right = new THREE.Vector3().crossVectors(up, normal).normalize()
      plate.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal))

      plate.userData['vertexIndex'] = vertexIndex
      const material = plate.material as THREE.MeshBasicMaterial
      material.map = numeralTexture(vertexIndex + 1, materials.numeralColor)
      plates.push(plate)
    }
  })

  return plates
}

/** Builds the cannon-es collision hull that matches the visible die exactly. */
function toConvex(shape: DieShape, scale: number): CANNON.ConvexPolyhedron {
  return new CANNON.ConvexPolyhedron({
    vertices: shape.hull.vertices.map(
      (v) => new CANNON.Vec3(v.x * scale, v.y * scale, v.z * scale)
    ),
    faces: shape.hull.faces
  })
}
