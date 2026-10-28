export type Color = number;

export const hex = (value: string): Color => parseInt(value.slice(1), 16)

export function mix(a: Color, b: Color, t: number): Color {
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t) << shift;
  }

  return ch(16) | ch(8) | ch(0)
}

const fg = (c: Color) => `\x1b[38;2;${(c >> 16) & 255};${(c >> 8) & 255};${c & 255}m`
const bg = (c: Color) => `\x1b[48;2;${(c >> 16) & 255};${(c >> 8) & 255};${c & 255}m`

export class Screen {
  private chars: string[]
  private colors: Uint32Array;
  private backs: Uint32Array;
  // what is already on screen, so each frame only redraws changed cells
  private shown: string[];


  constructor(readonly cols: number, readonly rows: number, readonly background: Color) {
    this.chars = new Array(cols * rows).fill("")
    this.colors = new Uint32Array(cols * rows)
    this.backs = new Uint32Array(cols * rows).fill(background)
    this.shown = new Array(cols * rows).fill("")
  }

  clear() {
    this.chars.fill(" ")
    this.backs.fill(this.background)
  }

  set(x: number, y: number, ch: string, color: Color, back = this.background) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return
    const i = y * this.cols + x
    this.chars[i] = ch
    this.colors[i] = color;
    this.backs[i] = back
  }

  text(x: number, y: number, value: string, color: Color) {
    [...value].forEach((ch, i) => this.set(x + i, y, ch, color));
  }

  render(): string {
    let frame = ""
    let cursor = -1
    let currentFg = -1
    let currentBg = -1

    for (let i = 0; i < this.chars.length; i++) {
      const ch = this.chars[i]
      const color = this.colors[i]
      const back = this.backs[i]
      const key = ch == " " ? ` ${back}` : `${ch}${color}/${back}`
      if (key === this.shown[i]) continue

      const row = Math.floor(i / this.cols)
      const col = i % this.cols
      if (cursor !== i) frame += `\x1b[${row + 1};${col + 1}H`


      if (back !== currentBg) frame += bg((currentBg = back))
      if (ch !== " " && color !== currentFg) frame += fg((currentFg = color))
      frame += ch
      // after the last column the terminal does not move to the next row by itself
      cursor = col === this.cols - 1 ? -1 : i + 1;
    }
    return frame
  }

}
