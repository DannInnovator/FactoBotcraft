# Konstrukta — Paquete de prompts para Gemini

Generado desde `scripts/prompt-pack.mjs` (no editar a mano). Reglas de estilo en [STYLE.md](STYLE.md) y fichas de encargo en [ART_BRIEFS.md](ART_BRIEFS.md).

**Bloque de estilo** (ya va incluido en cada prompt):

```
Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail
```

## Paso 0 · Cómo usar este paquete

- Genera las piezas **en este orden**: la primera define el estilo de todo lo demás.
- Cuando una imagen te guste, **adjúntala como referencia** en las siguientes peticiones (Gemini acepta imágenes de entrada). Cada ficha indica qué referencia adjuntar.
- Cada prompt ya incluye el **bloque de estilo** y la lista de cosas a evitar. Cópialo entero.
- Si una imagen está casi bien, **pide cambios sobre esa misma imagen** («oscurece el fondo», «quita el segundo robot») en vez de regenerarla.
- Pásame las imágenes **adjuntándolas en el chat** con el nombre de archivo indicado. Yo las optimizo y las coloco en el juego.
- Antes de vender el juego: revisa las condiciones de uso comercial de Gemini y **declara en Steam** el contenido generado con IA.

## 1 · Ilustración maestra (define el estilo)

### Ilustración maestra

| | |
|---|---|
| Archivo | `keyart_master.png` |
| Proporción | 16:9 (lo más grande posible) |
| Adjuntar como referencia | Ninguna: esta es la referencia de todo lo demás |
| Dónde va | Pantalla de título, portada y base de las cápsulas de Steam |

Repítela hasta que el estilo sea exactamente el que quieres. Todo lo demás se parecerá a esta imagen.

```
Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a cross-section of a cozy underground mine seen from the side like a dollhouse. At the top, the dark silhouette of a small hillside city at night with only a few warm windows lit. Below, a warm cave gallery where three small rounded tin robots with glowing cyan screen-eyes work in a chain: one picks at a copper crystal vein, one carries a glowing copper gem, and the third drops its gem onto an identical gem on the floor at the exact moment of fusion, releasing a bright amber burst of light. A thin ribbon of amber light rises from the fusion up a lift shaft toward the city windows. A miner seen from behind wearing a yellow helmet with a headlamp watches. In a dark corner, a small curious violet crystalline creature peeks out, harmless. Composition: the fusion burst is the focal point in the central third; calm empty dark space in the upper area for a title. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Fondo de la pantalla de título

| | |
|---|---|
| Archivo | `keyart_title.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Fondo detrás del logotipo y los botones del menú inicial |

Igual que la maestra pero más tranquila y con el centro despejado.

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a wide calm view of the same mine diorama, the lift shaft with its glowing amber ring on the left third, one small robot resting with sleepy screen-eyes on the right third, gentle floating dust in lantern light. The whole center of the image is dark, soft and empty so a logo and menu can sit on top. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

## 2 · Arte de tienda de Steam

- Estas piezas se recortan de ilustraciones grandes. Genera en la proporción indicada y yo hago los recortes a los tamaños exactos.

### Cápsula vertical y de biblioteca

| | |
|---|---|
| Archivo | `steam_vertical.png` |
| Proporción | 3:4 (o 9:16) |
| Adjuntar como referencia | keyart_master |
| Dónde va | Steam: cápsula vertical (748 × 896) y de biblioteca (600 × 900) |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Vertical composition: a tall mine shaft. At the top, the night city with a few lit windows. In the middle, one small rounded tin robot holding up a glowing amber gem that bursts with light, looking up with happy cyan screen-eyes. At the bottom, darker cave layers with teal crystals and a faint violet glow far below. Leave the bottom fifth dark and calm for a logo. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Héroe de biblioteca (panorámica)

| | |
|---|---|
| Archivo | `steam_hero.png` |
| Proporción | 21:9 (o el más ancho disponible) |
| Adjuntar como referencia | keyart_master |
| Dónde va | Steam: héroe de biblioteca (3840 × 1240), sin logotipo |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Ultra-wide panoramic cross-section of the whole mine: from left to right the cave layers change color — warm copper gallery, steel-blue iron vein with a small forge, dark teal crystal grottoes lit by lanterns, orange pulsing lava forge, and finally a violet starry void with a huge glowing crystal heart. Tiny robots work in every layer. No text. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Fondo de la página de la tienda

| | |
|---|---|
| Archivo | `steam_background.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Steam: fondo de la página (1438 × 810); va detrás de texto |

```
In the exact same style as the reference image, but very dark and low detail: a soft out-of-focus view of cave walls with a few distant warm lantern glows and faint amber dust. Mostly dark plum #17121A, very low contrast, no focal point, suitable as a background behind text. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

## 3 · Personajes

### ADA, la radio de la mina

| | |
|---|---|
| Archivo | `char_ada.png` |
| Proporción | 1:1 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Retrato en los mensajes de ADA y en la tarjeta del tutorial |

ADA no tiene cuerpo: es una radio. El reflejo de Mireya es el secreto del juego; debe ser muy sutil.

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Portrait of an old brass-and-wood mining radio set on a workbench, round speaker grille emitting soft cyan sound-wave light, two small analog dials, a short antenna, warm and friendly like a character. In the polished brass casing, an extremely subtle reflection of a woman's silhouette with hair tied up, seen from behind, barely noticeable. Dark background, centered, plenty of margin. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Mireya Calderón (de espaldas)

| | |
|---|---|
| Archivo | `char_mireya.png` |
| Proporción | 1:1 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex (entrada de Mireya) y diario |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. A female mining engineer seen strictly from behind, work overalls, hair tied up, holding a worn notebook under one arm and her helmet in the other hand, standing at the top of a stone staircase that descends into a glowing violet crystal abyss. A small lantern at her feet casts warm light. Her face is never visible. Melancholic but hopeful mood. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Hoja de referencia de los bots (niveles 1 a 6)

| | |
|---|---|
| Archivo | `char_bots.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master (y, si quieres, una captura del juego con los bots en fila) |
| Dónde va | Referencia interna para mantener la coherencia (y futuros modelos 3D) |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Character reference sheet on a plain dark plum background: six small rounded tin-toy mining robots standing in a row, each with a screen face showing two cyan eyes, caterpillar tracks, a small pickaxe arm and an antenna with a glowing tip. They grow in size and detail from left to right: 1 cream body; 2 teal body with brass rivets; 3 copper body with a back tank; 4 steel-blue body with a glass dome on top; 5 violet body with side headlights; 6 golden body with a floating golden ring above. Evenly spaced, same lighting, front three-quarter view. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

## 4 · Diario de Mireya (10 viñetas)

- Estilo distinto a propósito: bocetos a tinta en el cuaderno de Mireya.
- Genera primero **diario_d1**; cuando te guste, **adjúntala como referencia** en las otras nueve para que todas parezcan del mismo cuaderno.

### Viñeta D1 · Día 1

| | |
|---|---|
| Archivo | `diario_d1.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | Ninguna (será la referencia de las demás viñetas) |
| Dónde va | Códex → Diario de Mireya, página «Día 1» |

```
Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: two human hands demonstrating a gesture with a small pickaxe while a tiny rounded robot beside them copies the same gesture. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D2 · Sobre el Lumen

| | |
|---|---|
| Archivo | `diario_d2.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Sobre el Lumen» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: two identical faceted crystals touching, concentric sound waves between them merging into one brighter crystal. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D3 · La forja

| | |
|---|---|
| Archivo | `diario_d3.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «La forja» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a small forge with an iron ingot and a lump of coal going in and a steel bar coming out, spiral smoke. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D4 · Estática

| | |
|---|---|
| Archivo | `diario_d4.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Estática» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a small robot whose screen face shows an arrow pointing the wrong way, a few jagged static marks around it. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D5 · Las grutas

| | |
|---|---|
| Archivo | `diario_d5.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Las grutas» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a small crystalline creature mimicking the footsteps of a robot in the dark, footprints side by side, a lantern being lit. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D6 · Asamblea

| | |
|---|---|
| Archivo | `diario_d6.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Asamblea» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a heavy door sealed with chains and, on the floor in front of it, a small lit lantern. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D7 · Latidos

| | |
|---|---|
| Archivo | `diario_d7.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Latidos» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a river of lava drawn with pulse lines like a heartbeat and a robot counting with its pincer: one, two, three, four (as tally marks, no words). Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D8 · Lo he entendido

| | |
|---|---|
| Archivo | `diario_d8.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Lo he entendido» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a huge crystal like a listening ear in the dark, with small crystalline creatures around it like fingers. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D9 · Sobre ADA

| | |
|---|---|
| Archivo | `diario_d9.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Sobre ADA» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a brass radio, and reflected in its casing the side profile of a woman, drawn delicately. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Viñeta D10 · Última página

| | |
|---|---|
| Archivo | `diario_d10.png` |
| Proporción | 3:2 |
| Adjuntar como referencia | diario_d1 |
| Dónde va | Códex → Diario de Mireya, página «Última página» |

```
In the exact same style as the reference image. Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer's field diary. Scene: a hand offering a glowing crystal toward a dark abyss, rays of light, the last page of a notebook. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

## 5 · El final

### El Núcleo aprende

| | |
|---|---|
| Archivo | `final_nucleo.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Diapositiva del final |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. In a violet starry void, a huge glowing crystalline heart with slowly rotating rings. A small robot has just delivered a bright violet gem into it; lines of light flow from the robot's screen into the crystal, as if the crystal is reading a lesson. Awe and calm. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Los Glitchlings se vuelven luciérnagas

| | |
|---|---|
| Archivo | `final_luciernagas.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Diapositiva del final |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Many small crystalline creatures, formerly violet, now glowing soft golden like fireflies, resting on the cave walls and floating in the air above working robots. Peaceful, magical, warm. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Alba iluminada

| | |
|---|---|
| Archivo | `final_alba.png` |
| Proporción | 16:9 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Última diapositiva del final y pestaña Alba del Códex |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. The small hillside city at night, now with every single window glowing warm amber, seen from a distance under a starry sky; below the city, a faint cut-away glimpse of the mine with its lit lanterns. Small silhouettes of children on a rooftop looking at the lights (no faces). Joyful, emotional. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

## 6 · Opcional: ilustraciones del Códex

- Una por entrada. Hazlas solo si te sobra tiempo: las del diario y el final aportan más.

### Konstrukta

| | |
|---|---|
| Archivo | `codex_konstrukta.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → Konstrukta |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: the entrance of the mine carved into a hillside, a big arched portal with brass trim and rails going in. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### El Lumen

| | |
|---|---|
| Archivo | `codex_lumen.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → El Lumen |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: two identical copper crystals merging into one bigger glowing crystal, sound-wave rings. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### El Gremio

| | |
|---|---|
| Archivo | `codex_gremio.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → El Gremio |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a round table of old engineers' tools, notebooks and blueprints of robots under a lamp, empty chairs. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### Glitchlings

| | |
|---|---|
| Archivo | `codex_glitchlings.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → Glitchlings |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a small violet crystalline creature with one cyan eye, curious, flickering static edges. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### La red de Konstrukta

| | |
|---|---|
| Archivo | `codex_red.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → La red de Konstrukta |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a copper dynamo with glowing cyan coils, cables running to a forge and a crucible. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### El crisol

| | |
|---|---|
| Archivo | `codex_crisol.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → El crisol |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: a brass crucible with molten amber light inside and two identical gems falling into it. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

### El Vacío

| | |
|---|---|
| Archivo | `codex_vacio.png` |
| Proporción | 4:3 |
| Adjuntar como referencia | keyart_master |
| Dónde va | Códex → El Vacío |

```
In the exact same style as the reference image. Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail. Scene: floating violet rock platforms in a starry void, gravity arrows bending sideways. Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.
```

