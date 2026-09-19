import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Brain,
  Gamepad2,
  Target,
  Zap,
  Lightbulb,
  Trophy,
  GraduationCap,
  MapPin,
  Mail,
  Compass,
  ArrowRight,
  CheckCircle2,
  TrainFront,
} from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

export const metadata: Metadata = {
  description:
    "Physics Stars transforma l'aprenentatge de la física de 4rt d'ESO en una aventura interactiva.",
};

/*
 * Landing pública de Physics Stars. Contingut adaptat del prototip
 * original, amb un únic llenguatge visual (pergamí clar + fusta per
 * emmarcar + ambre només com a detall puntual) en lloc d'una metàfora
 * diferent per bloc de contingut.
 */

const MISSION_PILLARS = [
  {
    icon: Brain,
    title: "Aprenentatge interactiu",
    description:
      "Assimilar els conceptes estudiats resolent problemes versemblants i immersius.",
  },
  {
    icon: Gamepad2,
    title: "Gamificació",
    description:
      "Una narrativa atractiva, dinàmiques de videojoc i un sistema de recompenses.",
  },
  {
    icon: Target,
    title: "Resultats reals",
    description:
      "Millorar el nivell en competències bàsiques i el rendiment i la motivació en física.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Més enllà d'un simple software",
    description:
      "Els reptes no funcionen amb la lògica de \"resol l'exercici i s'obrirà la porta\". A Physics Stars, l'ús de la física no s'imposa de forma artificial: l'alumnat s'enfronta a problemes versemblants dins d'una trama on la física és la solució real.",
  },
  {
    icon: Lightbulb,
    title: "La física és pensament crític",
    description:
      "La física no ha de consistir en memoritzar i aplicar fórmules. A Physics Stars, l'alumnat construeix el seu propi enunciat interactuant amb un entorn immersiu.",
  },
  {
    icon: Trophy,
    title: "Motivador per a l'alumnat",
    description:
      "Physics Stars manté la motivació i estimula el pensament crític sense frustrar qui va més endarrerit ni avorrir qui va més avançat, oferint ajuda accessible i recompensant l'autonomia.",
  },
  {
    icon: GraduationCap,
    title: "Tenim en compte el professorat",
    description:
      "No pretenem reinventar l'ensenyament: Physics Stars actua com un complement als deures, fàcil d'integrar a les dinàmiques escolars.",
  },
];

type RoadmapStatus = "completed" | "in_progress" | "upcoming";

const ROADMAP: { phase: string; status: RoadmapStatus; items: string[] }[] = [
  {
    phase: "Fase 1: Pilot en paper a escoles",
    status: "completed",
    items: [
      "Prova pilot en format paper testada en múltiples aules de 4t d'ESO.",
      "Validació de la metodologia i la narrativa.",
      "Recollida de feedback de l'aula i iteracions.",
    ],
  },
  {
    phase: "Fase 2: MVP digital — Cinemàtica",
    status: "in_progress",
    items: [
      "Implementació del primer món: Cinemàtica.",
      "Mecàniques base: narrativa, experiència d'usuari i sistema de pistes.",
      "Recollida de feedback i test de viabilitat amb usuaris reals.",
    ],
  },
  {
    phase: "Fase 3: Primera versió completa",
    status: "upcoming",
    items: [
      "Cerca d'inversors i socis per codesenvolupar.",
      "Desenvolupament d'una primera versió completa del producte.",
      "Tests amb escoles i iteració intensiva.",
    ],
  },
  {
    phase: "Fase 4: Implementació i creixement",
    status: "upcoming",
    items: [
      "Integració a les primeres escoles i inici de facturació.",
      "Millora constant basada en dades i valoracions del professorat.",
      "Escalat progressiu a més centres i territoris.",
    ],
  },
];

const TEAM = [
  { name: "David Diestre", role: "Cofundador i Visionari", photo: "/team/david.jpg" },
  { name: "Juan Roset", role: "Cofundador i Estratègia", photo: "/team/juan.png" },
  { name: "Marcel Povill", role: "Desenvolupador Principal", photo: "/team/marcel.jpg" },
  { name: "Aissam Khadraoui", role: "Disseny i Experiència d'Usuari", photo: "/team/aissam.jpg" },
];

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  completed: "Completat",
  in_progress: "En curs",
  upcoming: "Properament",
};

export default function LandingPage() {
  return (
    <>
      <SiteNav />

      <main className="flex flex-1 flex-col">
        <Hero />
        <MissionSection />
        <FeaturesSection />
        <RoadmapSection />
        <TeamSection />
        <ContactSection />
      </main>

      <SiteFooter />
    </>
  );
}

function SiteNav() {
  return (
    <nav className="band-wood fixed inset-x-0 top-0 z-50 px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.18)] sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="" width={30} height={30} />
          <span className="heading-display text-lg font-bold tracking-wide text-parchment">
            Physics Stars
          </span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-parchment/25 px-5 py-2 text-sm font-semibold text-parchment transition-colors hover:border-brand-primary hover:bg-brand-primary hover:text-wood-dark"
        >
          Accés
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, var(--parchment) 0%, transparent 70%)",
        }}
      />
      <div className="flex max-w-3xl flex-col items-center gap-8">
        <Reveal>
          <h1 className="heading-display text-5xl font-black leading-tight text-foreground sm:text-7xl">
            Pensa com un <span className="text-brand-primary">Científic</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-xl text-lg text-foreground-muted sm:text-xl">
            Transforma l&apos;aprenentatge de la física en una aventura interactiva.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 rounded-xl bg-brand-primary px-8 py-4 text-lg font-bold text-wood-dark shadow-[0_10px_24px_-10px_rgba(53,40,26,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-brand-primary-hover"
          >
            Comença l&apos;Aventura
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-background-elevated/70 px-4 py-2 text-sm text-foreground-muted">
            <Compass className="h-4 w-4 text-wood" />
            Fes scroll per conèixer Physics Stars
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section id="missio" className="px-4 py-24 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <Reveal>
          <SectionHeading
            eyebrow="La nostra missió"
            title="Tres pilars, un objectiu"
            description="Acosta't a la taula: aquests són els pilars sobre els quals construïm Physics Stars."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {MISSION_PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.1}>
              <div className="panel-glass flex h-full flex-col gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-wood/10 text-wood">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="heading-display text-xl font-bold text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {pillar.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      id="diferenciacio"
      className="border-y border-border-subtle bg-background-elevated/50 px-4 py-24 sm:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <Reveal>
          <SectionHeading
            eyebrow="En què ens diferenciem"
            title="Per què les metodologies tradicionals fallen"
            description="I què fem nosaltres de manera diferent."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <div className="panel-glass flex h-full flex-col gap-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="heading-display text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StationMarker({ status }: { status: RoadmapStatus }) {
  if (status === "in_progress") {
    return (
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-primary bg-parchment shadow-[0_0_0_5px_rgba(191,126,46,0.15)]">
        <TrainFront className="h-5 w-5 text-brand-primary" />
        <span className="absolute -left-17 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-brand-primary">
          Som aquí
        </span>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-wood bg-wood text-parchment">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="h-10 w-10 shrink-0 rounded-full border-2 border-border-subtle bg-background" />
  );
}

function RoadmapSection() {
  return (
    <section id="roadmap" className="px-4 py-24 sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-14">
        <Reveal>
          <SectionHeading eyebrow="Cap on anem" title="La jornada per endavant" />
        </Reveal>

        <div className="panel-parchment p-5 sm:p-10">
          <ol className="relative flex flex-col gap-10 ml-9">
            <div className="rail-track absolute left-5 top-2 bottom-2 w-4 -translate-x-1/2" />

            {ROADMAP.map((item, index) => (
              <li key={item.phase} className="relative flex gap-5">
                <div className="relative z-10 flex w-10 shrink-0 justify-center">
                  <StationMarker status={item.status} />
                </div>

                <Reveal
                  delay={index * 0.08}
                  className={clsx("min-w-0 flex-1", item.status === "upcoming" && "opacity-60")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="heading-display text-base font-bold text-foreground">
                      {item.phase}
                    </h3>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                        item.status === "in_progress" && "bg-brand-primary/20 text-brand-primary",
                        item.status === "completed" && "bg-emerald-600/15 text-emerald-700",
                        item.status === "upcoming" && "bg-border-subtle/70 text-foreground-muted",
                      )}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1.5 rounded-xl bg-background/50 p-4">
                    {item.items.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-foreground-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wood/60" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section
      id="equip"
      className="border-y border-border-subtle bg-background-elevated/50 px-4 py-24 sm:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <Reveal>
          <SectionHeading
            eyebrow="Qui hi ha darrere"
            title="L'equip de Physics Stars"
            description="Estudiants d'Enginyeria Matemàtica i Física i d'Enginyeria Informàtica de la URV, units per un mateix objectiu."
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {TEAM.map((member, index) => (
            <Reveal key={member.name} delay={index * 0.08}>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-background-elevated-strong sm:h-32 sm:w-32">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-xs text-foreground-muted">{member.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacte" className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="panel-parchment flex flex-col gap-8 p-8 sm:p-12">
            <SectionHeading
              eyebrow="Parlem"
              title="Contacte"
              description="Pots trobar-nos a la nostra base d'operacions o enviar-nos un correu."
              align="left"
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wood/10 text-wood">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Base d&apos;operacions</h4>
                  <p className="text-sm text-foreground-muted">Campus Sescelades, Tarragona</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wood/10 text-wood">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Correu electrònic</h4>
                  <a
                    href="mailto:info@physicsstars.com"
                    className="text-sm text-foreground-muted underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
                  >
                    info@physicsstars.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="band-wood px-4 py-8 text-center text-sm text-parchment/70">
      © {new Date().getFullYear()} Physics Stars · Tots els drets reservats
    </footer>
  );
}
