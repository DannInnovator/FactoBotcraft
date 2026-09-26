# Traspaso: generar el arte de Konstrukta con Gemini (sesión local)

Instrucciones para la sesión de Claude que trabaje en el ordenador del autor, con acceso a su navegador y a su cuenta de Gemini (gemini.google.com). No se usa la API ni ninguna clave: se trabaja en la web de Gemini con la sesión ya iniciada del autor.

## Contexto
- El juego (TypeScript + Three.js) está en `src/`. Documentación en `README.md` y `docs/`.
- Reglas visuales: `docs/STYLE.md`. Fichas de encargo: `docs/ART_BRIEFS.md`.
- **Los 28 prompts, en orden:** `docs/PROMPTS_GEMINI.md` (también en `docs/prompts.json`). Cada uno indica proporción, imagen de referencia a adjuntar, nombre de archivo y destino en el juego.
- Rama de trabajo: `claude/brave-noether-b44yvq`.

## Flujo de trabajo
1. Preparar el proyecto: `npm install`. Comprobar con `npm test` (deben pasar las 28 pruebas).
2. En el navegador, abrir gemini.google.com (el autor ya tiene la sesión iniciada; si pide iniciar sesión, **parar y pedírselo al autor**, nunca escribir contraseñas).
3. Generar **solo la ilustración maestra** (`keyart_master`) con su prompt, pidiendo la proporción indicada. Obtener 2 o 3 variantes.
4. Descargar cada variante y guardarla en `art/raw/` como `<id>-<n>.png` (por ejemplo `art/raw/keyart_master-1.png`).
5. **Mostrar las variantes al autor y esperar su elección.** La maestra define el estilo de todo el juego: no seguir sin su aprobación.
6. Copiar la variante aprobada a `art/approved/<id>.png`.
7. Seguir con el resto de piezas en el orden del documento. **Adjuntar en Gemini la imagen de referencia aprobada** que indica cada ficha (normalmente `art/approved/keyart_master.png`; para las viñetas del diario, `art/approved/diario_d1.png`).
8. Enseñar al autor cada tanda (por ejemplo, de 3 a 5 piezas) y aprobar antes de continuar.
9. Si una imagen está casi bien, pedir el cambio a Gemini sobre esa misma imagen en lugar de regenerarla.
10. Hacer commit de `art/approved/` con mensajes claros (`art/raw/` está en `.gitignore`).

## Criterios de aprobación (ver `docs/ART_BRIEFS.md` §F)
- Paleta: ámbar como único acento dominante, oscuridad de fondo, sin blanco puro ni negro puro.
- Sin texto, logotipos ni caras humanas. Mireya y el Capataz siempre de espaldas.
- Coherente con la ilustración maestra.
- Se entiende a tamaño pequeño.

## Después de generar
Integrar las imágenes aprobadas en el juego:
- `keyart_title` → fondo de la pantalla de título (`src/ui/panels.ts`, `titleScreen`).
- `char_ada` → retrato en los mensajes de ADA y la tarjeta del tutorial.
- `diario_d1` … `diario_d10` → pestaña «Diario de Mireya» del Códex.
- `final_*` → diapositivas del final (`endingModal`).
- `codex_*` → entradas del Códex.
- Convertirlas a WebP a un tamaño razonable (≈1600 px de ancho las panorámicas y 800 px los retratos) para no hacer pesado el juego.
- Arte de Steam (`steam_*`): recortar a los tamaños exactos de `docs/ART_BRIEFS.md` §A2 y guardarlo en `art/steam/`.

## Aviso legal
Antes de vender el juego, revisar las condiciones de uso comercial de las imágenes de Gemini y declarar en Steam el contenido generado con IA.
