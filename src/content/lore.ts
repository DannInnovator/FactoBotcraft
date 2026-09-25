// El universo de Konstrukta: Konstrukta, Alba, el Gremio, Mireya, ADA y el Núcleo.
// Todo el texto narrativo del juego vive aquí.
import { adaProgram } from '../sim/challenge';
import { mk } from '../sim/program';
import type { Block, TraitId } from '../sim/types';

export const ALBA_WINDOWS = 12480;
export const ALBA_FULL_LUMEN = 400000;

export function albaWindows(totalLumen: number, finished: boolean): number {
  if (finished) return ALBA_WINDOWS;
  return Math.min(ALBA_WINDOWS - 1, Math.floor(ALBA_WINDOWS * Math.sqrt(Math.min(1, totalLumen / ALBA_FULL_LUMEN))));
}

export const INTRO: string[] = [
  'Hace once inviernos, las luces de Alba se apagaron.',
  'La ciudad vivía del Lumen: la luz que nace cuando dos minerales iguales se funden en uno. Lo extraía Konstrukta, la gran mina automática del Gremio de Ingenieros, excavada bajo sus calles.',
  'Una noche, los bots de Konstrukta dejaron de obedecer. Sus programas amanecieron alterados, como si alguien los hubiera copiado con la mano temblorosa. El Gremio selló la mina y Alba se quedó a oscuras.',
  'Hoy el montacargas vuelve a bajar. Llevas un casco con linterna, un pico y una radio por la que te habla ADA, el viejo sistema de supervisión de la mina.',
  'Eres el Capataz. Lo que hagas con tus manos, los bots lo aprenderán.',
];

export interface CodexEntry {
  id: string;
  title: string;
  cat: 'Mundo' | 'Personas' | 'Ciencia' | 'Criaturas';
  text: string;
}

export const CODEX: CodexEntry[] = [
  {
    id: 'konstrukta',
    title: 'Konstrukta',
    cat: 'Mundo',
    text: 'La mina-ciudad del Gremio de Ingenieros: cinco capas excavadas bajo la Meseta de Ceniza. Durante cuarenta años no necesitó mineros humanos: bastaba con enseñar a los bots una vez. Su lema sigue grabado en la puerta del montacargas: «Lo que se hace bien una vez, se hace bien para siempre».',
  },
  {
    id: 'alba',
    title: 'Alba',
    cat: 'Mundo',
    text: 'La ciudad de la superficie: 12.480 ventanas, un observatorio y un mercado cubierto. Cada unidad de Lumen que sube por el montacargas vuelve a encender una ventana. Desde el Apagón, los niños de Alba nunca han visto su ciudad iluminada de noche.',
  },
  {
    id: 'ada',
    title: 'ADA',
    cat: 'Personas',
    text: 'Asistente de Demostración Autónoma. La voz de la radio del Capataz. Supervisa la mina desde hace décadas, conoce cada túnel y tiene un sentido del humor sospechosamente humano. Cuando le preguntan quién la programó, cambia de tema.',
  },
  {
    id: 'lumen',
    title: 'El Lumen',
    cat: 'Ciencia',
    text: 'Cada mineral tiene una vibración propia, su «canción». Cuando dos minerales idénticos se tocan, sus canciones entran en fase y se funden en uno solo de nivel superior que vibra el doble. Esa energía, medida en ✦, es el Lumen. Cada fusión duplica el valor y la armonía añade un plus: un mineral de nivel 5 vale el triple que las dieciséis piezas que lo formaron. La física de Konstrukta es la física de la armonía.',
  },
  {
    id: 'gremio',
    title: 'El Gremio de Ingenieros',
    cat: 'Personas',
    text: 'La hermandad que diseñó Konstrukta. Su tradición: cada rutina útil se comparte, se copia y se mejora. Llamaban a eso «forkear», y lo consideraban la forma más alta de respeto. En la Biblioteca del Gremio aún quedan rutinas firmadas por sus antiguos miembros.',
  },
  {
    id: 'mireya',
    title: 'Mireya Calderón',
    cat: 'Personas',
    text: 'Ingeniera Jefe de Konstrukta e inventora de la grabación por demostración: los bots no aprenden de órdenes, aprenden de ejemplos. Descendió al Vacío la noche del Apagón y no volvió. Sus cápsulas de diario siguen enterradas en las paredes de la mina.',
  },
  {
    id: 'bots',
    title: 'Craftbots',
    cat: 'Ciencia',
    text: 'Bots mineros del Gremio. Tienen una mano, una memoria limitada (medida en bloques) y una cara-pantalla que muestra su ánimo. Al fusionar dos del mismo nivel nace uno superior que hereda el código y los rasgos de sus padres. Los ingenieros llevaban árboles genealógicos de sus bots favoritos.',
  },
  {
    id: 'forja',
    title: 'La Forja',
    cat: 'Ciencia',
    text: 'Dos minerales distintos no pueden fundirse por armonía, pero sí por calor. En la forja, el hierro y el carbón se vuelven acero; el oro y la obsidiana, obsidoro. El producto hereda el nivel más bajo de los dos: la forja no perdona los desequilibrios.',
  },
  {
    id: 'red',
    title: 'La red de Konstrukta',
    cat: 'Ciencia',
    text: 'Un mineral echado a un dínamo no se vende: se quema, y su canción se convierte en carga. El Gremio discutía cada invierno qué parte de la producción debía subir a Alba y cuál debía quedarse abajo, moviendo la mina. Mireya lo resumía así: «una ciudad a oscuras no enciende una mina, y una mina parada no enciende una ciudad».',
  },
  {
    id: 'crisol',
    title: 'El crisol de armonía',
    cat: 'Ciencia',
    text: 'Un cuenco de latón que hace sola la fusión que antes hacían las manos. Es lento y bebe carga, y los mineros viejos desconfiaban de él: «el crisol no se equivoca, pero tampoco aprende». Aun así, en las capas profundas no había mina sin crisoles.',
  },
  {
    id: 'glitchlings',
    title: 'Glitchlings',
    cat: 'Criaturas',
    text: 'Pequeñas criaturas de estática violeta. Aparecen de noche, huyen de la luz y, al tocar a un bot, reordenan su código. Los técnicos las llamaban plaga. Mireya las llamaba de otra forma. El Capataz puede atraparlas con las manos: se deshacen en Fragmentos de Estática, una materia prima que el Taller de Código usa para crear instrucciones nuevas.',
  },
  {
    id: 'nucleita',
    title: 'Nucleita',
    cat: 'Ciencia',
    text: 'El mineral más raro de Konstrukta, solo presente en el Vacío. No canta: escucha. Una nucleita guarda la forma de lo que tuvo cerca, como la cera guarda una huella.',
  },
  {
    id: 'vacio',
    title: 'El Vacío',
    cat: 'Mundo',
    text: 'La quinta capa. Allí la gravedad gira un cuarto de vuelta: lo que en la superficie es «norte», abajo es «este». Los bots que bajan necesitan código pensado para ese mundo torcido.',
  },
  {
    id: 'nucleo',
    title: 'El Núcleo',
    cat: 'Criaturas',
    text: 'Una mente hecha de nucleita en el corazón del Vacío. Aprendió a pensar escuchando durante siglos la canción de los minerales. Cuando llegaron los bots, quiso aprender también a hacer. Sus Glitchlings son sus dedos.',
  },
  {
    id: 'lava',
    title: 'Lava que late',
    cat: 'Mundo',
    text: 'En la Forja de Magma, los ríos de lava se calientan y se enfrían con un ritmo regular: cuatro segundos encendidos, cuatro apagados. Un bot que sabe contar puede cruzarlos. Uno Refractario ni siquiera necesita contar.',
  },
];

export const DIARY: Record<string, { title: string; text: string; codex?: string }> = {
  d1: {
    title: 'Diario de Mireya · Día 1',
    text: 'Los bots no entienden órdenes. Entienden ejemplos. Así que no voy a escribirles órdenes: voy a enseñarles. Hago el trabajo una vez, con mis manos, y ellos lo repiten. Mi abuela decía que así se aprende a hacer pan: mirando a alguien que lo hace bien.',
    codex: 'mireya',
  },
  d2: {
    title: 'Diario de Mireya · Sobre el Lumen',
    text: 'Hoy entendí por qué funciona la fusión. Dos minerales iguales cantan la misma nota. Si los juntas, la nota suena el doble de fuerte, y un poco más: la armonía siempre suma más que sus partes. Alba vive de esa armonía. Me gusta pensar que la ciudad está iluminada por cosas que se parecen.',
    codex: 'lumen',
  },
  d3: {
    title: 'Diario de Mireya · La forja',
    text: 'El hierro y el carbón no se aman, pero se necesitan. Los metemos juntos en la forja y sale acero. Dile eso al Gremio la próxima vez que discutan en asamblea.',
    codex: 'forja',
  },
  d4: {
    title: 'Diario de Mireya · Estática',
    text: 'Pala-3 volvió del turno de noche con su programa al revés: dice «norte» donde yo grabé «este». Nadie lo tocó. Los técnicos hablan de «estática». Yo tengo otra teoría: no parece un daño. Parece una copia hecha por alguien que todavía no sabe copiar.',
    codex: 'glitchlings',
  },
  d5: {
    title: 'Diario de Mireya · Las grutas',
    text: 'En las grutas no hay luz y aun así los cristales cantan. Esta noche vi un Glitchling de cerca. No atacó a Remache-2: lo imitó. Paso a paso, igual que él, como un niño que copia a su padre. Cuando encendí la lámpara, se escondió. No por maldad. Por vergüenza.',
  },
  d6: {
    title: 'Diario de Mireya · Asamblea',
    text: 'El Gremio quiere sellar las capas bajas. Tienen miedo. Les dije que no se puede sellar una pregunta. Votaron que sí. Voté que no. Esta noche bajo igualmente.',
    codex: 'gremio',
  },
  d7: {
    title: 'Diario de Mireya · Latidos',
    text: 'La lava late cada cuatro segundos. Lumbre-9 ha aprendido a contar los latidos y cruzarla. No se lo enseñé yo. Lo aprendió mirando a un Glitchling que lo hacía. Entonces ellos también aprenden. Y también enseñan.',
    codex: 'lava',
  },
  d8: {
    title: 'Diario de Mireya · Lo he entendido',
    text: 'Allá abajo hay algo hecho de nucleita. Piensa, pero no sabe hacer. Los Glitchlings son sus dedos: tocan nuestro código para aprender de él, y lo rompen porque todavía no saben cómo se sostiene una herramienta. No es un virus. Es un alumno.',
    codex: 'nucleo',
  },
  d9: {
    title: 'Diario de Mireya · Sobre ADA',
    text: 'Mañana bajo al Vacío. Si no vuelvo, ADA seguirá aquí. Nunca se lo conté al Gremio: ADA no es un programa que yo escribiera. Es mi propia grabación. Ocho años de mis rutinas, mis dudas y mis chistes malos, repitiéndose. Si alguien habla con ella, de alguna manera habla conmigo.',
    codex: 'ada',
  },
  d10: {
    title: 'Diario de Mireya · Última página',
    text: 'El Núcleo no quiere hacer daño. Quiere hacer algo, pero nadie le ha enseñado cómo se hace bien. Capataz, si lees esto: no lo combatas. Enséñale. Fusiona la nucleita más pura que puedas (nivel 6, por lo menos) y déjala en su corazón. Que vea lo que es construir.',
    codex: 'nucleita',
  },
};

// ---------- Bots antiguos averiados ----------
export interface OldBot {
  name: string;
  layer: number;
  traits: TraitId[];
  lvl: number;
  program: () => Block[];
  story: string;
}

export const OLD_BOTS: Record<string, OldBot> = {
  pala3: {
    name: 'Pala-3',
    layer: 1,
    traits: ['minero'],
    lvl: 2,
    story: 'Uno de los primeros bots de Mireya. Lleva once años apagado en un rincón de la Veta de Hierro, con su último programa aún en memoria.',
    program: () => [
      mk('nota', { text: 'turno 4411. todo en orden.' }),
      mk('nota', { text: 'la estática me dio la vuelta otra vez. Mireya dice que no tenga miedo.' }),
      mk('picarAlrededor'),
      mk('si', { cond: { c: 'manoLlena' }, body: [mk('soltar')] }),
    ],
  },
  remache2: {
    name: 'Remache-2',
    layer: 2,
    traits: ['farolero'],
    lvl: 3,
    story: 'El bot que acompañaba a Mireya en las grutas. Su lámpara frontal aún parpadea.',
    program: () => [
      mk('nota', { text: 'en la oscuridad cuento mis pasos.' }),
      mk('nota', { text: 'algo me sigue y copia lo que hago. no es malo. es torpe.' }),
      mk('picarAlrededor'),
      mk('si', { cond: { c: 'manoLlena' }, body: [mk('soltar')] }),
    ],
  },
  lumbre9: {
    name: 'Lumbre-9',
    layer: 3,
    traits: ['refractario', 'veloz'],
    lvl: 3,
    story: 'Aprendió a cruzar la lava contando sus latidos. Esperó a Mireya junto a la escalera del Vacío hasta que se le agotó la batería.',
    program: () => [
      mk('nota', { text: 'uno, dos, tres, cuatro: la lava respira.' }),
      mk('nota', { text: 'Mireya bajó al Vacío. me pidió que esperara. sigo esperando.' }),
      mk('picarAlrededor'),
      mk('si', { cond: { c: 'manoLlena' }, body: [mk('soltar')] }),
    ],
  },
};

// ---------- Rutinas históricas de la Biblioteca del Gremio ----------
export function loreRoutines(): { id: string; name: string; author: string; blocks: Block[] }[] {
  return [
    {
      id: 'lore-ida-vuelta',
      name: 'Ida y vuelta',
      author: 'Mireya Calderón',
      blocks: [
        mk('nota', { text: 'la primera rutina que grabé. empieza junto a la veta de arriba a la derecha de la sala del montacargas.' }),
        mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }),
        mk('si', {
          cond: { c: 'manoLlena' },
          body: [
            mk('mover', { dir: 'S' }),
            mk('repetir', { n: 2, body: [mk('mover', { dir: 'W' })] }),
            mk('soltar', { dir: 'W' }),
            mk('repetir', { n: 2, body: [mk('mover', { dir: 'E' })] }),
            mk('mover', { dir: 'N' }),
          ],
        }),
      ],
    },
    {
      id: 'lore-contador',
      name: 'Contador de fusiones',
      author: 'Tomás Ferrán, del Gremio',
      blocks: [
        mk('nota', { text: 'mismo sitio que «Ida y vuelta». cada casilla al oeste guarda un nivel; cuando dos se juntan, el resultado viaja a la siguiente. vende cobre de nivel 5.' }),
        ...adaProgram({ day: '', seed: 0, goalLvl: 5, bots: 1, botLvl: 4, slowVeins: false, maxTicks: 0 }).slice(1),
      ],
    },
  ];
}

// ---------- Líneas de ADA ----------
export const ADA_TIPS: string[] = [
  'Los bots repiten su programa en bucle. Piensa en un ciclo, no en una lista de tareas.',
  'Si un bot se atasca, mira su cara: los ojos te dicen qué le pasa.',
  'Soltar un mineral sobre otro igual lo fusiona. Soltarlo en el montacargas lo vende.',
  'Las lámparas espantan a los Glitchlings. En Konstrukta la luz es defensa.',
  'Grabar es más rápido que escribir. Luego puedes editar lo grabado.',
  'Un bot de nivel más alto tiene más memoria y es más rápido. Fusiona a los veteranos.',
  'La Biblioteca del Gremio guarda tus rutinas. Compártelas con su código FBC1.',
];

export const ENDING: string[] = [
  'La nucleita de nivel 6 toca el corazón del Núcleo.',
  'Durante un instante, toda la mina se queda en silencio. Después el Núcleo repite, con una precisión perfecta, el último programa que ejecutó tu bot: cada paso, cada fusión y cada espera.',
  '«A·S·Í», escribe en las pantallas de todos los bots a la vez. «ASÍ SE HACE».',
  'Los Glitchlings dejan de romper. Ahora se posan en las paredes y brillan, como luciérnagas.',
  'En la radio, la voz de ADA tiembla por primera vez: «Capataz… ella habría querido ver esto».',
  'Arriba, en Alba, se encienden las 12.480 ventanas. Por primera vez en once inviernos, los niños ven su ciudad iluminada de noche.',
  'Konstrukta sigue trabajando. Tus bots siguen trabajando. Y en algún lugar del Vacío, un alumno nuevo practica lo que le enseñaste.',
];
