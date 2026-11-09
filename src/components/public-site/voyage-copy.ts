import type { Locale } from "./copy";

type VoyagePlanet = { name: string; title: string; body: string };
type OverviewStep = { title: string; body: string };
export type VoyageCopy = {
  genre: string; heroTitle: string; heroBody: string; start: string; scroll: string;
  continueScroll: string; skip: string; navigation: string;
  planets: [VoyagePlanet, VoyagePlanet, VoyagePlanet, VoyagePlanet];
  finalTitle: string; finalBody: string; aboutTitleLines: [string, string]; aboutBody: string;
  aboutSecond: string; teamLabel: string; pilotTitle: string; pilotBody: string;
  pilotNote: string; pilotCta: string; prototype: string; stationary: string;
  overview: {
    label: string; title: string; body: string;
    steps: [OverviewStep, OverviewStep, OverviewStep, OverviewStep];
    teacherTitle: string; teacherBody: string;
  };
};

export const voyageCopy: Record<Locale, VoyageCopy> = {
  ca: {
    genre: "Videojoc de física per a secundària",
    heroTitle: "El problema encara no està escrit.",
    heroBody: "Un videojoc narratiu de física per a secundària. Investiga un cas, decideix què mesurar i fes servir el que saps perquè la història avanci.",
    start: "Comença el viatge", scroll: "Fes scroll. Comença el cas.",
    continueScroll: "La idea darrere del joc", skip: "Parlem del pilot",
    navigation: "El viatge de Physics Stars",
    planets: [
      { name: "La missió", title: "Et toca investigar.", body: "Una divisió científica et recluta. Coneixes l'equip, explores l'entorn i et trobes amb un cas obert. La història espera les teves decisions." },
      { name: "La investigació", title: "Tu decideixes què importa.", body: "Què mesuraries? Quines dades et falten? Observa, relaciona pistes i construeix el problema. L'enunciat també és part de la feina." },
      { name: "La física", title: "Aquella fórmula ja té un perquè.", body: "El que has après a classe t'ajuda a entendre què passa. Ara tens un motiu per fer-ho servir: resoldre el cas i continuar la història." },
      { name: "Les pistes", title: "Una pista. La resta és teva.", body: "Si t'encalles, un personatge o una pista del món t'orienta. Tens ajuda per continuar pensant, sense sortir de la història." },
    ],
    finalTitle: "Ara la pregunta és teva.",
    finalBody: "Així entenem la física: amb alguna cosa que vulguis esbrinar.",
    aboutTitleLines: ["Tot va començar fent", "classes de repàs."],
    aboutBody: "Som estudiants a qui agrada la física. Fent classes de repàs, tots hem sentit allò de «i això, per a què serveix?». I tots hem vist aquell moment en què una idea, per fi, encaixa. Volem que passi més sovint.",
    aboutSecond: "Physics Stars és la nostra manera de buscar-ho. Parlem amb docents, escoltem què els funciona a l'aula i construïm el prototip. Encara ens queda feina; ens interessa fer-la amb qui l'haurà de fer servir.",
    teamLabel: "Les persones darrere de Physics Stars",
    pilotTitle: "Tu coneixes l'aula. Nosaltres volem escoltar-te.",
    pilotBody: "Estem construint el prototip digital i busquem docents amb qui preparar una prova al seu centre. Explica'ns què ensenyes, què costa més a l'alumnat i on podria encaixar el joc.",
    pilotNote: "Comencem amb una conversa.", pilotCta: "Parlem de la teva aula",
    prototype: "Prototip en desenvolupament", stationary: "Lectura amb moviment reduït",
    overview: {
      label: "Com es juga", title: "Abans de la fórmula, hi ha decisions.",
      body: "A classe, el problema acostuma a venir escrit. Aquí, l'alumnat ha d'arribar fins a l'enunciat: entendre què passa, triar les dades i decidir què necessita saber.",
      steps: [
        { title: "Explorar el cas", body: "Una missió, un entorn i personatges amb qui parlar. Primer cal observar què està passant." },
        { title: "Triar què mesurar", body: "Recollir dades i relacionar pistes. Distingir què és rellevant també forma part del repte." },
        { title: "Escriure el problema", body: "Ordenar el que se sap i formular una pregunta que es pugui resoldre amb física." },
        { title: "Posar la física a treballar", body: "Fer servir les eines de classe per trobar una resposta. Les pistes de la història ajuden quan cal." },
      ],
      teacherTitle: "Amb un lloc a la teva classe",
      teacherBody: "El dissenyem com a complement de les classes i els deures, amb opinions de docents. Els informes per detectar dificultats estan previstos; encara no estan disponibles.",
    },
  },
  es: {
    genre: "Videojuego de física para secundaria",
    heroTitle: "El problema aún no está escrito.",
    heroBody: "Un videojuego narrativo de física para secundaria. Investiga un caso, decide qué medir y usa lo que sabes para que la historia avance.",
    start: "Empieza el viaje", scroll: "Haz scroll. Empieza el caso.",
    continueScroll: "La idea detrás del juego", skip: "Hablemos del piloto",
    navigation: "El viaje de Physics Stars",
    planets: [
      { name: "La misión", title: "Te toca investigar.", body: "Una división científica te recluta. Conoces al equipo, exploras el entorno y te encuentras con un caso abierto. La historia espera tus decisiones." },
      { name: "La investigación", title: "Tú decides qué importa.", body: "¿Qué medirías? ¿Qué datos te faltan? Observa, relaciona pistas y construye el problema. El enunciado también es parte del trabajo." },
      { name: "La física", title: "Esa fórmula ya tiene un porqué.", body: "Lo que has aprendido en clase te ayuda a entender qué ocurre. Ahora tienes un motivo para usarlo: resolver el caso y continuar la historia." },
      { name: "Las pistas", title: "Una pista. El resto es tuyo.", body: "Si te atascas, un personaje o una pista del mundo te orienta. Tienes ayuda para seguir pensando, sin salir de la historia." },
    ],
    finalTitle: "Ahora la pregunta es tuya.",
    finalBody: "Así entendemos la física: con algo que quieras averiguar.",
    aboutTitleLines: ["Todo empezó dando", "clases de repaso."],
    aboutBody: "Somos estudiantes a los que les gusta la física. Dando clases de repaso, todos hemos oído eso de «¿y esto para qué sirve?». Y todos hemos visto ese momento en que una idea, por fin, encaja. Queremos que pase más a menudo.",
    aboutSecond: "Physics Stars es nuestra forma de buscarlo. Hablamos con docentes, escuchamos qué les funciona en el aula y construimos el prototipo. Aún nos queda trabajo; nos interesa hacerlo con quienes lo van a usar.",
    teamLabel: "Las personas detrás de Physics Stars",
    pilotTitle: "Tú conoces el aula. Nosotros queremos escucharte.",
    pilotBody: "Estamos construyendo el prototipo digital y buscamos docentes con quienes preparar una prueba en su centro. Cuéntanos qué enseñas, qué le cuesta más al alumnado y dónde podría encajar el juego.",
    pilotNote: "Empecemos con una conversación.", pilotCta: "Hablemos de tu aula",
    prototype: "Prototipo en desarrollo", stationary: "Lectura con movimiento reducido",
    overview: {
      label: "Cómo se juega", title: "Antes de la fórmula, hay decisiones.",
      body: "En clase, el problema suele venir escrito. Aquí, el alumnado tiene que llegar hasta el enunciado: entender qué ocurre, elegir los datos y decidir qué necesita saber.",
      steps: [
        { title: "Explorar el caso", body: "Una misión, un entorno y personajes con quienes hablar. Primero hay que observar qué está pasando." },
        { title: "Elegir qué medir", body: "Recoger datos y relacionar pistas. Distinguir qué es relevante también forma parte del reto." },
        { title: "Escribir el problema", body: "Ordenar lo que se sabe y formular una pregunta que se pueda resolver con física." },
        { title: "Poner la física a trabajar", body: "Usar las herramientas de clase para encontrar una respuesta. Las pistas de la historia ayudan cuando hace falta." },
      ],
      teacherTitle: "Con un sitio en tu clase",
      teacherBody: "Lo diseñamos como complemento de las clases y los deberes, con opiniones de docentes. Los informes para detectar dificultades están previstos; todavía no están disponibles.",
    },
  },
  en: {
    genre: "A physics game for secondary school",
    heroTitle: "The question is yours to find.",
    heroBody: "A story-driven physics game for secondary school. Investigate a case, decide what to measure and use what you know to move the story forward.",
    start: "Start the journey", scroll: "Scroll. Open the case.",
    continueScroll: "The thinking behind the game", skip: "Talk about a pilot",
    navigation: "The Physics Stars journey",
    planets: [
      { name: "The mission", title: "Your turn to investigate.", body: "A scientific division recruits you. Meet the team, explore your surroundings and take on an open case. The story is waiting for your decisions." },
      { name: "The investigation", title: "You decide what matters.", body: "What would you measure? Which data are missing? Observe, connect clues and frame the problem. Writing the question is part of the work." },
      { name: "The physics", title: "Now that formula has a purpose.", body: "What you learned in class helps you make sense of what's happening. Now you have a reason to use it: solve the case and keep the story going." },
      { name: "The clues", title: "A clue. The rest is yours.", body: "If you get stuck, a character or a clue in the world points you in the right direction. Help to keep you thinking, without stepping out of the story." },
    ],
    finalTitle: "Now the question is yours.",
    finalBody: "That's how we see physics: having something you want to figure out.",
    aboutTitleLines: ["It started", "with tutoring."],
    aboutBody: "We're students who like physics. As tutors, we've all heard that question: “When will I ever use this?” And we've all seen the moment an idea finally clicks. We'd like that to happen more often.",
    aboutSecond: "Physics Stars is our way of working towards that. We talk to teachers, listen to what works in their classrooms and build the prototype. There's work ahead; we want to do it with the people who will use it.",
    teamLabel: "The people behind Physics Stars",
    pilotTitle: "You know your classroom. We're listening.",
    pilotBody: "We're building the digital prototype and looking for teachers to plan a trial at their school. Tell us what you teach, where students struggle and where the game could fit.",
    pilotNote: "It starts with a conversation.", pilotCta: "Talk about your classroom",
    prototype: "Prototype in development", stationary: "Reduced-motion reading",
    overview: {
      label: "How it plays", title: "Before the formula, there are decisions.",
      body: "In class, the problem usually comes ready-written. Here, students have to get that far themselves: work out what's happening, choose their data and decide what they need to know.",
      steps: [
        { title: "Explore the case", body: "A mission, a setting and characters to talk to. First, observe what's happening around you." },
        { title: "Choose what to measure", body: "Collect data and connect clues. Working out what's relevant is part of the challenge." },
        { title: "Write the problem", body: "Organise what you know and ask a question that physics can help you answer." },
        { title: "Put physics to work", body: "Use your classroom tools to find an answer. Clues within the story help when you need them." },
      ],
      teacherTitle: "A place in your classroom",
      teacherBody: "We're designing it to complement lessons and homework, with teachers' input. Reports to identify learning difficulties are planned; they're not available yet.",
    },
  },
};
