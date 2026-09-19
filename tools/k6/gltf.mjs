/*
 * A small glTF 2.0 writer.
 *
 * Kobblon owns K6, so K6 has to be generated rather than downloaded, and a
 * generated avatar has to come out in a format the engine already reads.
 * glTF is that format: three.js loads it, Blender opens it if a human ever
 * wants to take over, and it carries a skeleton and animation in one file.
 *
 * This writes only what K6 needs. It is not a general exporter and does not
 * pretend to be.
 */

const FLOAT = 5126
const USHORT = 5123
const UBYTE = 5121
const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963

export class Gltf {
  constructor() {
    this.json = {
      asset: { version: '2.0', generator: 'Kobblon K6 builder' },
      scene: 0,
      scenes: [{ nodes: [] }],
      nodes: [],
      meshes: [],
      materials: [],
      skins: [],
      animations: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
    }
    this.chunks = []
    this.length = 0
  }

  /** Puts bytes in the buffer, padded to four as the format insists. */
  #write(bytes) {
    const at = this.length
    this.chunks.push(bytes)
    this.length += bytes.byteLength
    const over = this.length % 4
    if (over) {
      const pad = new Uint8Array(4 - over)
      this.chunks.push(pad)
      this.length += pad.byteLength
    }
    return at
  }

  #view(bytes, target) {
    const offset = this.#write(bytes)
    this.json.bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: bytes.byteLength,
      ...(target ? { target } : {}),
    })
    return this.json.bufferViews.length - 1
  }

  floats(values, type, target = ARRAY_BUFFER, extras = {}) {
    const array = new Float32Array(values)
    const view = this.#view(new Uint8Array(array.buffer), target)
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type]
    const count = values.length / size

    // Positions need their extent written out or viewers cannot frame them.
    const bounds = {}
    if (type === 'VEC3' || type === 'SCALAR') {
      const min = new Array(size).fill(Infinity)
      const max = new Array(size).fill(-Infinity)
      for (let i = 0; i < values.length; i += size) {
        for (let k = 0; k < size; k += 1) {
          min[k] = Math.min(min[k], values[i + k])
          max[k] = Math.max(max[k], values[i + k])
        }
      }
      bounds.min = min
      bounds.max = max
    }

    this.json.accessors.push({
      bufferView: view, componentType: FLOAT, count, type, ...bounds, ...extras,
    })
    return this.json.accessors.length - 1
  }

  ushorts(values, type = 'SCALAR', target = ELEMENT_ARRAY_BUFFER) {
    const array = new Uint16Array(values)
    const view = this.#view(new Uint8Array(array.buffer), target)
    const size = { SCALAR: 1, VEC4: 4 }[type]
    this.json.accessors.push({
      bufferView: view,
      componentType: USHORT,
      count: values.length / size,
      type,
      ...(type === 'SCALAR'
        ? { min: [Math.min(...values)], max: [Math.max(...values)] }
        : {}),
    })
    return this.json.accessors.length - 1
  }

  ubytes(values, type = 'VEC4', target = ARRAY_BUFFER) {
    const array = new Uint8Array(values)
    const view = this.#view(array, target)
    const size = { SCALAR: 1, VEC4: 4 }[type]
    this.json.accessors.push({
      bufferView: view, componentType: UBYTE, count: values.length / size, type,
    })
    return this.json.accessors.length - 1
  }

  node(node) {
    this.json.nodes.push(node)
    return this.json.nodes.length - 1
  }

  material(material) {
    this.json.materials.push(material)
    return this.json.materials.length - 1
  }

  /** Packs the whole thing into one .glb, which is one file to ship. */
  glb() {
    const binary = new Uint8Array(this.length)
    let at = 0
    for (const chunk of this.chunks) {
      binary.set(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk), at)
      at += chunk.byteLength
    }

    this.json.buffers = [{ byteLength: binary.byteLength }]

    const text = new TextEncoder().encode(JSON.stringify(this.json))
    const jsonPad = (4 - (text.byteLength % 4)) % 4
    const jsonChunk = new Uint8Array(text.byteLength + jsonPad).fill(0x20)
    jsonChunk.set(text)

    const binPad = (4 - (binary.byteLength % 4)) % 4
    const binChunk = new Uint8Array(binary.byteLength + binPad)
    binChunk.set(binary)

    const total = 12 + 8 + jsonChunk.byteLength + 8 + binChunk.byteLength
    const out = new Uint8Array(total)
    const head = new DataView(out.buffer)

    head.setUint32(0, 0x46546c67, true) // "glTF"
    head.setUint32(4, 2, true)
    head.setUint32(8, total, true)
    head.setUint32(12, jsonChunk.byteLength, true)
    head.setUint32(16, 0x4e4f534a, true) // "JSON"
    out.set(jsonChunk, 20)
    const binAt = 20 + jsonChunk.byteLength
    head.setUint32(binAt, binChunk.byteLength, true)
    head.setUint32(binAt + 4, 0x004e4942, true) // "BIN"
    out.set(binChunk, binAt + 8)

    return out
  }
}
