/*
 * Boxes, and the weights that bind them to bones.
 *
 * K6 is built from boxes on purpose: Kobblon is a brick, the silhouette
 * should read at a distance, and a blocky avatar stays legible at the polygon
 * count a browser can afford for a dozen of them at once.
 *
 * Everything here is in stons, Kobblon's unit. One ston is 0.2 metres, so a
 * ten ston avatar is two metres tall.
 */

/** The six faces of a box, each with its own four corners so normals stay hard. */
const FACES = [
  { n: [0, 0, 1], c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
  { n: [1, 0, 0], c: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
  { n: [-1, 0, 0], c: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
]

/**
 * A box given as its middle and its full size, in the avatar's own space.
 * `taper` shrinks the top face, which is what keeps a limb from reading as a
 * plank.
 */
export function box({ at, size, taper = 1 }) {
  const [cx, cy, cz] = at
  const [sx, sy, sz] = size
  const positions = []
  const normals = []
  const indices = []

  for (const face of FACES) {
    const first = positions.length / 3
    for (const [x, y, z] of face.c) {
      const narrow = y > 0 ? taper : 1
      positions.push(
        cx + (x * sx * narrow) / 2,
        cy + (y * sy) / 2,
        cz + (z * sz * narrow) / 2,
      )
      normals.push(...face.n)
    }
    indices.push(first, first + 1, first + 2, first, first + 2, first + 3)
  }

  return { positions, normals, indices }
}

/** Sticks several boxes together into one part's geometry. */
export function join(parts) {
  const positions = []
  const normals = []
  const indices = []
  for (const part of parts) {
    const offset = positions.length / 3
    positions.push(...part.positions)
    normals.push(...part.normals)
    indices.push(...part.indices.map((i) => i + offset))
  }
  return { positions, normals, indices }
}

/**
 * Binds every vertex to at most two bones by how far up the limb it sits.
 *
 * A limb has a bone at each end of it and a band in the middle where the two
 * share the vertex. That band is what lets an elbow bend instead of shearing,
 * and it is the difference between a rig and six boxes flying in formation.
 */
export function bind(geometry, bands) {
  const joints = []
  const weights = []

  for (let i = 0; i < geometry.positions.length; i += 3) {
    const y = geometry.positions[i + 1]
    const band = bands.find((one) => y >= one.from && y <= one.to) ?? bands[bands.length - 1]

    if (band.blendWith === undefined) {
      joints.push(band.joint, 0, 0, 0)
      weights.push(1, 0, 0, 0)
      continue
    }

    // How far through the blending band this vertex is, 0 at the bottom.
    const through = (y - band.from) / Math.max(band.to - band.from, 1e-6)
    const mine = 1 - through
    joints.push(band.joint, band.blendWith, 0, 0)
    weights.push(mine, 1 - mine, 0, 0)
  }

  return { joints, weights }
}
