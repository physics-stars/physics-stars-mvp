export const locales = ["en", "es", "ca"] as const;
export type Locale = (typeof locales)[number];
export const contactEmail = "david.diestre.r@gmail.com";
export const languageNames = { en: "English", es: "Español", ca: "Català" };

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}

const ca = {
  meta: "La física comença abans de la fórmula. Una aventura per observar, investigar i aprendre a pensar com un científic. Prototip digital de Physics Stars.",
  nav: {
    game: "La idea",
    teachers: "Per a docents",
    team: "Qui som",
    login: "Entra",
    language: "Idioma",
    skip: "Salta al contingut",
  },
  hero: {
    title: "La física comença abans de la fórmula.",
    description:
      "Abans de resoldre un problema, cal descobrir-lo. Una aventura on observar, fer-se preguntes i investigar és el que fa avançar la història.",
    cta: "Portem-ho a la teva aula",
    secondary: "Explora la idea",
    status: "Estem construint el prototip digital",
    scroll: "Desplaça't. Canvia de perspectiva.",
  },
  thesis: {
    question: "«I això, per a què serveix?»",
    answer: "Donem-los un motiu per descobrir-ho.",
    body: "A classe, sovint el problema ja ve escrit. Les dades, escollides. La pregunta, feta. Però una part apassionant de la ciència passa abans: entendre què està passant i decidir com investigar-ho.",
  },
  story: {
    title: "Primer, el món. Després, l'enunciat.",
    intro:
      "T'han reclutat a Physics Stars, una divisió secreta de científics. La teva missió: investigar casos on observar bé és tan important com saber física.",
    steps: [
      {
        title: "Observa. Alguna cosa no encaixa.",
        text: "Una història et posa davant d'una situació que necessites entendre. Explores l'entorn i parles amb els personatges. Encara no tens cap enunciat: tens preguntes.",
        word: "Observa",
      },
      {
        title: "Investiga. Tria què importa.",
        text: "Prens mesures, relaciones pistes i decideixes quines dades necessites. Si t'encalles, l'ajuda forma part del món: una pista t'orienta sense trencar la història.",
        word: "Investiga",
      },
      {
        title: "Ara sí. Construeix la solució.",
        text: "Transformes el que has descobert en un problema físic i fas servir les eines de classe per resoldre'l. La física té sentit perquè la història la necessita.",
        word: "Resol",
      },
    ],
  },
  difference: {
    title: "Pensar és la mecànica del joc.",
    conventional: "Una equació per obrir una porta?",
    answer: "Nosaltres volem que entenguis per què la porta no s'obre.",
    body: "No afegim punts a un exercici de sempre. Dissenyem situacions on la física forma part del que passa. El repte és interpretar, posar a prova una idea i construir una resposta. La història, els reptes i les pistes treballen junts.",
    note: "La curiositat al centre. Les fórmules, quan fan falta.",
  },
  teachers: {
    title: "Una altra manera de proposar feina. El mateix costat de la taula.",
    intro:
      "Sabem que el professorat no necessita una altra cosa que li compliqui el dia. Physics Stars neix per complementar la classe i els deures, amb el feedback de docents des del principi.",
    items: [
      {
        title: "Pensament crític, en pràctica",
        text: "Reptes pensats perquè l'alumnat decideixi què mesurar, quines dades fan falta i com formular el problema.",
      },
      {
        title: "Ajuda sense sortir de la història",
        text: "Pistes contextuals per poder avançar, amb espai perquè cada estudiant investigui amb autonomia.",
      },
      {
        title: "Entendre on costa més",
        text: "Volem que els informes ajudin a detectar dificultats i orientar el seguiment. És una de les línies que estem desenvolupant amb docents.",
      },
    ],
    label: "En desenvolupament, amb docents",
    reports:
      "Els informes formen part del desenvolupament previst del prototip.",
  },
  about: {
    title: "Això també ho hem viscut a l'altra banda de la llibreta.",
    body: "Som estudiants amb moltes ganes de física. Tots hem fet classes de repàs i ens hem trobat amb la mateixa pregunta: «Però això, per a què em serveix?». Physics Stars és la nostra manera de buscar-hi una resposta.",
    second:
      "Hem parlat amb professors, escoltat el seu feedback i començat a construir un prototip digital. Encara estem aprenent, provant i afinant. Volem fer-ho amb les aules, des del principi.",
    team: "L'equip que ho està fent possible",
    roles: ["Cofundador", "Cofundador", "Disseny i experiència"],
  },
  pilot: {
    status: "Busquem centres per al pilot",
    title: "La propera pregunta la fem junts?",
    body: "Si ets docent o formes part d'un centre i vols explorar un pilot de Physics Stars, ens encantaria parlar-ne. El prototip està en construcció: és el moment de donar-li forma amb vosaltres.",
    cta: "Parlem del pilot",
    subject: "Pilot de Physics Stars al nostre centre",
    emailLabel: "O escriu-nos directament",
    note: "Una conversa, preguntes i ganes de provar coses.",
  },
  footer: {
    line: "Fet des de la curiositat.",
    top: "Torna a dalt",
    rights: "Physics Stars. Prototip en desenvolupament.",
  },
  login: {
    meta: "Entra a Physics Stars",
    title: "La teva aventura continua aquí.",
    subtitle: "Entra amb el compte que t'ha facilitat el teu centre.",
    back: "Torna a l'inici",
    username: "Nom d'usuari",
    usernamePlaceholder: "El teu nom d'usuari",
    password: "Contrasenya",
    show: "Mostra la contrasenya",
    hide: "Amaga la contrasenya",
    submit: "Inicia sessió",
    loading: "Entrant…",
    required: "Escriu el nom d'usuari i la contrasenya.",
    invalid: "Nom d'usuari o contrasenya incorrectes.",
    disabled:
      "Aquest compte està desactivat. Parla amb el teu professor o professora.",
    rate: "Massa intents. Torna-ho a provar d'aquí a uns minuts.",
    generic: "No hem pogut iniciar la sessió. Torna-ho a provar.",
    network: "No hem pogut contactar amb el servidor. Comprova la connexió.",
    help: "No tens compte o no pots entrar? Parla amb el teu professor o professora.",
    school: "Ets un centre i vols conèixer el projecte?",
    contact: "Parlem-ne",
    artTitle: "Queda molt per descobrir.",
    artBody: "Observa. Fes preguntes. Canvia de perspectiva.",
    inside: "El joc i les àrees internes estan disponibles en català.",
  },
};

export type PublicCopy = typeof ca;

const es: PublicCopy = {
  meta: "La física empieza antes de la fórmula. Una aventura para observar, investigar y aprender a pensar como un científico. Prototipo digital de Physics Stars.",
  nav: {
    game: "La idea",
    teachers: "Para docentes",
    team: "Quiénes somos",
    login: "Entra",
    language: "Idioma",
    skip: "Saltar al contenido",
  },
  hero: {
    title: "La física empieza antes de la fórmula.",
    description:
      "Antes de resolver un problema, hay que descubrirlo. Una aventura donde observar, hacerse preguntas e investigar es lo que hace avanzar la historia.",
    cta: "Llevémoslo a tu aula",
    secondary: "Explora la idea",
    status: "Estamos construyendo el prototipo digital",
    scroll: "Haz scroll. Cambia de perspectiva.",
  },
  thesis: {
    question: "«¿Y esto para qué sirve?»",
    answer: "Démosles un motivo para descubrirlo.",
    body: "En clase, muchas veces el problema ya viene escrito. Los datos, elegidos. La pregunta, hecha. Pero una parte apasionante de la ciencia ocurre antes: entender qué está pasando y decidir cómo investigarlo.",
  },
  story: {
    title: "Primero, el mundo. Después, el enunciado.",
    intro:
      "Te han reclutado en Physics Stars, una división secreta de científicos. Tu misión: investigar casos donde observar bien es tan importante como saber física.",
    steps: [
      {
        title: "Observa. Algo no encaja.",
        text: "Una historia te pone ante una situación que necesitas entender. Exploras el entorno y hablas con los personajes. Aún no tienes un enunciado: tienes preguntas.",
        word: "Observa",
      },
      {
        title: "Investiga. Decide qué importa.",
        text: "Tomas medidas, relacionas pistas y decides qué datos necesitas. Si te atascas, la ayuda forma parte del mundo: una pista te orienta sin romper la historia.",
        word: "Investiga",
      },
      {
        title: "Ahora sí. Construye la solución.",
        text: "Transformas lo que has descubierto en un problema físico y usas las herramientas de clase para resolverlo. La física tiene sentido porque la historia la necesita.",
        word: "Resuelve",
      },
    ],
  },
  difference: {
    title: "Pensar es la mecánica del juego.",
    conventional: "¿Una ecuación para abrir una puerta?",
    answer: "Nosotros queremos que entiendas por qué la puerta no se abre.",
    body: "No añadimos puntos a un ejercicio de siempre. Diseñamos situaciones donde la física forma parte de lo que ocurre. El reto es interpretar, poner a prueba una idea y construir una respuesta. La historia, los retos y las pistas trabajan juntos.",
    note: "La curiosidad en el centro. Las fórmulas, cuando hacen falta.",
  },
  teachers: {
    title: "Otra forma de proponer trabajo. En el mismo equipo.",
    intro:
      "Sabemos que el profesorado no necesita otra cosa que le complique el día. Physics Stars nace para complementar la clase y los deberes, con el feedback de docentes desde el principio.",
    items: [
      {
        title: "Pensamiento crítico, en práctica",
        text: "Retos pensados para que el alumnado decida qué medir, qué datos necesita y cómo formular el problema.",
      },
      {
        title: "Ayuda sin salir de la historia",
        text: "Pistas contextuales para poder avanzar, con espacio para que cada estudiante investigue con autonomía.",
      },
      {
        title: "Entender dónde cuesta más",
        text: "Queremos que los informes ayuden a detectar dificultades y orientar el seguimiento. Es una de las líneas que estamos desarrollando con docentes.",
      },
    ],
    label: "En desarrollo, con docentes",
    reports: "Los informes forman parte del desarrollo previsto del prototipo.",
  },
  about: {
    title: "También lo hemos vivido al otro lado de la libreta.",
    body: "Somos estudiantes con muchas ganas de física. Todos hemos dado clases de repaso y nos hemos encontrado con la misma pregunta: «¿Pero esto para qué me sirve?». Physics Stars es nuestra manera de buscarle una respuesta.",
    second:
      "Hemos hablado con profesores, escuchado su feedback y empezado a construir un prototipo digital. Seguimos aprendiendo, probando y afinando. Queremos hacerlo con las aulas, desde el principio.",
    team: "El equipo que lo está haciendo posible",
    roles: ["Cofundador", "Cofundador", "Diseño y experiencia"],
  },
  pilot: {
    status: "Buscamos centros para el piloto",
    title: "¿La próxima pregunta la hacemos juntos?",
    body: "Si eres docente o formas parte de un centro y quieres explorar un piloto de Physics Stars, nos encantaría hablar. El prototipo está en construcción: es el momento de darle forma con vosotros.",
    cta: "Hablemos del piloto",
    subject: "Piloto de Physics Stars en nuestro centro",
    emailLabel: "O escríbenos directamente",
    note: "Una conversación, preguntas y ganas de probar cosas.",
  },
  footer: {
    line: "Hecho desde la curiosidad.",
    top: "Volver arriba",
    rights: "Physics Stars. Prototipo en desarrollo.",
  },
  login: {
    meta: "Entra en Physics Stars",
    title: "Tu aventura continúa aquí.",
    subtitle: "Entra con la cuenta que te ha facilitado tu centro.",
    back: "Volver al inicio",
    username: "Nombre de usuario",
    usernamePlaceholder: "Tu nombre de usuario",
    password: "Contraseña",
    show: "Mostrar contraseña",
    hide: "Ocultar contraseña",
    submit: "Iniciar sesión",
    loading: "Entrando…",
    required: "Introduce tu nombre de usuario y contraseña.",
    invalid: "Nombre de usuario o contraseña incorrectos.",
    disabled:
      "Esta cuenta está desactivada. Habla con tu profesor o profesora.",
    rate: "Demasiados intentos. Vuelve a intentarlo en unos minutos.",
    generic: "No hemos podido iniciar sesión. Inténtalo de nuevo.",
    network:
      "No hemos podido contactar con el servidor. Comprueba tu conexión.",
    help: "¿No tienes cuenta o no puedes entrar? Habla con tu profesor o profesora.",
    school: "¿Eres un centro y quieres conocer el proyecto?",
    contact: "Hablemos",
    artTitle: "Queda mucho por descubrir.",
    artBody: "Observa. Haz preguntas. Cambia de perspectiva.",
    inside: "El juego y las áreas internas están disponibles en catalán.",
  },
};

const en: PublicCopy = {
  meta: "Physics starts before the formula. An adventure in observing, investigating and learning to think like a scientist. Physics Stars digital prototype.",
  nav: {
    game: "The idea",
    teachers: "For teachers",
    team: "Our story",
    login: "Log in",
    language: "Language",
    skip: "Skip to content",
  },
  hero: {
    title: "Physics starts before the formula.",
    description:
      "Before you solve a problem, you have to discover it. An adventure where observing, asking questions and investigating move the story forward.",
    cta: "Bring it to your classroom",
    secondary: "Explore the idea",
    status: "We're building the digital prototype",
    scroll: "Scroll. Change your perspective.",
  },
  thesis: {
    question: "“When will I ever use this?”",
    answer: "Let's give them a reason to find out.",
    body: "In class, the problem often comes ready-made. The data, selected. The question, already asked. But some of the most exciting science happens before that: understanding what's going on and deciding how to investigate.",
  },
  story: {
    title: "First, the world. Then, the problem.",
    intro:
      "You've been recruited by Physics Stars, a secret team of scientists. Your mission: investigate cases where careful observation matters as much as knowing physics.",
    steps: [
      {
        title: "Observe. Something doesn't add up.",
        text: "A story puts you in a situation you need to understand. You explore the environment and talk to characters. You don't have a written problem yet. You have questions.",
        word: "Observe",
      },
      {
        title: "Investigate. Decide what matters.",
        text: "Take measurements, connect clues and decide which data you need. If you get stuck, help belongs to the world: a clue guides you without breaking the story.",
        word: "Investigate",
      },
      {
        title: "Now, build your solution.",
        text: "Turn what you've discovered into a physics problem and use your classroom tools to solve it. Physics makes sense because the story needs it.",
        word: "Solve",
      },
    ],
  },
  difference: {
    title: "Thinking is the game mechanic.",
    conventional: "An equation to unlock a door?",
    answer: "We want you to understand why the door won't open.",
    body: "We don't add points to the same old exercise. We design situations where physics belongs to what's happening. The challenge is to interpret, test an idea and build an answer. The story, challenges and clues work together.",
    note: "Curiosity at the centre. Formulas when you need them.",
  },
  teachers: {
    title: "A different kind of assignment. On your side of the desk.",
    intro:
      "Teachers don't need another thing to make their day harder. Physics Stars is being built to complement lessons and homework, with teachers' feedback from the start.",
    items: [
      {
        title: "Critical thinking, in practice",
        text: "Challenges designed to let students decide what to measure, which data they need and how to frame the problem.",
      },
      {
        title: "Help that stays in the story",
        text: "Contextual clues to keep students moving, with room for each learner to investigate independently.",
      },
      {
        title: "Understand where students struggle",
        text: "We want reports to help identify difficulties and guide follow-up. This is one of the areas we're developing with teachers.",
      },
    ],
    label: "In development, with teachers",
    reports: "Reporting is part of the prototype's planned development.",
  },
  about: {
    title: "We've been on the other side of the notebook, too.",
    body: "We're students who love physics. We've all tutored, and we've all heard the same question: “But when will I use this?”. Physics Stars is our way of looking for an answer.",
    second:
      "We've spoken to teachers, listened to their feedback and started building a digital prototype. We're still learning, testing and refining. We want classrooms to be part of it from the start.",
    team: "The people making it happen",
    roles: ["Co-founder", "Co-founder", "Design & experience"],
  },
  pilot: {
    status: "Looking for pilot schools",
    title: "Shall we ask the next question together?",
    body: "If you're a teacher or part of a school interested in exploring a Physics Stars pilot, we'd love to talk. The prototype is still taking shape. This is the moment to help shape it with us.",
    cta: "Let's talk about a pilot",
    subject: "Physics Stars pilot at our school",
    emailLabel: "Or email us directly",
    note: "A conversation, some questions and a willingness to try things.",
  },
  footer: {
    line: "Made out of curiosity.",
    top: "Back to top",
    rights: "Physics Stars. Prototype in development.",
  },
  login: {
    meta: "Log in to Physics Stars",
    title: "Your adventure continues here.",
    subtitle: "Log in with the account provided by your school.",
    back: "Back to home",
    username: "Username",
    usernamePlaceholder: "Your username",
    password: "Password",
    show: "Show password",
    hide: "Hide password",
    submit: "Log in",
    loading: "Logging in…",
    required: "Enter your username and password.",
    invalid: "Incorrect username or password.",
    disabled: "This account is disabled. Please talk to your teacher.",
    rate: "Too many attempts. Please try again in a few minutes.",
    generic: "We couldn't log you in. Please try again.",
    network: "We couldn't reach the server. Check your connection.",
    help: "Don't have an account or can't log in? Please talk to your teacher.",
    school: "Want to learn about the project for your school?",
    contact: "Let's talk",
    artTitle: "There's more to discover.",
    artBody: "Observe. Ask questions. Change your perspective.",
    inside: "The game and signed-in areas are available in Catalan.",
  },
};

export const publicCopy: Record<Locale, PublicCopy> = { ca, es, en };
