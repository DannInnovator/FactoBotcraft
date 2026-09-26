# Konstrukta — Documento de Diseño de Juego (GDD) v0.2

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

Cuadrícula por capa, vista como diorama 3D (ver sección 4b). El espacio es escaso: excavar cuesta tiempo de los bots, así que cada casilla cuenta (lección de MineMergeMatic).

| Capa | Ores / materiales | Regla nueva | Peligro |
|---|---|---|---|
| 1. Galería | Piedra, cobre | Fusión básica | — |
| 2. Veta de hierro | Hierro, carbón | Recetas mixtas | Derrumbes (hay que poner soportes) |
| 3. Grutas de cristal | Cristal | Solo se fusiona **en frío**, lejos de las máquinas | Oscuridad: los sensores ven menos |
| 4. Forja de magma | Obsidiana, oro | Calor que daña bots sin rasgo *Refractario* | Ríos de lava que se mueven |
| 5. El Vacío | ??? | La gravedad cambia la dirección de `mover` | Glitchlings |

**Los Glitchlings: los bugs son literales.** Son criaturitas de la corrupción que aparecen de noche y **reordenan o borran bloques del código** de los bots que tocan. Para defenderte programas: rutinas de guardia, checksums ("si mi programa cambió → volver a la base") y bots reparadores. La programación defensiva se enseña como mecánica de supervivencia.

## 4b. Dirección visual: 3D "diorama cozy" sobre cuadrícula lógica

**Decisión:** el juego se **renderiza en 3D estilizado**, pero la **lógica es una cuadrícula 2D por capa**. Así tenemos la belleza del 3D con la claridad que necesita un juego de programación (`mover →` siempre significa exactamente una casilla).

| Aspecto | Decisión |
|---|---|
| **Simulación** | Cuadrícula de casillas por capa; las capas se apilan en profundidad. Determinista, por ticks. |
| **Render** | 3D low-poly estilizado con sombreado suave (o voxel, ver abajo). |
| **Cámara** | Ortográfica en ángulo isométrico por defecto (legibilidad) con rotación en pasos de 90°, zoom libre y un **modo cine** en perspectiva para el timelapse del Reporte del Amanecer. |
| **Cueva legible** | Vista de **diorama en corte**: sin techo, y las paredes cercanas a la cámara se recortan o se vuelven translúcidas. Cada capa es una "maqueta" y bajar de capa es bajar por la maqueta. |
| **Lo cozy** | La cueva es oscura: **la luz es la recompensa**. Lámparas cálidas, ores que brillan (emisión + bloom), vapor, polvo en el aire, un leve tilt-shift que da sensación de miniatura. |
| **Feedback de fusión** | Cada fusión tiene un "pop" (escala elástica, partículas, sonido tonal que sube con el nivel). Es el momento más repetido del juego y debe dar gusto verlo mil veces. |
| **Bots** | Cuerpos simples hechos de piezas modulares, con **una pantalla-cara expresiva** (ojos) que comunica su estado: trabajando, atascado, feliz o corrompido. Los rasgos del linaje se ven como accesorios. |
| **Producción de arte** | Kit modular de casillas (suelo, pared, ore, máquina) + bots ensamblados por piezas. Opción económica para un equipo pequeño: **voxel** (MagicaVoxel), que además conecta con la estética de Minecraft. |
| **Rendimiento** | Instanciado (MultiMesh en Godot) para ores y bots, LOD simple y luces horneadas cuando sea posible, para que cientos de bots funcionen en PC y en el compañero móvil. |

Referencias visuales: *Tiny Glade*, *Townscaper*, *Dorfromantik*, *Shapez 2* (fábrica sobre cuadrícula en 3D), *Craftomation 101* (bots low-poly en mundos pequeños), *Minecraft* (voxel y luz en cuevas).

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

- Cuadrícula lógica de la capa 1 (piedra, cobre) renderizada en 3D con cajas grises e iluminación básica; espacio limitado y excavable.
- Capataz controlado a mano + modo Grabar con línea de tiempo de bloques.
- 3 bots cargables con programas grabados.
- 8 instrucciones base y 4 fusiones de instrucción (`mover hasta`, `picar área`, `si/si no`, `repetir`).
- Fusión de ores (niveles 1–5) y una receta mixta.
- Fusión de bots con elección de 1 de 3 rasgos.
- Turno de noche simulado + Reporte del Amanecer básico (stats + incidentes, sin video).

**Nombre:** el juego se llama **Konstrukta**, como la mina (antes, FactoBotcraft).

**Tecnología elegida:** TypeScript + Three.js en el navegador (la v0.1 anterior recomendaba Godot 4). Se cambió por tres motivos: 1) el juego se puede **jugar al instante desde un enlace**, sin instalar nada, lo que es clave para la demo y para compartir; 2) la simulación determinista en TypeScript puro corre igual en el navegador, en las pruebas y en un futuro servidor del Gremio; 3) empaquetar para Steam (Tauri/Electron) y móvil (Capacitor/PWA) sigue siendo directo. Si el proyecto crece hacia consolas, la simulación se puede portar tal cual porque no depende del render.

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

## 12. Estado de implementación (v0.2)

Todo lo descrito en este documento está implementado y se puede jugar, salvo lo marcado como futuro.

| Sistema | Estado | Notas |
|---|---|---|
| Pilar 1 · Juega → Graba → Programa | ✅ | Grabación con R, 3 tipos de sugerencia de ADA (patrón repetido, instrucciones seguidas, «si veta lista») que además **desbloquean** `repetir` y `si`. El bot se ensambla donde empezó la grabación. |
| Pilar 2 · Todo se fusiona | ✅ | Minerales (12 niveles, valor ×2 más bonus de armonía), recetas de forja, **9 fusiones de instrucciones** en el Taller y fusión de bots. |
| Pilar 3 · Linaje | ✅ | Herencia de código a elegir, rasgos acumulados y 1 rasgo nuevo entre 3; 9 rasgos con efecto real en la simulación. |
| Pilar 4 · Turno de Noche | ✅ | 30 min simulados con exactitud y el resto proyectado (tope de 10 h). Reporte del Amanecer con incidentes enlazados al bloque exacto y timelapse cinematográfico con exportación de clip .webm. |
| Pilar 5 · Gremio | 🟡 | Biblioteca con forks, autores, uso y **códigos FBC1 para compartir sin servidor**. Las regalías y el ranking global necesitan backend (futuro). |
| Desafío Diario | ✅ | Semilla por fecha, variantes diarias y la marca de ADA calculada en vivo con su programa de referencia (que el jugador puede guardar y estudiar). Fantasmas y ranking global: futuro. |
| Distinciones del Gremio | ✅ | 23 cadenas de logros con 3 rangos (65 en total) en `src/content/achievements.ts`, en tres familias: Oficio (progreso), Ingenio (ganar sin tocar al Capataz, líneas de producción completas, código elegante, red estable, señales, balizas, funciones compartidas, noches sin estática, Desafío) y Crónica (historia, con dos secretas). La pestaña del Códex aparece con la primera distinción; cada rango revela el siguiente y los de Ingenio dan Fragmentos de Estática. |
| 5 capas y peligros | ✅ | Forja, oscuridad con lámparas, lava que late, gravedad girada y Glitchlings. |
| Historia | ✅ | 22 órdenes de trabajo, 10 páginas de diario, 13 entradas de Códex, 3 bots antiguos reparables y el final. Ver `docs/LORE.md`. |
| Dirección visual | ✅ | Diorama 3D low-poly: luz cálida, bloom, tilt-shift, caras-pantalla con 8 estados de ánimo y partículas de fusión. |
| Audio | ✅ | Sintetizado: fusiones pentatónicas, reverb de cueva y música generativa. |
| Compañero móvil | 🟡 | La página ya funciona en móvil con controles táctiles; falta la app con guardado en la nube. |

### Próximos pasos
1. **Playtest** con 20–50 personas midiendo los KPIs de la sección 8 (sobre todo el tiempo hasta el Momento de Encendido).
2. **Servidor del Gremio**: biblioteca compartida, regalías, fantasmas y ranking del Desafío Diario.
3. **Pase de arte y sonido**: modelos a mano para los bots de cada nivel y música compuesta por capas.
4. **Empaquetado**: Steam (Tauri) con logros, y app móvil compañera con guardado en la nube.

## 13. La escalera de la automatización

Cada escalón resuelve un problema que el anterior hizo evidente. El jugador no recibe herramientas «porque sí»: primero siente el atasco y después recibe la solución.

| Escalón | Cuándo | Qué se desbloquea | Problema que resuelve |
|---|---|---|---|
| **Aprendiz** | Capa 1, inicio | Grabar, bots, `repetir`, `si`, montacargas por sus 4 lados | «Hago siempre lo mismo a mano» |
| **Oficial** | Capa 1, con dos bots trabajando | **Cofre**, `soltar/recoger` hacia una casilla vecina, cruces sin atasco (los bots se intercambian), condiciones de cofre | «Mis bots se estorban por las mismas casillas» |
| **Artesano** | Capa 2 | **Forja** y **dínamo** (red eléctrica por capa), condición `carga ≥` | «Necesito combinar materiales distintos… y eso cuesta energía» |
| **Mecánico** | Capa 2, con un bot de nivel 3 y 200 de carga generada | **Motor eléctrico** (bots nv3+ consumen carga; sin ella, mitad de velocidad) y **crisol de armonía** | «Quiero bots mejores y fusionar sin supervisión» |
| **Maestro** | Capa 3 | **Acumulador**, **funciones** (encapsular bloques), señales, `ir a baliza` | «Mis programas son largos y se repiten; mi red se queda corta» |
| **Ingeniero del Gremio** | Capa 4–5 | **Turbina de lava** (energía pasiva), `llevar a su par`, `restaurar` | «Quiero una mina que funcione sola, incluso contra la estática» |

### Por qué la energía funciona así
- **Los bots de nivel 1–2 son de cuerda y nunca se detienen.** Así el tutorial y el primer bot no dependen de una infraestructura que el jugador aún no entiende.
- **Desde el nivel 3 los bots llevan motor eléctrico.** Subir de nivel (fusionar bots) crea la necesidad de energía: el linaje y la red se exigen mutuamente.
- **Sin carga no se paran: trabajan a mitad de velocidad.** Castigar con una parada total rompería el Turno de Noche y generaría frustración. La penalización se nota, pero nunca bloquea.
- **La carga sale de los mismos minerales que el Lumen.** Cada mineral es una decisión: venderlo para Alba o quemarlo para la mina. Aparecen flujos que se alimentan entre sí: una línea de carbón mueve el dínamo, el dínamo mueve el crisol y la forja, y estos alimentan la línea que vende.
- **La turbina de lava da energía pasiva** como recompensa tardía a un buen diseño del espacio.

### Funciones
- Se desbloquean en el Taller (`repetir + repetir`). En el editor, **ƒ** selecciona bloques contiguos y «Crear función» los mueve a la Biblioteca y deja una llamada en su lugar.
- Aparecen en la paleta como bloques propios.
- **En la memoria del bot, el cuerpo de cada función cuenta una sola vez**, aunque se llame muchas veces. Es la recompensa por encapsular.
- **Editar una función en la Biblioteca actualiza a todos los bots que la usan.** Arreglar una vez, arreglar para siempre (el lema de Konstrukta).

### Siguientes escalones (ideas para después de la 1.0)
- **Funciones con parámetros** (`vender(dirección)`) y valores de retorno para condiciones.
- **Filtros en cofres** («solo cobre», «solo nivel ≥ 4») y un **clasificador** que reparte por tipo.
- **Vagonetas sobre raíles** programables para transporte a larga distancia, sin quitar protagonismo a los bots.
- **Planos de zona**: copiar una distribución de edificios y bots con sus programas y pegarla en otra veta (los *blueprints* de Factorio).
- **Prioridades de la red**: qué consumidores reciben carga primero cuando escasea.
- **Sensores**: condiciones sobre el estado de la red, de otros bots o de un cofre lejano, para coordinar sin señales explícitas.

## Anexo — Cómo llegamos aquí (iteraciones)

| Iteración | Concepto | Por qué se descartó o evolucionó |
|---|---|---|
| **v1** | Cueva idle donde programas bots que fusionan ores | Buena base, pero con dos públicos en conflicto: al jugador idle no le gusta programar y al programador no le gusta el idle |
| **v2** | + Programación visual por bloques desde el inicio | Sigue asustando al público masivo; la primera experiencia es un editor vacío |
| **v3** | + **Grabar tu propia partida** como programa | Resuelve la barrera de entrada, pero la progresión (árbol tecnológico) seguía siendo un menú aparte |
| **v4** | + **Todo se fusiona, incluidas las instrucciones** | Unifica todo el juego en un solo verbo; faltaba un motivo emocional para volver |
| **v5** | + Bots con linaje y rasgos + Reporte del Amanecer con incidentes | El idle pasa a tener agencia (tu código determina tu ganancia) y aparece el apego; faltaba el crecimiento social |
| **v6 (actual)** | + Gremio con forks y regalías, Desafío Diario, clips compartibles, compañero móvil | Cierra el ciclo: aprender → crear → compartir → ser recompensado |
