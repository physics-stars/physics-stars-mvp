# Physics Stars

Joc educatiu interactiu perquè l'alumnat de 4rt d'ESO de Catalunya aprengui
física a través d'una història i reptes. Aquest repositori conté el
frontend i el backend (Next.js), pensats per desplegar-se a Vercel amb una
base de dades Neon Postgres. El joc en si es desenvolupa per separat en
Unity i s'incrustarà al frontend com a contingut WebGL.

## Stack tècnic

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Base de dades**: Neon Postgres, a través de Prisma ORM
- **Autenticació**: sistema manual (sense llibreries de tercers com
  NextAuth), amb hashing Argon2id i sessions guardades a base de dades
- **Desplegament**: Vercel

## Estructura del projecte

```
src/
  app/                    Rutes (pàgines i API) de Next.js
    api/auth/              Endpoints d'autenticació (login, logout, session)
    login/                 Pàgina de login
    menu/                  Àrea protegida (requereix sessió)
  components/
    ui/                    Components d'interfície reutilitzables
    auth/                  Components relacionats amb l'autenticació
  server/
    services/              Lògica de negoci (auth-service, current-user)
    repositories/          Accés a dades via Prisma
    security/               Hashing, tokens de sessió, rate limiting, CSRF
  lib/
    db/                    Client de Prisma (singleton)
    validation/             Esquemes Zod
    config/                 Configuració i variables d'entorn tipades
  middleware.ts            Redirecció ràpida de rutes protegides
prisma/
  schema.prisma            Model de dades (User, Session)
  seed.ts                  Script per crear un usuari de prova
```

## Primers passos

1. Instal·la les dependències:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` i omple `DATABASE_URL` / `DIRECT_URL` amb
   les credencials de la teva base de dades Neon (es poden obtenir
   automàticament instal·lant la integració de Neon des del marketplace
   de Vercel).

3. Aplica el model de dades a la base de dades:

   ```bash
   npm run db:migrate
   ```

4. (Opcional) Crea un usuari de prova:

   ```bash
   npm run db:seed
   ```

   Crea l'usuari `demo.alumne` amb la contrasenya `Estrella2026!`.

5. Engega el servidor de desenvolupament:

   ```bash
   npm run dev
   ```

   Obre [http://localhost:3000](http://localhost:3000).

## Autenticació

El sistema d'autenticació és manual i està dissenyat seguint les
recomanacions actuals de l'OWASP:

- Les contrasenyes es guarden amb **Argon2id** (mai en text pla), amb els
  paràmetres mínims recomanats per l'OWASP.
- Les sessions es guarden a la base de dades (no són JWT autocontinguts):
  el navegador només rep un token aleatori en una cookie `httpOnly`,
  `Secure` (en producció) i `SameSite=Lax`; a la base de dades només es
  desa el seu hash SHA-256. Això permet revocar sessions a l'instant.
- Les rutes que modifiquen estat comproven la capçalera `Origin` com a
  defensa addicional contra CSRF.
- Els intents de login estan limitats (rate limiting) per mitigar atacs
  de força bruta. *Nota*: la implementació actual és en memòria i pensada
  per a l'MVP; per a producció amb múltiples instàncies caldria migrar-la
  a un magatzem compartit (p. ex. Upstash Redis).
- Els missatges d'error de login són genèrics per no revelar si un nom
  d'usuari existeix (protecció contra enumeració de comptes).

## Desplegament a Vercel

1. Connecta el repositori a Vercel.
2. Instal·la la integració de Neon des del marketplace de Vercel: això
   configura automàticament `DATABASE_URL` i `DIRECT_URL`.
3. Afegeix `prisma migrate deploy` (`npm run db:deploy`) com a part del
   procés de build o executa'l manualment abans del primer desplegament.
