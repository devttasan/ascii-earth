const out = process.stdout;

export function enterScreen() {
  out.write("\x1b[?1049h\x1b[?25l\x1b[2J")
}

export function leaveScreen() {
  out.write("\x1b[0m\x1b[?25h\x1b[?1049l")
}

export function screenSize() {
  return { cols: out.columns ?? 80, rows: out.rows ?? 24 };
}

export function onResize(handler: () => void) {
  out.on("resize", handler)
}


export type Key = "quit" | "pause" | "faster" | 'slower' | "zoomIn" | "zoomOut"
const KEYS: Record<string, Key> = {
  q: "quit",
  "\x03": "quit", // Ctrl-C,
  " ": "pause",
  "\x1b[C": "faster", // ->,
  "\x1b[D": "slower", // <-,
  "\x1b[A": "zoomIn", // ↑,
  "\x1b[B": "zoomOut" // ↓
}

export function onKey(handler: (key: Key) => void) {
  const stdin = process.stdin
  if (stdin.isTTY) stdin.setRawMode(true)

  stdin.setEncoding("utf8")
  stdin.resume()

  stdin.on('data', (data: string) => {
    for (const press of data.match(/\x1b\[[A-D]|[\s\S]/g) ?? []) {
      const key = KEYS[press]
      if (key) handler(key)
    }
  });


}

export function draw(frame: string) {
  out.write(frame)
}
