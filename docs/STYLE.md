# Konstrukta — Biblia de estilo visual

Este documento define cómo se ve Konstrukta. Cualquier pieza (iconos, ilustraciones, modelos 3D, cápsulas de Steam, interfaz) debe poder justificarse con estas reglas. Si una pieza no encaja, se cambia la pieza, no la regla, salvo que se actualice este documento.

## 1. La idea visual en una frase

**Una mina oscura y acogedora donde la luz es la recompensa.** Todo lo que el jugador construye o consigue brilla en tonos cálidos; todo lo que amenaza (la estática) brilla en violeta frío. La oscuridad no da miedo: es el lienzo sobre el que el jugador enciende luces.

## 2. Tres pilares

1. **Calidez artesanal.** Latón, madera, hollín, cristal. Nada de cromo ni neón de ciencia ficción. Los bots parecen juguetes de hojalata bien cuidados, no robots militares.
2. **Luz como narrativa.** Cuanto más avanza el jugador, más luz hay en pantalla: lámparas, minerales de nivel alto, ventanas de Alba. Las piezas de marketing deben mostrar ese contraste entre la oscuridad y la luz ganada.
3. **Legibilidad de maqueta.** Es un juego de programación: cada casilla, bot y mineral se entiende de un vistazo. Siluetas claras, formas redondeadas, poca textura, detalle concentrado donde importa.

## 3. Paleta

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Fondo | Tinta de cueva | `#17121A` | Fondos, cielo de Alba, sombras profundas |
| Superficie | Hollín | `#221A25` / `#2C2230` | Paneles, placas de interfaz |
| Borde | Pizarra | `#4A3A42` | Bordes, separadores |
| Marco | Latón | `#C9A063` | Marcos, insignias de nivel, remaches |
| **Acento** | **Luz de lámpara** | **`#FFB85C`** | Lumen, botones principales, títulos, todo lo que es recompensa |
| Mineral inicial | Cobre | `#E07B39` | Cobre, primer brillo del juego |
| Información | Cristal | `#6FE3D6` | Código, pantallas de los bots, ADA |
| Amenaza | Estática | `#C04CFF` | Glitchlings, código corrupto, Fragmentos |
| Texto | Papel | `#F1E4CF` | Texto principal (nunca blanco puro) |
| Texto secundario | Ceniza | `#A8969A` | Pistas, etiquetas |

**Reglas:** el ámbar es el único acento dominante; el cian se reserva para «código e información» y el violeta para «estática». Nunca se usan juntos en la misma pieza como colores principales, salvo en escenas de corrupción.

**Minerales** (cada uno con su color, siempre emisivo en 3D): piedra `#9A8F86`, cobre `#E07B39`, hierro `#B8C4D6`, carbón `#3B3440`, acero `#7FB2E5`, cristal `#6FE3D6`, oro `#FFC94A`, obsidiana `#5B3A7A`, obsidoro `#FF7A3D`, nucleita `#D78BFF`.

**Capas** (luz ambiental dominante): Galería cobre, Veta de Hierro acero, Grutas cristal, Forja de Magma naranja lava, Vacío violeta nucleita.

## 4. Tipografía

| Rol | Fuente | Notas |
|---|---|---|
| Títulos y logotipo | **Lilita One** | Robusta y amable, como un cartel de mina. Solo para títulos, nunca para párrafos. |
| Texto | **Atkinson Hyperlegible** | Diseñada para la máxima legibilidad; encaja con el ángulo educativo. |
| Código y datos | **JetBrains Mono** | Bloques de programa, números, costes (con cifras tabulares). |

Etiquetas pequeñas en mayúsculas con espaciado de letras de 0,12 em.

## 5. Formas

- **Esquinas redondeadas** en todo lo construido por humanos o bots (radio aproximado de 1/6 del lado). Las rocas son facetadas, low-poly, sin redondear.
- **Bots:** cuerpo de caja redondeada, orugas, antena con luz del color de su nivel y una **cara-pantalla** con dos ojos. La expresividad está en los ojos, nunca en una boca.
- **Minerales:** poliedros cuya complejidad crece con el nivel (tetraedro, octaedro, icosaedro, dodecaedro…). A partir del nivel 6, un halo.
- **Estática:** lo único con bordes afilados, dentados o parpadeantes.

## 6. Iconos

- Cuadrícula de **24 × 24** con 2 px de margen; trazo de **1,75 px**, extremos y uniones **redondeados**.
- **Bitono:** trazo en `currentColor` y un relleno interior al 22 % de opacidad para dar volumen. Nada de degradados.
- Metáforas **de la mina**, no genéricas de software: la biblioteca son lomos de libros del Gremio, el taller es una llave inglesa, «guardar» es un disquete que ya existe en el mundo del Gremio.
- Se leen a **16 px**. Si un icono necesita texto para entenderse, se rediseña.
- Nunca emojis en la interfaz final: se ven distintos en cada sistema y rompen la coherencia.

## 7. Iluminación y cámara (3D y marketing)

- Luz clave cálida (`#FFE8CC`) desde arriba a la izquierda; relleno frío muy tenue desde el cielo; **las fuentes de luz del mundo mandan** (lámparas, lava, minerales).
- Bloom suave en todo lo emisivo; ligero **tilt-shift** para reforzar la sensación de maqueta.
- Cámara en diorama a unos 55–60° de inclinación. Las piezas de marketing pueden bajar a 30–40° para ganar dramatismo.
- Niebla del color de la capa: los bordes del mapa se funden, nunca se cortan.

## 8. Qué evitar

- Estética de ciencia ficción fría (azules neón, cromo, hologramas).
- Violencia o armas: los bots no disparan y los Glitchlings no mueren, se atrapan.
- Realismo fotográfico, texturas ruidosas o suciedad excesiva.
- Blanco puro y negro puro.
- Personajes humanos con rostro detallado: Mireya aparece de espaldas, en silueta o a través de sus objetos; el Capataz nunca muestra la cara.

## 9. Referencias

*Tiny Glade* y *Townscaper* (calidez de maqueta), *Dorfromantik* (paleta suave y legible), *Shapez 2* (fábrica legible en 3D), *Craftomation 101* (bots low-poly con personalidad), *Minecraft* (luz en cuevas), *A Short Hike* (ternura y color), los carteles de seguridad minera de principios del siglo XX (tipografía y latón).
