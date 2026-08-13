import * as THREE from 'three'
import type { DieSides } from '@shared/dice'

/**
 * Die shapes: render geometry, per-face data for numerals, and the convex hull
 * the physics engine collides against.
 *
 * Every die is a convex polyhedron. Working the faces out from the geometry
 * itself — rather than hand-authoring them per shape — means numerals can be
 * placed on anything, and the collision hull is guaranteed to match what you
 * can see, so dice never appear to bounce off thin air.
 */

export interface DieFace {
  /** Index into the face list. Values are assigned separately and can change. */
  index: number
  /** Outward normal in the die's local space. */
  normal: THREE.Vector3
  /** Face centre in local space, where the numeral sits. */
  center: THREE.Vector3
}

export interface DieShape {
  geometry: THREE.BufferGeometry
  faces: DieFace[]
  /** Convex hull for cannon-es: unique points plus faces as index loops. */
  hull: { vertices: THREE.Vector3[]; faces: number[][] }
  radius: number
}

/** Triangles sharing a normal belong to the same flat face (d12 pentagons). */
const NORMAL_EPSILON = 0.02
const VERTEX_EPSILON = 1e-4

interface RawFace {
  normal: THREE.Vector3
  center: THREE.Vector3
  vertexIndices: number[]
}

function buildFaces(source: THREE.BufferGeometry): {
  faces: RawFace[]
  vertices: THREE.Vector3[]
} {
  // Indexed geometry (BoxGeometry is) stores unique vertices with a separate
  // triangle index. Walking the position buffer three at a time would stitch
  // together vertices from unrelated triangles and produce nonsense normals —
  // a cube came out with diagonal face normals. De-index first so every three
  // positions really are one triangle.
  const geometry = source.index ? source.toNonIndexed() : source
  const position = geometry.getAttribute('position')

  const vertices: THREE.Vector3[] = []
  const indexOf = (p: THREE.Vector3): number => {
    const found = vertices.findIndex((v) => v.distanceToSquared(p) < VERTEX_EPSILON)
    if (found >= 0) return found
    vertices.push(p.clone())
    return vertices.length - 1
  }

  const groups: Array<{ normal: THREE.Vector3; indices: Set<number> }> = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()

  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i)
    b.fromBufferAttribute(position, i + 1)
    c.fromBufferAttribute(position, i + 2)

    const normal = new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize()

    let group = groups.find((g) => g.normal.distanceTo(normal) < NORMAL_EPSILON)
    if (!group) {
      group = { normal, indices: new Set() }
      groups.push(group)
    }
    group.indices.add(indexOf(a))
    group.indices.add(indexOf(b))
    group.indices.add(indexOf(c))
  }

  const faces = groups.map((g) => {
    const points = [...g.indices].map((i) => vertices[i]!)
    const center = new THREE.Vector3()
    for (const p of points) center.add(p)
    center.divideScalar(points.length)

    // Physics needs each face wound counter-clockwise as seen from outside,
    // so sort the corners by angle around the centre in the face's own plane.
    const basisX = new THREE.Vector3().subVectors(points[0]!, center).normalize()
    const basisY = new THREE.Vector3().crossVectors(g.normal, basisX).normalize()
    const ordered = [...g.indices].sort((i, j) => {
      const vi = new THREE.Vector3().subVectors(vertices[i]!, center)
      const vj = new THREE.Vector3().subVectors(vertices[j]!, center)
      return Math.atan2(vi.dot(basisY), vi.dot(basisX)) - Math.atan2(vj.dot(basisY), vj.dot(basisX))
    })

    return { normal: g.normal, center, vertexIndices: ordered }
  })

  return { faces, vertices }
}

/**
 * A pentagonal trapezohedron — the ten-sided die. Three.js has no primitive
 * for it, so it is built directly from two apexes and a ring of ten vertices
 * alternating above and below the equator.
 */
function trapezohedron(radius: number): THREE.BufferGeometry {
  const count = 10
  /**
   * Coplanarity fixes the apex height at roughly 9.47x this offset, so it is
   * the only real control over the die's proportions. At 0.35 the apex lands
   * near 3.3r and the die comes out as a spike; 0.125 gives an apex near 1.2r,
   * which matches a real d10 — a touch taller than it is wide.
   */
  const equatorOffset = radius * 0.125
  const ring: THREE.Vector3[] = []
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2
    ring.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        k % 2 === 0 ? equatorOffset : -equatorOffset,
        Math.sin(angle) * radius
      )
    )
  }

  /**
   * The apex height is not free: the four corners of a kite have to be
   * coplanar or the face splits into two triangles with different normals,
   * and the die ends up with 20 half-faces instead of 10.
   */
  const a = ring[0]!
  const b = ring[1]!
  const c = ring[2]!
  const planeNormal = new THREE.Vector3()
    .subVectors(b, a)
    .cross(new THREE.Vector3().subVectors(c, a))
  const apexY = Math.abs(planeNormal.dot(a) / planeNormal.y)

  const apexTop = new THREE.Vector3(0, apexY, 0)
  const apexBottom = new THREE.Vector3(0, -apexY, 0)

  const vertices: number[] = []
  const pushTri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3): void => {
    vertices.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z)
  }

  for (let i = 0; i < 5; i++) {
    const i0 = (i * 2) % count
    const i1 = (i * 2 + 1) % count
    const i2 = (i * 2 + 2) % count
    const i3 = (i * 2 + 3) % count
    pushTri(apexTop, ring[i0]!, ring[i1]!)
    pushTri(apexTop, ring[i1]!, ring[i2]!)
    pushTri(apexBottom, ring[i2]!, ring[i1]!)
    pushTri(apexBottom, ring[i3]!, ring[i2]!)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

function baseGeometry(sides: DieSides, radius: number): THREE.BufferGeometry {
  switch (sides) {
    case 4:
      // A tetrahedron of the same circumradius reads much smaller than the
      // other shapes, so it gets a bump to sit alongside them.
      return new THREE.TetrahedronGeometry(radius * 1.32)
    case 6:
      return new THREE.BoxGeometry(radius * 1.25, radius * 1.25, radius * 1.25)
    case 8:
      return new THREE.OctahedronGeometry(radius)
    case 12:
      return new THREE.DodecahedronGeometry(radius)
    case 20:
      return new THREE.IcosahedronGeometry(radius)
    case 10:
      return trapezohedron(radius)
  }
}

export function createDieShape(sides: DieSides, radius = 1): DieShape {
  const geometry = baseGeometry(sides, radius)
  const { faces, vertices } = buildFaces(geometry)

  return {
    geometry,
    faces: faces.map((f, index) => ({ index, normal: f.normal, center: f.center })),
    hull: { vertices, faces: faces.map((f) => f.vertexIndices) },
    radius
  }
}

/**
 * Which face is pointing up, given the die's current rotation.
 *
 * This is what lets real physics coexist with a predetermined result: the dice
 * tumble freely, and once they settle we find the face that actually landed
 * and put the required number on it. Nobody can tell, because every face is
 * geometrically identical.
 */
export function upwardFace(shape: DieShape, quaternion: THREE.Quaternion): DieFace {
  let best = shape.faces[0]!
  let bestDot = -Infinity
  const up = new THREE.Vector3(0, 1, 0)

  for (const face of shape.faces) {
    const worldNormal = face.normal.clone().applyQuaternion(quaternion)
    const dot = worldNormal.dot(up)
    if (dot > bestDot) {
      bestDot = dot
      best = face
    }
  }
  return best
}

/** A d4 is read from the face resting downward, not the one pointing up. */
export function downwardFace(shape: DieShape, quaternion: THREE.Quaternion): DieFace {
  let best = shape.faces[0]!
  let bestDot = Infinity
  const up = new THREE.Vector3(0, 1, 0)

  for (const face of shape.faces) {
    const worldNormal = face.normal.clone().applyQuaternion(quaternion)
    const dot = worldNormal.dot(up)
    if (dot < bestDot) {
      bestDot = dot
      best = face
    }
  }
  return best
}
