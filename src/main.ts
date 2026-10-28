import { draw, enterScreen, leaveScreen, onKey, screenSize, onResize } from "./terminal.ts"
import { Globe } from "./globe.ts"
import { Screen, hex } from "./screen.ts"

const FPS = 30
const SPACE = hex("#05070d")

const globe = new Globe()
let screen = createScreen()

function createScreen() {
  const { cols, rows } = screenSize()
  globe.resize(cols, rows)
  return new Screen(cols, rows, SPACE)
}


function quit() {
  leaveScreen()
  process.exit(0)
}


enterScreen()
process.on("exit", leaveScreen)

onResize(() => {
  process.stdout.write("\x1b[2J")
  screen = createScreen()
})

onKey((key) => {
  if (key === "quit") quit()
  if (key === "pause") globe.togglePause()
  if (key === "faster") globe.faster()
  if (key === "slower") globe.slower()
  if (key === "zoomIn") globe.zoomIn()
  if (key === "zoomOut") globe.zoomOut()
})

let last = performance.now()

setInterval(() => {
  const now = performance.now()
  globe.update(Math.min(0.1, (now - last) / 1000))
  last = now

  globe.draw(screen)
  draw(screen.render())

}, 1000 / FPS)
