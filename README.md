# Konstrukta

*(Nombre de trabajo anterior: FactoBotcraft. El juego toma el nombre de la mina donde transcurre.)*

> **Juega una vez. Tus bots juegan para siempre.**

Un juego de automatización y fusión en una mina 3D. Juegas con tus manos, el juego convierte lo que haces en código, y ese código se vuelve un ejército de bots que minan, fusionan y construyen por ti, incluso mientras duermes.

Referencias: *Craftomation 101* (programar bots), *Factorio* (cadenas de producción), *Minecraft* (excavación, luz y noche) y *MineMergeMatic* (fusión y progreso idle).

- 🎮 **[Jugar en el navegador](https://claude.ai/artifact/7uvEEsNdTZR4SbgkCmTTUG)** (página privada: compártela desde su menú)
- 📄 [Documento de diseño (GDD)](docs/GDD.md)
- 📖 [Biblia del universo (lore)](docs/LORE.md)
- 🎨 [Biblia de estilo visual](docs/STYLE.md) · [Encargos de arte](docs/ART_BRIEFS.md) · [Guía visual para artistas](https://claude.ai/artifact/2UzdEjR1BY5WjzdZYVN5pL)

## Cómo se juega

Al empezar una partida, **ADA te guía con un tutorial interactivo** (4 capítulos: lo básico, grabar y automatizar, el editor y las herramientas). Señala en pantalla lo que tienes que pulsar y espera a que lo hagas. Puedes repetir cualquier capítulo desde el botón de ayuda (?) de arriba a la derecha.

1. **Juega.** Mueve al Capataz con WASD o las flechas. Camina contra una veta para picarla. E o Espacio suelta o recoge minerales.
2. **Fusiona.** Dos minerales iguales, uno encima del otro, se funden en uno de nivel superior. En el montacargas se venden por Lumen (✦), y cada ✦ enciende una ventana de Alba, la ciudad de la superficie.
3. **Graba.** Pulsa R, trabaja y vuelve a pulsar R. Tus acciones se convierten en un programa de bloques, y ADA te propone generalizarlo (bucles, condiciones).
4. **Automatiza.** Ensambla bots, cárgales rutinas y mejóralas en el editor visual, que resalta en vivo el bloque en ejecución.
5. **Vuelve.** Tus bots trabajan el **Turno de Noche** mientras no juegas. Al volver te espera el **Reporte del Amanecer**, con lo ganado, los incidentes (con enlace al bloque exacto que falló) y un timelapse.

| Tecla | Acción |
|---|---|
| WASD / flechas | Mover al Capataz (contra una roca o veta: picar) |
| E / Espacio / Enter | Soltar o recoger |
| R | Grabar / detener grabación |
| Q | Girar la cámara 90° |
| F | Volver a seguir al Capataz |
| Tab | Seleccionar el siguiente bot |
| B / L | Colocar bot / lámpara |
| P | Pausa |
| Rueda / arrastrar | Zoom / mover la cámara |

En pantallas táctiles aparecen una cruceta y un botón USAR.

## Qué incluye

- **5 capas** con mecánicas propias: la forja, la oscuridad, la lava que late y la gravedad girada.
- **18 instrucciones** que se desbloquean **fusionándolas** en el Taller de Código (`mover + mover = avanzar hasta`, `repetir + si = mientras`, …).
- **Bots con linaje:** al fusionar dos bots, el hijo sube de nivel, hereda código y rasgos y elige un rasgo nuevo entre tres.
- **Glitchlings** que corrompen el código de noche, y lámparas, bots Farolero y la instrucción `restaurar` para defenderse.
- **Biblioteca del Gremio:** guarda, forkea e **intercambia rutinas con códigos FBC1** (sin servidor).
- **Desafío Diario:** la misma cueva para todo el mundo ese día, comparada con la marca de ADA calculada en vivo.
- **Historia completa:** 22 órdenes de trabajo, 10 páginas del diario de Mireya, 13 entradas del Códex, 3 bots antiguos reparables y un final.
- Audio sintetizado en tiempo real: cada fusión suena una nota pentatónica más aguda.
- Guardado local automático, exportación e importación de partidas.

## Desarrollo

```bash
npm install
npm run dev              # servidor de desarrollo (http://localhost:5173)
npm test                 # pruebas de la simulación (vitest)
npm run typecheck        # comprobación de tipos
npm run build            # compilación de producción en dist/
npm run build:artifact   # una sola página HTML en dist-artifact/ (three.js desde CDN)
```

### Arquitectura

```
src/
  sim/        Simulación determinista por ticks (sin DOM ni render)
    types.ts      Tipos del mundo, bots, bloques de programa
    content.ts    Datos de diseño: minerales, rasgos, capas, instrucciones, economía
    world.ts      Generación procedural de capas por semilla
    sim.ts        Máquina virtual de los bots, acciones, Glitchlings, lava, señales
    program.ts    Utilidades de programas, códigos FBC1, sugerencias de generalización
    commands.ts   Acciones del jugador (comprar, construir, linaje, capas, taller)
    offline.ts    Turno de Noche y Reporte del Amanecer
    challenge.ts  Desafío Diario y la solución de referencia de ADA
    save.ts       Guardado local
  content/    Historia: lore, diario, Códex, órdenes de trabajo
  render/     Diorama 3D con Three.js (bloom, tilt-shift, luces cálidas)
  ui/         Interfaz DOM: HUD, editor de bloques, paneles y pantallas
  audio/      Sonido sintetizado con WebAudio
  game.ts     Controlador: bucle, entrada, eventos, cámara
tests/        Pruebas de la simulación, economía, desafío y comandos
```

La simulación es **pura y determinista**: el mismo estado y la misma semilla producen siempre el mismo resultado. Eso permite simular el Turno de Noche, reproducir timelapses, calcular la marca de ADA en el Desafío Diario y probarlo todo sin navegador.
