# Konstrukta — Encargos de arte

Fichas listas para enviar a ilustradores y artistas 3D. Cada ficha se apoya en la [biblia de estilo](STYLE.md) y en el [lore](LORE.md); adjunta ambos documentos al encargo.

**Qué entregamos al artista:** este documento, `STYLE.md`, `LORE.md`, el logotipo en SVG (`src/ui/icons.ts` → `EMBLEM`) y capturas del juego.
**Qué pedimos de vuelta:** archivo fuente por capas (PSD, Krita o similar), PNG final a tamaño exacto y una versión sin texto de cada pieza.

> Los tamaños de Steam cambian de vez en cuando. Antes de encargar, compruébalos en la documentación de Steamworks («Graphical Assets»). Los de abajo son los vigentes a finales de 2024.

---

## A. Arte de tienda de Steam (prioridad máxima)

La cápsula es lo primero que ve un comprador y decide si hace clic. **Una sola ilustración maestra** a alta resolución, compuesta para poder recortarse en todos los formatos.

### A1. Ilustración maestra
- **Escena:** corte de la mina en diorama, como una maqueta vista desde un lado. Arriba, la silueta de Alba de noche con unas pocas ventanas encendidas. Abajo, una galería cálida donde tres bots trabajan en cadena: uno pica una veta de cobre, otro lleva un mineral y el tercero lo suelta sobre otro igual en el momento exacto de la **fusión**, con un destello de luz ámbar. El Capataz, de espaldas con su casco y su linterna, observa. En una esquina oscura, un Glitchling violeta asoma curioso, no amenazante.
- **Historia en una imagen:** «la luz que tú encendiste sube hasta la ciudad». Un hilo de luz puede unir la fusión con el montacargas y las ventanas de Alba.
- **Composición:** el punto focal (la fusión) en el tercio central; espacio despejado arriba o a un lado para el logotipo.
- **Luz:** la escena es oscura, la luz es la protagonista (ver STYLE §7).
- **Evitar:** humanos con cara, armas, ciencia ficción fría, texto dentro de la ilustración.

### A2. Formatos derivados
| Pieza | Tamaño (px) | Notas |
|---|---|---|
| Cápsula de cabecera | 920 × 430 | Logotipo grande, legible a 50 % |
| Cápsula pequeña | 462 × 174 | **Solo logotipo + un bot**; se ve diminuta en listas |
| Cápsula principal | 1232 × 706 | Portada de la tienda |
| Cápsula vertical | 748 × 896 | Recorte centrado en la fusión |
| Cápsula de biblioteca | 600 × 900 | Vertical, logotipo abajo |
| Héroe de biblioteca | 3840 × 1240 | Sin logotipo ni texto; panorámica de la mina |
| Logotipo de biblioteca | 1280 × 720 | PNG transparente, a partir del logotipo SVG |
| Fondo de la página | 1438 × 810 | Muy oscuro y poco detallado (va detrás del texto) |
| Portada de eventos | 800 × 450 | Variante reutilizable para anuncios |

**Prueba de legibilidad obligatoria:** la cápsula pequeña debe entenderse a 25 % de su tamaño.

---

## B. Retratos de personajes

### B1. ADA
- **Qué es:** la radio de la mina; en realidad, la grabación de la ingeniera Mireya.
- **Cómo representarla:** **no tiene cuerpo.** Una radio de latón y madera con una rejilla por la que sale una onda de luz cian. Opcionalmente, en el reflejo de la carcasa se intuye, muy sutil, la silueta de una mujer con el pelo recogido (el secreto del juego).
- **Formato:** 512 × 512 (interfaz) y 1024 × 1024 (tienda y redes).
- **Emoción:** cálida, cercana, un poco melancólica.

### B2. Mireya Calderón
- **Qué es:** la Ingeniera Jefe desaparecida. Solo existe a través de su diario.
- **Cómo representarla:** **de espaldas o en silueta**, nunca con el rostro. Mono de trabajo, cuaderno bajo el brazo, casco en la mano, mirando hacia la escalera del Vacío que brilla en violeta.
- **Formato:** 1024 × 1024 y una variante de 1920 × 1080 para la escena final.

### B3. El Capataz
- **Cómo representarlo:** casco ámbar con linterna frontal, siempre de espaldas o con la luz de la linterna ocultando la cara. Sin marcas de género.

---

## C. Ilustraciones del diario (10 viñetas)

Una por página del diario (`src/content/lore.ts` → `DIARY`). Estilo de **boceto a tinta sobre papel de cuaderno** (sepia y un único color de acento), como si Mireya las hubiera dibujado.
Tamaño: 800 × 520, fondo papel `#EFE2C6`.

| Página | Qué dibujar |
|---|---|
| d1 | Manos grabando un gesto; un bot pequeño imitándolas |
| d2 | Dos cristales iguales tocándose, ondas de sonido entre ellos |
| d3 | La forja con hierro y carbón, humo en espiral |
| d4 | Pala-3 con su pantalla mostrando una flecha al revés |
| d5 | Un Glitchling imitando los pasos de Remache-2 en la oscuridad |
| d6 | Una puerta sellada con cadenas y, en el suelo, una linterna encendida |
| d7 | La lava latiendo y Lumbre-9 contando con los dedos (pinzas) |
| d8 | El Núcleo como un gran cristal escuchando, con Glitchlings como dedos |
| d9 | Una radio de latón y, reflejado en ella, el perfil de Mireya |
| d10 | Una mano ofreciendo un cristal violeta brillante hacia la oscuridad |

---

## D. Modelos 3D (fase posterior)

Hoy los modelos se generan por código (`src/render/models.ts`). Un artista 3D puede sustituirlos sin tocar la lógica: el juego solo necesita un archivo por pieza.

- **Formato:** glTF 2.0 (`.glb`), escala 1 unidad = 1 casilla, mirando hacia +Z.
- **Estilo:** low-poly con sombreado plano, sin texturas o con una paleta de colores (atlas de 256 px). Nada de mapas de normales.
- **Presupuesto:** bots de 1.500 a 3.000 triángulos; minerales de 200 como máximo.
- **Piezas:** 6 niveles de bot (misma base con la silueta que crece: remaches, depósito, cúpula, faros, aro), 9 accesorios de rasgo como piezas separadas, el Capataz, 3 bots antiguos, montacargas, forja, lámpara, baliza, Núcleo, Glitchling.
- **Cara-pantalla:** un plano independiente llamado `face` (el juego le pinta los ojos).
- **Brazo con pico:** un nodo llamado `arm` con el pivote en el hombro (el juego lo anima).

---

## E. Uso de IA generativa

Recomendación: **solo para explorar** (moodboards, bocetos de composición, variantes de color), nunca como arte final. Motivos:
1. Steam exige declarar el contenido generado con IA en la página del juego.
2. Parte del público indie lo rechaza, y eso afecta a las reseñas.
3. La coherencia entre piezas (lo que hace que un juego se vea profesional) es justo lo que peor mantiene.

Si se usa para explorar, estas indicaciones mantienen el estilo (en inglés, que es como mejor responden estas herramientas):

```
Cozy low-poly isometric diorama of an underground mine cut in cross-section,
warm lantern light in darkness, small rounded tin-toy robots with screen faces
and caterpillar tracks, glowing copper crystals, brass and wood materials,
soft bloom, tilt-shift miniature look, palette: deep plum black #17121A,
amber #FFB85C, copper #E07B39, cyan accents #6FE3D6, no humans faces, no text
```

```
Silhouette of a female mining engineer seen from behind, holding a notebook,
standing before a glowing violet crystal chasm, warm lantern at her feet,
painterly, cozy melancholic mood, brass and leather details, no face visible
```

---

## F. Checklist antes de aprobar una pieza

- [ ] ¿Respeta la paleta (el ámbar como único acento dominante)?
- [ ] ¿La luz cuenta la historia (oscuridad y luz ganada)?
- [ ] ¿Se lee a tamaño pequeño?
- [ ] ¿Sin caras humanas, armas ni ciencia ficción fría?
- [ ] ¿Entregada con el archivo fuente por capas y una versión sin texto?
