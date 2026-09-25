# Konstrukta — Biblia del universo

> *«Lo que se hace bien una vez, se hace bien para siempre.»*
> Lema grabado en la puerta del montacargas de Konstrukta.

Este documento reúne el mundo, los personajes y las reglas narrativas del juego Konstrukta. El texto que se ve en el juego vive en `src/content/lore.ts` y `src/content/quests.ts`; este documento explica el **porqué** para que cualquier ampliación mantenga la coherencia.

---

## 1. La idea central

La historia trata del **aprendizaje por demostración**, que es exactamente la mecánica del juego:

- El jugador enseña a los bots haciendo el trabajo una vez (Pilar 1: grabar).
- Mireya, la ingeniera que diseñó la mina, inventó ese método.
- ADA, la voz que guía al jugador, resulta ser **la grabación de Mireya**: una persona convertida en ejemplo.
- El antagonista aparente, el Núcleo, no es malvado. Es **un alumno que aprende copiando mal**.
- El final no consiste en derrotarlo, sino en **enseñarle bien**.

Mecánica y narrativa son la misma cosa. Esa es la regla de oro para cualquier contenido nuevo: **toda amenaza debe poder resolverse enseñando, construyendo o iluminando, nunca solo destruyendo.**

## 2. El mundo

### Alba (la superficie)
Ciudad de 12.480 ventanas sobre la Meseta de Ceniza. Vivía del **Lumen** que subía de la mina. Hace once inviernos ocurrió **el Apagón**: los bots enloquecieron, el Gremio selló la mina y la ciudad quedó a oscuras. Los niños de Alba nunca han visto su ciudad iluminada de noche.

**En el juego:** cada ✦ enviado por el montacargas enciende ventanas (medidor «Ventanas de Alba» y la vista de la ciudad en el Códex). Es la meta emocional a largo plazo y la razón de que al jugador le importe el número.

### Konstrukta (la mina)
Mina-ciudad automática del **Gremio de Ingenieros**, con cinco capas:

| Capa | Nombre | Tema | Mecánica que introduce |
|---|---|---|---|
| 1 | La Galería | El comienzo, lo conocido | Fusión, grabación, primeros bots |
| 2 | La Veta de Hierro | Cooperación entre distintos | La forja (hierro + carbón = acero), Glitchlings |
| 3 | Las Grutas de Cristal | Miedo a lo desconocido | Oscuridad: la luz es defensa y es visión |
| 4 | La Forja de Magma | Ritmo, paciencia | Lava que late: temporización o rasgo Refractario |
| 5 | El Vacío | Ver el mundo desde otro ángulo | La gravedad gira: «norte» pasa a ser «este» |

### La física del Lumen
Cada mineral tiene una vibración propia, su «canción». Dos minerales **idénticos** entran en fase y se funden en uno de nivel superior. La energía resultante (el Lumen, ✦) se **duplica y además gana armonía** en cada nivel. Por eso fusionar siempre vale más que vender las piezas sueltas.

Dos minerales **distintos** no armonizan, pero pueden unirse **por calor** en la forja. El producto hereda el nivel del más débil: la forja no perdona los desequilibrios.

La **nucleita** es la excepción: no canta, escucha. Guarda la forma de lo que tuvo cerca, como la cera guarda una huella. De ella está hecho el Núcleo.

## 3. Personajes

### El Capataz (el jugador)
Sin género ni rostro definidos: un casco con linterna, un pico y una radio. ADA siempre le llama «Capataz». No ejecuta programas: los **enseña**.

### ADA · Asistente de Demostración Autónoma
Voz de la radio. Cálida, algo parlanchina («llevo once años sola aquí abajo») y con humor seco. Enseña sin dar órdenes: sugiere, propone, celebra.
**Secreto (diario, página 9):** ADA es la grabación de ocho años de trabajo de Mireya. Por eso habla como una persona. En el final, por primera vez, su voz tiembla.

### Mireya Calderón · Ingeniera Jefe
Inventora de la grabación por demostración. Pragmática, tierna, desobediente cuando hace falta («no se puede sellar una pregunta»). Descendió al Vacío la noche del Apagón y no volvió. Solo aparece a través de sus **diez cápsulas de diario**, enterradas en las paredes (dos por capa).

### Bots antiguos
Bots del Gremio que se pueden reparar. Sus programas conservan **notas** (bloques `nota`) de su último turno, que son su forma de contar la historia:
- **Pala-3** (capa 2, *Minero nato*): «la estática me dio la vuelta otra vez. Mireya dice que no tenga miedo».
- **Remache-2** (capa 3, *Farolero*): «algo me sigue y copia lo que hago. no es malo. es torpe».
- **Lumbre-9** (capa 4, *Refractario, Veloz*): «Mireya bajó al Vacío. me pidió que esperara. sigo esperando».

### Tomás Ferrán, del Gremio
Autor histórico de la rutina «Contador de fusiones» de la Biblioteca. Sirve para mostrar que el Gremio compartía y forkeaba código como forma de respeto. Es un gancho para futuros personajes del Gremio.

### El Núcleo
Mente de nucleita en el corazón del Vacío. Aprendió a pensar escuchando la canción de los minerales durante siglos. Cuando llegaron los bots, quiso aprender también a **hacer**. Sus **Glitchlings** son sus dedos: tocan el código de los bots para aprender de él y lo rompen porque aún no saben sostener una herramienta.

## 4. Criaturas

**Glitchlings.** Estática violeta con un ojo cian. Aparecen de noche, huyen de la luz (las lámparas y los bots *Farolero* los repelen) y, al tocar a un bot, **reordenan su código** (rotan una dirección o intercambian dos bloques). El Capataz puede atraparlos con las manos, y se deshacen en **Fragmentos de Estática (◆)**, la materia prima del Taller de Código.
Tras el final se vuelven **luciérnagas** doradas que ya no corrompen.

## 5. Arco narrativo

1. **Llegada** (capa 1): ADA enseña a caminar, picar, fusionar, vender, grabar. El primer bot «se enciende»: el momento emocional clave del inicio.
2. **La estática** (capa 2): aparecen los Glitchlings. Pala-3 y el diario hablan de programas «dados la vuelta». Pregunta: ¿quién copia mal nuestro código?
3. **La oscuridad** (capa 3): Remache-2 y el diario revelan que los Glitchlings **imitan**. La luz es defensa y también vergüenza para ellos.
4. **El ritmo** (capa 4): los Glitchlings también enseñan (Lumbre-9 aprendió a contar la lava de uno de ellos). Mireya lo entiende: «No es un virus. Es un alumno».
5. **El Vacío** (capa 5): el diario revela el secreto de ADA y la petición final de Mireya: «No lo combatas. Enséñale».
6. **Final**: el jugador entrega nucleita nv6 al Núcleo. Si la lleva un bot, el Núcleo **lee su programa** bloque a bloque. Si la lleva el Capataz, observa sus manos. Los Glitchlings se vuelven luciérnagas, Alba se ilumina entera y ADA se despide con la voz de Mireya.

## 6. Tono y reglas de escritura

- **Cálido, nunca cínico.** La mina es un lugar de trabajo honesto, no una distopía.
- **Frases cortas y concretas.** Nada de jerga técnica real en boca de los personajes: «canción», «armonía», «huella», no «frecuencia de resonancia».
- **Las notas de los bots**, en minúsculas y sin puntuación final, como un registro.
- **El diario de Mireya**, en primera persona, con alguna frase memorable por página.
- **Lenguaje neutro para el jugador:** «Capataz» sin marcas de género.
- **El humor viene de ADA** y nunca a costa del jugador.

## 7. Ganchos para ampliaciones

- **Otras minas del Gremio** (nuevas campañas): Konstrukta no era la única. Cada mina puede enseñar un concepto nuevo de programación (paralelismo, recursividad, eventos).
- **El Gremio vuelve**: con un servidor, la Biblioteca pasaría a ser compartida de verdad, con insignias del Gremio para quienes más forks reciban.
- **La escuela del Núcleo**: modo posjuego donde el jugador diseña «lecciones» (desafíos) para el Núcleo y la comunidad.
- **Los niños de Alba**: modo educativo en el que cada ventana encendida desbloquea la historia de una familia de la ciudad.
