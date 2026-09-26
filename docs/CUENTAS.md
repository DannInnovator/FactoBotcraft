# Cuentas, nube y ranking

Konstrukta puede guardar la partida de cada jugador en la nube y tener un ranking del Desafío Diario a prueba de trampas. Usa **Supabase** (base de datos e inicio de sesión) y una **función de Vercel** que verifica las marcas.

Sin configurar nada, el juego funciona igual que siempre, con el guardado local: la cuenta, la nube y el ranking simplemente no aparecen.

## Cómo funciona

- **Inicio de sesión sin contraseñas:** el jugador escribe su correo y recibe un enlace de acceso. Después elige un «nombre de Capataz» único para el ranking.
- **Partida en la nube:** mientras juega se sube como mucho una vez por minuto, y al cambiar de pestaña o cerrar el juego. En la portada, si la nube tiene una partida más reciente que la del navegador, se ofrece usarla.
- **Ranking verificado:** el navegador envía los programas usados (y las funciones a las que llaman) a `api/challenge.ts`. El servidor comprueba quién los envía, vuelve a jugar el desafío del día con ellos (la simulación es determinista, ver `verifyChallenge` en `src/sim/challenge.ts`) y guarda **su** marca, nunca la que dice el navegador. Solo se guarda si mejora la anterior.
- **Seguridad:** cada jugador solo puede leer y escribir su perfil y su partida. El ranking es público para leer, pero nadie puede escribir en él salvo el servidor, y los programas enviados no se muestran (se ve la marca, no la solución). Ver `supabase/schema.sql`.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com) → *New project*. Nombre: `konstrukta`. Región: la más cercana a los jugadores (por ejemplo *South America (São Paulo)*). Guarda la contraseña de la base de datos en un lugar seguro.
2. **Crear las tablas:** en el proyecto, *SQL Editor* → *New query* → pega todo el contenido de `supabase/schema.sql` → *Run*.
3. **Dónde vuelve el enlace del correo:** *Authentication* → *URL Configuration*.
   - *Site URL*: `https://konstrukta-lovat.vercel.app`
   - *Redirect URLs* (añadir las tres):
     - `https://konstrukta-lovat.vercel.app/**`
     - `https://*-danninnovators-projects.vercel.app/**` (vistas previas)
     - `http://localhost:5173/**` (desarrollo)
4. **Copiar las claves:** *Project Settings* → *API* (o *API Keys*):
   - *Project URL*
   - la clave **anon / publishable** (es pública por diseño: va dentro del juego)
   - la clave **service_role / secret** (¡secreta! nunca en el código ni en un chat)
5. **Pegarlas en Vercel:** proyecto `konstrukta` → *Settings* → *Environment Variables*:

   | Nombre | Valor | Entornos |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Project URL | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | clave anon / publishable | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret (márcala como *Sensitive*) | Production, Preview |

6. Volver a desplegar (cualquier `push`, o *Redeploy* en Vercel) para que el juego lea las variables.

## A tener en cuenta

- **Correos:** el envío de correos que trae Supabase de serie tiene un límite muy bajo por hora. Para más de un puñado de jugadores conviene configurar un SMTP propio (por ejemplo, Resend, que tiene plan gratuito) en *Authentication* → *Emails* → *SMTP Settings*.
- **Privacidad:** se guarda el correo de cada jugador (lo gestiona Supabase) y su nombre de Capataz. Antes de abrir el juego al público conviene añadir una nota de privacidad.
- **Steam:** cuando el juego salga en Steam, la versión de escritorio podrá usar Steam Cloud y las tablas de Steam en lugar de esta cuenta; `src/net/cloud.ts` es la única pieza que habría que cambiar.
- **Desarrollo local:** crea `.env.development.local` (ignorado por git) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para probar la cuenta con `npm run dev`. El ranking necesita además la función de Vercel (`vercel dev`).
