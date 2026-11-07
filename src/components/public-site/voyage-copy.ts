import type { Locale } from "./copy";

type VoyagePlanet = { name: string; title: string; body: string };
type OverviewStep = { title: string; body: string };

export type VoyageCopy = {
  genre: string;
  heroTitle: string;
  heroBody: string;
  start: string;
  scroll: string;
  skip: string;
  navigation: string;
  planets: [VoyagePlanet, VoyagePlanet, VoyagePlanet, VoyagePlanet];
  finalTitle: string;
  finalBody: string;
  aboutTitle: string;
  aboutBody: string;
  teamLabel: string;
  pilotTitle: string;
  pilotBody: string;
  pilotCta: string;
  prototype: string;
  stationary: string;
  readStory: string;
  overview: {
    label: string;
    title: string;
    body: string;
    steps: [OverviewStep, OverviewStep, OverviewStep, OverviewStep];
    teacherTitle: string;
    teacherBody: string;
  };
};

export const voyageCopy: Record<Locale, VoyageCopy> = {
  ca: {
    genre: "Videojoc de física per a secundària",
    heroTitle: "La física, una aventura per descobrir.",
    heroBody:
      "Physics Stars és un videojoc narratiu per aprendre física a secundària. L'alumnat investiga situacions, pren mesures i construeix el problema abans d'aplicar les fórmules.",
    start: "Comença el viatge",
    scroll: "Desplaça't per descobrir",
    skip: "Parlem del pilot",
    navigation: "El viatge de Physics Stars",
    planets: [
      {
        name: "Una missió",
        title: "Aquí, tu ets el científic.",
        body: "Una divisió científica et recluta. Hi ha una història per viure, personatges per conèixer i un misteri que necessita les teves idees.",
      },
      {
        name: "Investigar",
        title: "El problema el descobreixes tu.",
        body: "Explora, pren mesures i connecta les pistes. Abans de buscar una resposta, hauràs d'esbrinar quina és la pregunta.",
      },
      {
        name: "Entendre",
        title: "Ara la física té un perquè.",
        body: "Allò que aprens a classe es converteix en l'eina per fer avançar la missió. Aquell «i això per a què serveix?» comença a tenir resposta.",
      },
      {
        name: "Dins la història",
        title: "Fins i tot les pistes juguen el seu paper.",
        body: "Si t'encalles, l'ajuda arriba des de dins del món. La història continua, però el descobriment el fas tu.",
      },
    ],
    finalTitle: "La teva pròxima missió: entendre el món.",
    finalBody:
      "Hi ha moltes coses per descobrir. Comencem per fer-nos preguntes.",
    aboutTitle: "També hem fet classes de repàs.",
    aboutBody:
      "Ens encanta la física i tots hem fet classes de repàs. Hem vist aquella cara de «però això, per a què em servirà?», i també el moment en què una idea finalment encaixa. Physics Stars neix de voler compartir més d'aquell segon moment. Parlem amb professors, escoltem el seu feedback i construïm el prototip mentre continuem aprenent.",
    teamLabel: "Les persones darrere de Physics Stars",
    pilotTitle: "Provem Physics Stars al teu centre.",
    pilotBody:
      "Si ets docent o formes part d'un centre i vols explorar un pilot de Physics Stars, ens encantaria parlar-ne. El prototip digital està en construcció: volem donar-li forma amb les aules des del principi.",
    pilotCta: "Parlem del pilot",
    prototype: "Prototip digital en desenvolupament",
    stationary: "Versió amb moviment reduït",
    readStory: "Llegeix sense animacions",
    overview: {
      label: "Sobre Physics Stars",
      title: "Una aventura per pensar com un científic.",
      body: "Estem creant un videojoc narratiu per aprendre física a secundària. L'alumnat investiga situacions dins d'una història: primer descobreix el problema i després fa servir la física per resoldre'l.",
      steps: [
        {
          title: "Explorar una situació",
          body: "L'estudiant entra en una divisió científica, rep una missió i explora l'entorn. Els personatges i el que passa al món donen sentit a la investigació.",
        },
        {
          title: "Decidir què mesurar",
          body: "Pren mesures, recull pistes i tria les dades que necessita. El repte és entendre què importa, no només substituir valors en una fórmula.",
        },
        {
          title: "Construir el problema",
          body: "Amb el que ha descobert, formula el seu propi enunciat: què està passant, què sap i què necessita esbrinar.",
        },
        {
          title: "Aplicar la física",
          body: "Ara utilitza les eines de classe per trobar una solució. Si necessita ajuda, les pistes formen part de la història i orienten sense donar directament la resposta.",
        },
      ],
      teacherTitle: "Un complement per al professorat",
      teacherBody:
        "Desenvolupem el prototip amb el feedback de docents perquè complementi les classes i els deures. Els informes per ajudar a detectar dificultats de l'alumnat formen part del desenvolupament previst.",
    },
  },
  es: {
    genre: "Videojuego de física para secundaria",
    heroTitle: "La física, una aventura por descubrir.",
    heroBody:
      "Physics Stars es un videojuego narrativo para aprender física en secundaria. El alumnado investiga situaciones, toma medidas y construye el problema antes de aplicar las fórmulas.",
    start: "Empieza el viaje",
    scroll: "Haz scroll para descubrir",
    skip: "Hablemos del piloto",
    navigation: "El viaje de Physics Stars",
    planets: [
      {
        name: "Una misión",
        title: "Aquí, tú eres el científico.",
        body: "Una división científica te recluta. Hay una historia que vivir, personajes que conocer y un misterio que necesita tus ideas.",
      },
      {
        name: "Investigar",
        title: "El problema lo descubres tú.",
        body: "Explora, toma medidas y conecta las pistas. Antes de buscar una respuesta, tendrás que descubrir cuál es la pregunta.",
      },
      {
        name: "Entender",
        title: "Ahora la física tiene un porqué.",
        body: "Lo que aprendes en clase se convierte en la herramienta para avanzar en la misión. Ese «¿y esto para qué sirve?» empieza a tener respuesta.",
      },
      {
        name: "Dentro de la historia",
        title: "Hasta las pistas tienen su papel.",
        body: "Si te atascas, la ayuda llega desde dentro del mundo. La historia sigue, pero el descubrimiento lo haces tú.",
      },
    ],
    finalTitle: "Tu próxima misión: entender el mundo.",
    finalBody: "Queda mucho por descubrir. Empecemos por hacernos preguntas.",
    aboutTitle: "También hemos dado clases de repaso.",
    aboutBody:
      "Nos encanta la física y todos hemos dado clases de repaso. Hemos visto esa cara de «¿pero esto para qué me servirá?», y también el momento en que una idea por fin encaja. Physics Stars nace de querer compartir más de ese segundo momento. Hablamos con profesores, escuchamos su feedback y construimos el prototipo mientras seguimos aprendiendo.",
    teamLabel: "Las personas detrás de Physics Stars",
    pilotTitle: "Probemos Physics Stars en tu centro.",
    pilotBody:
      "Si eres docente o formas parte de un centro y quieres explorar un piloto de Physics Stars, nos encantaría hablar. El prototipo digital está en construcción: queremos darle forma con las aulas desde el principio.",
    pilotCta: "Hablemos del piloto",
    prototype: "Prototipo digital en desarrollo",
    stationary: "Versión con movimiento reducido",
    readStory: "Leer sin animaciones",
    overview: {
      label: "Sobre Physics Stars",
      title: "Una aventura para pensar como un científico.",
      body: "Estamos creando un videojuego narrativo para aprender física en secundaria. El alumnado investiga situaciones dentro de una historia: primero descubre el problema y después usa la física para resolverlo.",
      steps: [
        {
          title: "Explorar una situación",
          body: "El estudiante entra en una división científica, recibe una misión y explora el entorno. Los personajes y lo que pasa en el mundo dan sentido a la investigación.",
        },
        {
          title: "Decidir qué medir",
          body: "Toma medidas, recoge pistas y elige los datos que necesita. El reto es entender qué importa, no solo sustituir valores en una fórmula.",
        },
        {
          title: "Construir el problema",
          body: "Con lo que ha descubierto, formula su propio enunciado: qué está pasando, qué sabe y qué necesita averiguar.",
        },
        {
          title: "Aplicar la física",
          body: "Ahora usa las herramientas de clase para encontrar una solución. Si necesita ayuda, las pistas forman parte de la historia y orientan sin dar directamente la respuesta.",
        },
      ],
      teacherTitle: "Un complemento para el profesorado",
      teacherBody:
        "Desarrollamos el prototipo con el feedback de docentes para complementar las clases y los deberes. Los informes para ayudar a detectar dificultades del alumnado forman parte del desarrollo previsto.",
    },
  },
  en: {
    genre: "A physics game for secondary school",
    heroTitle: "Physics. An adventure worth exploring.",
    heroBody:
      "Physics Stars is a story-driven game for learning physics in secondary school. Students investigate situations, take measurements and frame the problem before applying formulas.",
    start: "Start the journey",
    scroll: "Scroll to discover",
    skip: "Let's talk about a pilot",
    navigation: "The Physics Stars journey",
    planets: [
      {
        name: "A mission",
        title: "You're the scientist here.",
        body: "A scientific division recruits you. There's a story to live, characters to meet and a mystery that needs your ideas.",
      },
      {
        name: "Investigate",
        title: "The problem is yours to discover.",
        body: "Explore, take measurements and connect the clues. Before you look for an answer, you'll have to find the question.",
      },
      {
        name: "Understand",
        title: "Now physics has a purpose.",
        body: "What you learn in class becomes the tool that moves your mission forward. That question, ‘When will I ever use this?’, starts to have an answer.",
      },
      {
        name: "Inside the story",
        title: "Even the clues play their part.",
        body: "If you get stuck, help comes from within the world. The story keeps going, but the discovery is yours to make.",
      },
    ],
    finalTitle: "Your next mission: understand the world.",
    finalBody: "There's more to discover. Let's start by asking questions.",
    aboutTitle: "We've all tutored physics students.",
    aboutBody:
      "We love physics, and we've all tutored. We've seen that look of “but when will I use this?”, and we've seen the moment an idea finally clicks. Physics Stars comes from wanting to share more of that second moment. We talk to teachers, listen to their feedback and build the prototype while we keep learning.",
    teamLabel: "The people behind Physics Stars",
    pilotTitle: "Let's explore a pilot at your school.",
    pilotBody:
      "If you're a teacher or part of a school interested in exploring a Physics Stars pilot, we'd love to talk. The digital prototype is taking shape, and we want classrooms to be part of it from the start.",
    pilotCta: "Let's talk about a pilot",
    prototype: "Digital prototype in development",
    stationary: "Reduced-motion version",
    readStory: "Read without animations",
    overview: {
      label: "About Physics Stars",
      title: "An adventure in thinking like a scientist.",
      body: "We're creating a story-driven game for learning physics in secondary school. Students investigate situations within a story: first they discover the problem, then they use physics to solve it.",
      steps: [
        {
          title: "Explore a situation",
          body: "The student joins a scientific division, receives a mission and explores the environment. The characters and events in the world give the investigation a purpose.",
        },
        {
          title: "Decide what to measure",
          body: "Students take measurements, collect clues and choose the data they need. The challenge is understanding what matters, beyond substituting values into a formula.",
        },
        {
          title: "Frame the problem",
          body: "Using their discoveries, students formulate their own problem: what's happening, what they know and what they need to find out.",
        },
        {
          title: "Apply physics",
          body: "Now they use classroom tools to find a solution. If they need help, clues belong to the story and guide the investigation without simply giving away the answer.",
        },
      ],
      teacherTitle: "A complement for teachers",
      teacherBody:
        "We're developing the prototype with teachers' feedback to complement lessons and homework. Reports to help identify where students struggle are part of the planned development.",
    },
  },
};
