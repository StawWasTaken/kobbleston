import * as THREE from 'three'
import type { Solid } from './controller'

/**
 * What an experience is.
 *
 * Content and data, executed by the engine. Not a program, not a bundle, and
 * not something that needs a new Launcher when it changes: an experience is a
 * manifest the runtime already knows how to read, which is the whole reason
 * the Launcher can stay still while experiences move.
 *
 * This is V1 and is meant to grow. Everything in it is declarative on
 * purpose, so that the same file can be written by Creator, checked on a
 * server, and read by a runtime that does not trust whoever wrote it.
 */

export type Vec3 = [number, number, number]

export type ExperienceBlock = {
  /** A name a script can look it up by, later. */
  id?: string
  kind: 'box'
  at: Vec3
  size: Vec3
  /** Turn around Y, in degrees, because a person is going to type this. */
  turn?: number
  colour?: string
  /** False for decoration you can walk through. */
  solid?: boolean
}

export type ExperienceManifest = {
  /** The format this file was written for, so an old file can be recognised. */
  format: 1
  id: string
  name: string
  by?: string
  /** Where K6 arrives, in stons. */
  spawn: { at: Vec3; facing?: number }
  sky?: { colour?: string; fog?: number }
  light?: { sun?: number; ambient?: number; from?: Vec3 }
  blocks: ExperienceBlock[]
}

/** Nothing here trusts the file: a manifest is user content like any other. */
export function readManifest(raw: unknown): ExperienceManifest {
  const data = raw as Partial<ExperienceManifest>
  if (!data || typeof data !== 'object') throw new Error('That experience is not readable.')
  if (data.format !== 1) throw new Error('That experience was made for another version of Kobblon.')
  if (!Array.isArray(data.blocks)) throw new Error('That experience has nothing in it.')
  if (data.blocks.length > 20000) throw new Error('That experience is too big to open.')

  const vec = (value: unknown, fallback: Vec3): Vec3 => (
    Array.isArray(value) && value.length === 3 && value.every((n) => Number.isFinite(n))
      ? [value[0], value[1], value[2]] as Vec3
      : fallback
  )

  return {
    format: 1,
    id: String(data.id ?? 'untitled'),
    name: String(data.name ?? 'Untitled'),
    by: data.by ? String(data.by) : undefined,
    spawn: {
      at: vec(data.spawn?.at, [0, 4, 0]),
      facing: Number.isFinite(data.spawn?.facing) ? Number(data.spawn?.facing) : 0,
    },
    sky: data.sky ?? {},
    light: data.light ?? {},
    blocks: data.blocks.slice(0, 20000).map((block) => ({
      id: block?.id ? String(block.id) : undefined,
      kind: 'box',
      at: vec(block?.at, [0, 0, 0]),
      size: vec(block?.size, [1, 1, 1]),
      turn: Number.isFinite(block?.turn) ? Number(block?.turn) : 0,
      colour: typeof block?.colour === 'string' ? block.colour : '#6c7080',
      solid: block?.solid !== false,
    })),
  }
}

export type BuiltExperience = {
  manifest: ExperienceManifest
  group: THREE.Group
  solids: Solid[]
  /** Blocks that were given an id, for scripts and for Creator to select. */
  named: Map<string, THREE.Mesh>
}

/** Turns a manifest into something in a scene. */
export function buildExperience(manifest: ExperienceManifest): BuiltExperience {
  const group = new THREE.Group()
  group.name = manifest.name
  const solids: Solid[] = []
  const named = new Map<string, THREE.Mesh>()

  // One geometry, many meshes: a scene of boxes should cost one buffer.
  const unit = new THREE.BoxGeometry(1, 1, 1)
  const materials = new Map<string, THREE.MeshStandardMaterial>()

  for (const block of manifest.blocks) {
    const colour = block.colour ?? '#6c7080'
    let material = materials.get(colour)
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.85 })
      materials.set(colour, material)
    }

    const mesh = new THREE.Mesh(unit, material)
    mesh.position.set(...block.at)
    mesh.scale.set(...block.size)
    if (block.turn) mesh.rotation.y = (block.turn * Math.PI) / 180
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    if (block.id) named.set(block.id, mesh)

    if (block.solid) {
      mesh.updateMatrixWorld(true)
      solids.push({ box: new THREE.Box3().setFromObject(mesh) })
    }
  }

  return { manifest, group, solids, named }
}
