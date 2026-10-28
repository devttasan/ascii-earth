# ascii earth · devtasan

A spinning ASCII Earth in the terminal, built with TypeScript, Node.js and plain ANSI escape codes, no rendering libraries.
Built for [**devtasan**](https://www.youtube.com/@devtasan) (ASMR Programming, no talking).

## Run

```bash
npm install
npm start
```

## Controls

| Key | Action |
| --- | ------ |
| `space` | pause / resume |
| `→` / `←` | spin faster / slower |
| `↑` / `↓` | zoom in / out |
| `q` / `ctrl+c` | quit |

## Structure

```text
src/main.ts      render loop (30 fps) and key handling
src/globe.ts     sphere projection, axial tilt, day/night lighting, city lights
src/map.ts       world map, 2° per character
src/noise.ts     fractal noise for surface texture
src/screen.ts    colored character buffer
src/terminal.ts  alternate screen, raw input, resize
```

Map made from [Natural Earth](https://www.naturalearthdata.com/) data (public domain).
