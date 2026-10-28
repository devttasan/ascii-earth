import { type Color, type Screen, hex, mix } from "./screen.ts"
import { tileAt } from "./map.ts"

import { fbm } from "./noise.ts"


const SPACE = hex("#05070d")
const WHITE = hex("#f2f5f8")
const CITY = hex("#ffc86b")
const DUSK = hex("#ff7a30")

const ATMOSPHERE = hex("#2f7bff")
const ASPECT = 2
const AMBIENT = 0.12
const TILT = (23.4 * Math.PI) / 180
const DAY = 24

// characters from dark to bright, and the colors they fade between
type Surface = { chars: string; dark: Color; lit: Color };
const OCEAN: Surface = { chars: " .:~", dark: hex("#06162e"), lit: hex("#2c86e0") }
const LAND: Surface = { chars: ".-=+*#%@", dark: hex("#0f2414"), lit: hex("#8ed65a") }
const SNOW: Surface = { chars: ".-=+*#%@", dark: hex("#1e2733"), lit: hex("#f4f8fb") }


type Vec = [number, number, number]
const normalize = ([x, y, z]: Vec): Vec => {
  const len = Math.hypot(x, y, z)
  return [x / len, y / len, z / len]
}

const SUN = normalize([-0.75, 0.35, 0.55]) // direction towards the sumn


type Star = { x: number; y: number; ch: string; phase: number }


export class Globe {
  private stars: Star[] = []
  private spin = 0 // radians
  private time = 0;
  private speed = 1 // 1 = one turn every DAY seconds, negative spins backwards
  private paused = false
  private zoom = 1

  resize(cols: number, rows: number) {
    this.stars = Array.from({ length: Math.floor((cols * rows) / 60) }, () => ({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      ch: Math.random() < 0.85 ? "." : "+",
      phase: Math.random() * Math.PI * 2

    }))
  }

  togglePause() {
    this.paused = !this.paused
  }

  faster() {
    this.speed = Math.min(8, this.speed + 0.5)
  }

  slower() {
    this.speed = Math.max(-8, this.speed - 0.5)
  }

  zoomIn() {
    this.zoom = Math.min(1.6, this.zoom * 1.1)
  }

  zoomOut() {
    this.zoom = Math.max(0.4, this.zoom / 1.1)
  }

  update(dt: number) {
    this.time += dt
    if (!this.paused) this.spin += ((Math.PI * 2) / DAY) * this.speed * dt
  }

  draw(s: Screen) {
    s.clear()

    for (const star of this.stars) {
      const twinkle = Math.round(Math.sin(this.time * 1.5 + star.phase) * 2 + 2) / 4

      s.set(star.x, star.y, star.ch, mix(SPACE, WHITE, 0.15 + twinkle * 0.5))
    }

    const radius = Math.floor((s.rows - 2) * 0.45 * this.zoom)
    const cx = s.cols / 2
    const cy = (s.rows - 1) / 2

    for (let row = 0; row < s.rows - 1; row++) {
      for (let col = 0; col < s.cols; col++) {
        const x = (col + 0.5 - cx) / (radius * ASPECT);
        const y = (cy - row - 0.5) / radius
        const d2 = x * x + y * y

        if (d2 > 1) {
          const glow = 1 - (Math.sqrt(d2) - 1) / 0.15
          if (glow > 0) {
            const lit = Math.max(0, (x * SUN[0] + y * SUN[1]) / Math.sqrt(d2))
            const halo = Math.round(glow * glow * (0.2 + lit * 0.8) * 6) / 6
            if (halo > 0) s.set(col, row, " ", SPACE, mix(SPACE, ATMOSPHERE, halo * 0.7))
          }
          continue
        }

        const z = Math.sqrt(1 - d2); // the point on the sphere facing us
        const light = Math.max(0, x * SUN[0] + y * SUN[1] + z * SUN[2])
        const facing = x * SUN[0] + y * SUN[1] + z * SUN[2];
        const brightness = AMBIENT + (1 - AMBIENT) * light;


        // undo the tilt, then the spin, to find whre on Earth this point is
        const tx = x * Math.cos(TILT) - y * Math.sin(TILT)
        const ty = x * Math.sin(TILT) + y * Math.cos(TILT)
        const lat = (Math.asin(ty) * 180) / Math.PI
        const lon = ((Math.atan2(tx, z) - this.spin) * 180) / Math.PI
        const tile = tileAt(lat, lon)

        let surface = OCEAN
        if (tile !== ".") surface = Math.abs(lat) > 62 ? SNOW : LAND


        let shine = 0
        if (surface === OCEAN) {
          const reflect = 2 * light * z - SUN[2]
          shine = Math.max(0, reflect) ** 24
        }
        const level = Math.min(1, brightness + shine)
        const i = Math.round(level * (surface.chars.length - 1))
        const shade = mix(surface.dark, surface.lit, i / (surface.chars.length - 1))
        let ch = surface.chars[i]
        let color = mix(shade, WHITE, 0.2 + shine * 0.6)
        let back = mix(SPACE, shade, 0.45)


        // a warm band where day turns into nigh
        const dusk = Math.max(0, 1 - Math.abs(facing) / 0.1)
        back = mix(back, DUSK, dusk * 0.3)


        // city lights come on at night
        if (tile === "o" && facing < 0.1) {
          const night = Math.min(1, (0.1 - facing) / 0.2)
          ch = night > 0.5 ? "*" : "+"
          color = mix(color, CITY, night)
          back = mix(back, mix(SPACE, CITY, 0.35), night)
        }

        // clouds turn a little faster than the ground
        const drift = this.spin * 1.15
        const px = tx * Math.cos(drift) - z * Math.sin(drift)
        const pz = tx * Math.sin(drift) + z * Math.cos(drift)
        const cloud = (fbm(px * 2.2, ty * 2.2, pz * 2.2) - 0.56) / 0.16
        if (cloud > 0) {
          const amount = Math.round(Math.min(1, cloud) * 4) / 4
          if (ch === "") ch = "."
          color = mix(color, mix(SPACE, WHITE, brightness), amount * 0.85)
          back = mix(back, mix(SPACE, WHITE, brightness * 0.6), amount * 0.6)
        }

        const rim = (1 - z) ** 3
        back = mix(back, ATMOSPHERE, rim * 0.6 * (0.2 + light))

        s.set(col, row, ch, color, back)

      }
    }
    const dim = hex("#5a6577")
    const help = "← → speed   ↑ ↓ zoom   space pause   q quit";
    s.text(Math.floor((s.cols - help.length) / 2), s.rows - 1, help, dim)
    s.text(2, s.rows - 1, this.paused ? "paused" : `speed ${this.speed.toFixed(1)}x`, dim)
  }

}
