export const locales = ["en", "es", "ca"] as const;
export type Locale = (typeof locales)[number];
export const contactEmail = "david.diestre.r@gmail.com";
export const languageNames = { en: "English", es: "Español", ca: "Català" };

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}

const ca = {
  meta: "El problema encara no està escrit. Physics Stars és un videojoc narratiu de física per a secundària. Un projecte nascut fent classes de repàs, ara en desenvolupament.",
  nav: {
    home: "El viatge", game: "Com es juga", teachers: "Per a docents", team: "Qui som",
    login: "Entra", language: "Idioma", skip: "Salta al contingut",
  },
  about: {
    roles: ["Co-founder & CEO", "Co-founder & COO", "CTO"],
    messages: [
      "En altres webs, fer clic a la foto d'algú sol portar-te al seu LinkedIn. Aquí no. Preferim posar els nostres perfils de LinkedIn a sota i aprofitar aquest espai per passar-nos-ho bé.",
      "Anima'l una mica i ja ho tens: quan s'engresca, aquest paio és una força de la natura. I creu-nos, quan està en el seu element, construir alguna cosa al seu costat és una autèntica passada.",
      "El seu cervell s'hauria d'estudiar. Dona-li una tasca i, un dia qualsevol, se t'acostarà per ensenyar-te una cosa al·lucinant, com si no fos res de l'altre món.",
    ],
    juanHint: "(Fes clic a la foto d'en Juan cinc vegades seguides.)",
    showMessage: "Llegeix el missatge",
    showPhoto: "Mostra la foto",
    memeAlt: "La foto sorpresa d'en Juan",
  },
  pilot: { subject: "Parlem de Physics Stars a la nostra aula" },
  footer: { line: "De les classes de repàs a un videojoc de física.", rights: "Un projecte que estem construint.", contact: "Contacta'ns" },
  login: {
    meta: "Entra a Physics Stars", title: "Tornem al cas.",
    subtitle: "Fes servir el compte que t'ha donat el teu centre.", back: "Torna a l'inici",
    username: "Nom d'usuari", usernamePlaceholder: "El teu usuari…", password: "Contrasenya",
    show: "Mostra la contrasenya", hide: "Amaga la contrasenya",
    submit: "Inicia sessió", loading: "Entrant…",
    required: "Escriu el nom d'usuari i la contrasenya.",
    invalid: "El nom d'usuari o la contrasenya no són correctes. Revisa'ls i torna-ho a provar.",
    disabled: "Aquest compte està desactivat. Parla amb el teu professor o professora.",
    rate: "Has fet massa intents. Espera uns minuts abans de tornar-ho a provar.",
    generic: "No s'ha pogut iniciar la sessió. Torna-ho a provar.",
    network: "No hi ha connexió amb el servidor. Comprova internet i torna-ho a provar.",
    help: "Et falten les dades o no pots entrar? El teu professor o professora et pot ajudar.",
    school: "Vols provar-lo al teu centre?", contact: "Parlem-ne",
    artTitle: "Hi ha una pregunta esperant-te.",
    artBody: "Observa què passa. Decideix què necessites saber. La física t'ajudarà a continuar.",
    inside: "El joc i les àrees internes estan disponibles en català.",
  },
};

export type PublicCopy = typeof ca;

const es: PublicCopy = {
  meta: "El problema aún no está escrito. Physics Stars es un videojuego narrativo de física para secundaria. Un proyecto nacido dando clases de repaso, ahora en desarrollo.",
  nav: {
    home: "El viaje", game: "Cómo se juega", teachers: "Para docentes", team: "Quiénes somos",
    login: "Entra", language: "Idioma", skip: "Saltar al contenido",
  },
  about: {
    roles: ["Co-founder & CEO", "Co-founder & COO", "CTO"],
    messages: [
      "En otras webs, hacer clic en la foto de alguien suele llevarte a su LinkedIn. Aquí no. Preferimos poner nuestros perfiles de LinkedIn debajo y aprovechar este espacio para pasarlo bien.",
      "Dale un poco de ánimo y ya lo tienes: cuando se viene arriba, este tío es una fuerza de la naturaleza. Y créenos, cuando está en su salsa, construir algo a su lado es una auténtica pasada.",
      "Habría que estudiar su cerebro. Dale una tarea y, un día cualquiera, se te acercará para enseñarte algo alucinante, como si no fuera para tanto.",
    ],
    juanHint: "(Haz clic en la foto de Juan cinco veces seguidas.)",
    showMessage: "Leer el mensaje",
    showPhoto: "Mostrar la foto",
    memeAlt: "La foto sorpresa de Juan",
  },
  pilot: { subject: "Hablemos de Physics Stars en nuestra aula" },
  footer: { line: "De las clases de repaso a un videojuego de física.", rights: "Un proyecto que estamos construyendo.", contact: "Contacta con nosotros" },
  login: {
    meta: "Entra en Physics Stars", title: "Volvamos al caso.",
    subtitle: "Usa la cuenta que te ha dado tu centro.", back: "Volver al inicio",
    username: "Nombre de usuario", usernamePlaceholder: "Tu usuario…", password: "Contraseña",
    show: "Mostrar contraseña", hide: "Ocultar contraseña",
    submit: "Iniciar sesión", loading: "Entrando…",
    required: "Escribe tu nombre de usuario y contraseña.",
    invalid: "El nombre de usuario o la contraseña no son correctos. Revísalos e inténtalo de nuevo.",
    disabled: "Esta cuenta está desactivada. Habla con tu profesor o profesora.",
    rate: "Has hecho demasiados intentos. Espera unos minutos antes de volver a probar.",
    generic: "No se ha podido iniciar sesión. Inténtalo de nuevo.",
    network: "No hay conexión con el servidor. Comprueba internet e inténtalo de nuevo.",
    help: "¿Te faltan los datos o no puedes entrar? Tu profesor o profesora puede ayudarte.",
    school: "¿Quieres probarlo en tu centro?", contact: "Hablemos",
    artTitle: "Hay una pregunta esperándote.",
    artBody: "Observa qué ocurre. Decide qué necesitas saber. La física te ayudará a continuar.",
    inside: "El juego y las áreas internas están disponibles en catalán.",
  },
};

const en: PublicCopy = {
  meta: "The question is yours to find. Physics Stars is a story-driven physics game for secondary school. Born out of tutoring, now in development.",
  nav: {
    home: "The journey", game: "How it plays", teachers: "For teachers", team: "Our story",
    login: "Log in", language: "Language", skip: "Skip to content",
  },
  about: {
    roles: ["Co-founder & CEO", "Co-founder & COO", "CTO"],
    messages: [
      "On other websites, clicking someone's picture usually takes you to their LinkedIn. That's not our case. We prefer to put our LinkedIns below and use this space to have some fun.",
      "Hype him up and you are all set: once this guy is fired up, he's a force of nature. And trust us, when he's in the zone it's a hell of a good time to build alongside him.",
      "His brain should be studied. Give him a task and, on some random day, he'll just come up to you and show you the most amazing thing, acting like it's no big deal.",
    ],
    juanHint: "(Click Juan's picture five times in a row.)",
    showMessage: "Read the message",
    showPhoto: "Show the picture",
    memeAlt: "Juan's surprise photo",
  },
  pilot: { subject: "Physics Stars in our classroom" },
  footer: { line: "From tutoring to a physics game.", rights: "A project we're building together.", contact: "Contact us" },
  login: {
    meta: "Log in to Physics Stars", title: "Back to the case.",
    subtitle: "Use the account your school gave you.", back: "Back to home",
    username: "Username", usernamePlaceholder: "Your username…", password: "Password",
    show: "Show password", hide: "Hide password",
    submit: "Log in", loading: "Logging in…",
    required: "Enter your username and password.",
    invalid: "The username or password isn't right. Check both and try again.",
    disabled: "This account is disabled. Talk to your teacher for help.",
    rate: "You've made too many attempts. Wait a few minutes before trying again.",
    generic: "We couldn't log you in. Try again.",
    network: "We couldn't reach the server. Check your internet connection and try again.",
    help: "Missing your details or can't log in? Your teacher can help.",
    school: "Want to try it at your school?", contact: "Let's talk",
    artTitle: "There's a question waiting for you.",
    artBody: "Observe what's happening. Decide what you need to know. Physics will help you take it from there.",
    inside: "The game and signed-in areas are available in Catalan.",
  },
};

export const publicCopy: Record<Locale, PublicCopy> = { ca, es, en };
