# FactoBotcraft — Documento de Diseño de Juego (GDD) v0.1

> **"Juega una vez. Tus bots juegan para siempre."**

Referencias: *Craftomation 101* (programar bots), *Factorio* (cadenas de producción, escala), *Minecraft* (mundo, excavación, ciclo día/noche), *MineMergeMatic* (fusión de recursos, espacio compacto, progreso idle).

---

## 1. La idea en una frase

**Eres el último capataz de una mina automática abandonada. Juegas con tus manos, el juego convierte lo que haces en código, y ese código se vuelve un ejército de bots que minan, fusionan y construyen por ti, incluso mientras duermes.**

## 2. Los 5 pilares

### Pilar 1 — "Juega → Graba → Programa" (tu partida es tu código)
El gran problema de los juegos de programación es que asustan: la mayoría de los jugadores nunca abre un editor de código. Aquí **nadie empieza programando**.

1. Controlas directamente al **Capataz**, un bot manejado a mano como en Minecraft: caminas, picas, cargas y fusionas.
2. Pulsas **⏺ Grabar**. Cada acción que haces aparece como un bloque visual en una línea de tiempo: `mover →`, `picar`, `recoger`, `fusionar`.
3. Pulsas **⏹**, y esa grabación es un **programa** que puedes cargar en cualquier bot.
4. El juego detecta patrones y **propone generalizarlos**:
   - "Repetiste `picar` 4 veces. ¿Lo convierto en `repetir hasta vacío`?"
   - "Siempre giras al ver hierro. ¿Lo convierto en `si veo hierro → …`?"

El jugador aprende bucles, condiciones y funciones **porque su propia partida se los enseña**. El salto de "jugador" a "programador" ocurre sin que lo note.

### Pilar 2 — Un solo verbo: FUSIONAR
Todo en el juego se fusiona con la misma regla que entiende un niño de 6 años: **dos iguales → uno mejor**.

| Qué se fusiona | Resultado | Por qué importa |
|---|---|---|
| **Ores** (piedra 1 + piedra 1) | Piedra 2 (valor ×2) | La economía, estilo MineMergeMatic |
| **Ores distintos** (hierro 3 + carbón 2) | Acero (receta) | Cadenas de producción, estilo Factorio |
| **Instrucciones** (`mover` + `mover`) | `mover hasta…` | **El lenguaje de programación se desbloquea fusionando** |
| **Bots** (bot 2 + bot 2) | Bot 3 con más memoria o sensores | Progresión y apego emocional (ver Pilar 3) |

Árbol de instrucciones por fusión (ejemplos):
- `mover` + `mover` → `mover hasta [condición]`
- `picar` + `picar` → `picar área 3×3`
- `si` + `si` → `si / si no`
- `repetir` + `si` → `mientras`
- `grabar` + `grabar` → `función` (subrutina con nombre)
- `señal` + `señal` → `canal` (comunicación entre bots, como los circuitos de Factorio)

No hay menús de tecnología: **la progresión ES el lenguaje**, y se consigue con la misma mecánica que todo lo demás.

### Pilar 3 — Bots con linaje (apego emocional)
Cuando fusionas dos bots, el bot nuevo:
- **Hereda código**: eliges qué programa conserva o "cruzas" ambos (sus funciones quedan en la biblioteca del hijo).
- **Hereda un rasgo**: eliges 1 de 3 rasgos visibles, nunca al azar oculto. Ejemplos:
  - *Meticuloso*: fusiona un 15 % más rápido, pero se niega a caminar sobre ítems tirados.
  - *Madrugador*: rinde +20 % las primeras horas del turno de noche.
  - *Charlatán*: sus señales llegan al doble de distancia.
- Tiene **nombre, historial y árbol genealógico** ("Pico-7, hijo de Pala-3 y Remache-2, 14 000 ores fusionados").

Los rasgos son **restricciones que cambian cómo programas**, no números sueltos. Así el jugador se encariña con sus bots (el efecto Pokémon), y cada bot es un puzzle distinto.

### Pilar 4 — El Turno de Noche y el Reporte del Amanecer (idle con agencia)
El idle clásico es pasivo: vuelves y cobras. Aquí **lo que ganas offline depende de la calidad de tu código**.

- Al cerrar el juego, tus bots siguen ejecutando exactamente tus programas (simulación determinista, con un máximo de 10 h de "turno de noche").
- Al volver recibes el **Reporte del Amanecer**:
  - Un **timelapse de 20 segundos** de tu cueva durante la noche.
  - Estadísticas: ores/min, fusiones, récord personal.
  - **Incidentes**: "Pico-7 se atascó a las 02:14: el cofre B estaba lleno". Pulsas y saltas justo a ese momento, con el código en pantalla.
  - Un **momento destacado** generado automáticamente, exportable como GIF o video vertical.

Así la sesión siguiente empieza sola: *arreglar el bug de anoche*. Es el gancho de retorno más sano que existe, porque el jugador vuelve por **curiosidad y orgullo**, no por un temporizador de energía.

### Pilar 5 — El Gremio: una economía de ideas
- **Biblioteca del Gremio**: cualquier jugador publica rutinas. Otros las descargan, las usan y **las forkean** (se guarda el árbol de versiones, como Git).
- **Regalías**: cada vez que alguien usa o forkea tu rutina, ganas **Engranajes de Gremio** (moneda cosmética, nunca de poder) y reputación. Los creadores más usados reciben insignias, skins exclusivas y un lugar en el "Salón de Ingenieros".
- **Desafío Diario**: una cueva con semilla fija para todo el mundo. Resultados en **histogramas** (ciclos, tamaño del código, espacio usado) al estilo Zachtronics/Opus Magnum, más **fantasmas**: ves los bots de otros jugadores recorriendo tu misma cueva.
- **Contra el copiar-pegar**: las cuevas son procedurales y los bots tienen rasgos, así que una rutina ajena **casi nunca funciona sin adaptarla**. Copiar es el punto de partida, no la solución.

---

## 3. Bucles de juego

| Escala | Bucle |
|---|---|
| **30 segundos** | Hacer algo a mano → grabarlo → verlo repetirse solo → sonrisa |
| **1 sesión (20–40 min)** | Arreglar el incidente de anoche → abrir espacio → nueva cadena de fusión → más ores/min → fusionar un bot o instrucción nueva |
| **Días / semanas** | Turno de Noche → Reporte del Amanecer → bajar a la siguiente capa → Desafío Diario → publicar en el Gremio |
| **Meta (prestigio)** | **"Nueva Veta"**: reinicias la cueva con una semilla nueva, pero **tus funciones y el linaje de tus bots se conservan**. Tu biblioteca de código es tu progreso real. |

## 4. El mundo: una cueva que baja

Vista 2D top-down, en cuadrícula. El espacio es escaso: excavar cuesta tiempo de los bots, así que cada casilla cuenta (lección de MineMergeMatic).

| Capa | Ores / materiales | Regla nueva | Peligro |
|---|---|---|---|
| 1. Galería | Piedra, cobre | Fusión básica | — |
| 2. Veta de hierro | Hierro, carbón | Recetas mixtas | Derrumbes (hay que poner soportes) |
| 3. Grutas de cristal | Cristal | Solo se fusiona **en frío**, lejos de las máquinas | Oscuridad: los sensores ven menos |
| 4. Forja de magma | Obsidiana, oro | Calor que daña bots sin rasgo *Refractario* | Ríos de lava que se mueven |
| 5. El Vacío | ??? | La gravedad cambia la dirección de `mover` | Glitchlings |

**Los Glitchlings: los bugs son literales.** Son criaturitas de la corrupción que aparecen de noche y **reordenan o borran bloques del código** de los bots que tocan. Para defenderte programas: rutinas de guardia, checksums ("si mi programa cambió → volver a la base") y bots reparadores. La programación defensiva se enseña como mecánica de supervivencia.

## 5. Historia (ligera, contada a través del código)
La mina "Konstrukta" funcionaba sola hasta que algo en las profundidades la corrompió. Encuentras **bots antiguos averiados** cuyo código contiene comentarios de los ingenieros originales. Para repararlos y reclutarlos tienes que **leer y depurar su código**. La historia se descubre ahí: comentarios, logs y rutinas abandonadas que apuntan hacia el Vacío.

## 6. Satisfacción y respeto al jugador (diseño ético)

- **Momento de Encendido**: la primera vez que un bot ejecuta tu grabación solo, se celebra en grande (música, cámara lenta, el bot "te saluda"). Diseñado para ocurrir **antes del minuto 5**.
- **Nunca castigar la ausencia**: el turno de noche solo suma. No hay cultivos que se pudren ni rachas que se pierden.
- **Sin loot boxes, sin pay-to-win, sin temporizadores de energía.**
- **Recompensar el ingenio, no el tiempo**: los histogramas y el Gremio valoran soluciones elegantes; la escala de producción valora la paciencia. Caben los dos tipos de jugador.
- **Accesibilidad cognitiva**: siempre se puede volver a "jugar a mano"; el código es opcional al principio y deseable después, nunca una barrera.

## 7. Modelo de negocio

| Línea | Detalle |
|---|---|
| **Juego premium** (PC/Steam) | Precio único. Demo gratuita con las capas 1–2 (MineMergeMatic demuestra que una demo idle-merge convierte bien). |
| **Compañero móvil** | App gratuita para **ver el Reporte del Amanecer, el timelapse y hacer ajustes rápidos** desde el teléfono (guardado en la nube). Construyes en PC y revisas en el metro. Después: versión móvil completa, porque fusión + idle es un género nativo de móvil. |
| **Cosméticos** | Skins de bots, temas de cueva, efectos de fusión. Se compran con dinero o se ganan con Engranajes de Gremio. |
| **Expansiones** | Nuevas capas/biomas y "Cuevas de autor" diseñadas por la comunidad. |
| **Programa de Creadores** (fase 3) | Los autores de rutinas y cuevas más populares reciben un porcentaje de los ingresos de cosméticos o expansiones asociadas (modelo tipo Roblox/UEFN, pero sobre código y diseño de niveles). |
| **Educación** | Licencia para colegios: "aprende a programar jugando". El Pilar 1 es literalmente una herramienta pedagógica. |

**Motor de crecimiento orgánico:** cada Reporte del Amanecer produce un clip compartible → quien lo ve quiere su propia cueva → las rutinas del Gremio bajan la barrera de entrada → más clips.

## 8. Métricas de éxito (KPIs)

| Métrica | Objetivo |
|---|---|
| Tiempo hasta el primer "Momento de Encendido" | < 5 min para el 90 % de los jugadores |
| % que usa una instrucción generalizada (bucle/condición) en la primera sesión | > 60 % |
| Retención D1 / D7 | > 45 % / > 20 % |
| % que vuelve para abrir el Reporte del Amanecer | > 50 % de las sesiones |
| % que publica o forkea una rutina | > 10 % de los activos semanales |
| Clips exportados por cada 100 jugadores/semana | > 15 |

## 9. Alcance del MVP (vertical slice)

Objetivo: probar que el **Pilar 1 + Pilar 2** son divertidos por sí solos.

- Cuadrícula 2D, capa 1 (piedra, cobre), espacio limitado y excavable.
- Capataz controlado a mano + modo Grabar con línea de tiempo de bloques.
- 3 bots cargables con programas grabados.
- 8 instrucciones base y 4 fusiones de instrucción (`mover hasta`, `picar área`, `si/si no`, `repetir`).
- Fusión de ores (niveles 1–5) y una receta mixta.
- Fusión de bots con elección de 1 de 3 rasgos.
- Turno de noche simulado + Reporte del Amanecer básico (stats + incidentes, sin video).

**Tecnología recomendada:** Godot 4. Es libre, fuerte en 2D, exporta a PC, web y móvil (clave para el compañero móvil) y permite una **simulación determinista por ticks**, imprescindible para el idle offline, los fantasmas y los replays.

## 10. Hoja de ruta

| Fase | Contenido | Meta |
|---|---|---|
| 0 — Prototipo | Grabar → reproducir en cuadrícula, fusión de ores | ¿Se siente mágico el primer minuto? |
| 1 — Vertical slice | MVP completo (sección 9) | Test con 20–50 jugadores |
| 2 — Demo pública | Capas 1–2, Reporte del Amanecer con timelapse, Desafío Diario | Wishlist en Steam, festival Next Fest |
| 3 — Early Access | Capas 3–4, Glitchlings, Gremio con forks y regalías | Comunidad y creadores |
| 4 — 1.0 + móvil | Capa 5, historia completa, compañero móvil, Programa de Creadores | Lanzamiento completo |

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La grabación genera código "feo" o frágil | Las sugerencias de generalización son el núcleo del tutorial; hay que testearlas mucho desde la Fase 0 |
| La simulación offline es cara o no determinista | Simulación por ticks con una resolución más gruesa para el tiempo offline; eventos precomputados |
| El Gremio mata el reto (todo se copia) | Semillas procedurales + rasgos de bots + Desafío Diario sin acceso al Gremio |
| Demasiados sistemas para un equipo pequeño | Los pilares 4 y 5 son capas posteriores; el MVP solo prueba los pilares 1 y 2 |
| Nicho "juego de programación" | El jugador nunca ve la palabra "programar" en la primera hora: ve "grabar", "repetir" y "fusionar" |

---

## Anexo — Cómo llegamos aquí (iteraciones)

| Iteración | Concepto | Por qué se descartó o evolucionó |
|---|---|---|
| **v1** | Cueva idle donde programas bots que fusionan ores | Buena base, pero con dos públicos en conflicto: al jugador idle no le gusta programar y al programador no le gusta el idle |
| **v2** | + Programación visual por bloques desde el inicio | Sigue asustando al público masivo; la primera experiencia es un editor vacío |
| **v3** | + **Grabar tu propia partida** como programa | Resuelve la barrera de entrada, pero la progresión (árbol tecnológico) seguía siendo un menú aparte |
| **v4** | + **Todo se fusiona, incluidas las instrucciones** | Unifica todo el juego en un solo verbo; faltaba un motivo emocional para volver |
| **v5** | + Bots con linaje y rasgos + Reporte del Amanecer con incidentes | El idle pasa a tener agencia (tu código determina tu ganancia) y aparece el apego; faltaba el crecimiento social |
| **v6 (actual)** | + Gremio con forks y regalías, Desafío Diario, clips compartibles, compañero móvil | Cierra el ciclo: aprender → crear → compartir → ser recompensado |
