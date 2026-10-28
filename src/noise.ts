function hash(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 66826563) + Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}


const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t


// Smooth 3d value noise in [0, 1]
function noise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz)
  const corner = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz)
  const front = lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), fx), lerp(corner(0, 1, 0), corner(1, 1, 0), fx), fy);
  const back = lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), fx), lerp(corner(0, 1, 1), corner(1, 1, 1,), fx), fy)
  return lerp(front, back, fz)
}


// A few layers of noise, each smaller and fainter: cloud-like shapes
export function fbm(x: number, y: number, z: number) {
  let sum = 0
  let amp = 0.5
  for (let i = 0; i < 4; i++) {
    sum += noise(x, y, z) * amp
    x *= 2; y *= 2; z *= 2
    amp /= 2
  }

  return sum / 0.9375
}
