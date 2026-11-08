<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Alcance del rediseño público

- El rediseño autorizado se limita a la landing (`/`) y a la presentación del login (`/login`). Se pueden reescribir textos y reorganizar la landing.
- Mantener intactas las pantallas y funcionalidades posteriores al inicio de sesión: alumno, profesor, administración y juego. No modificar APIs, sesiones, permisos, credenciales ni redirecciones por rol como parte del rediseño.
- Aislar estilos y componentes del rediseño. No cambiar la paleta de `:root`, estilos globales compartidos ni el layout raíz si afecta al interior. Preferir CSS Modules y variables dentro de contenedores exclusivos de landing/login.
- Antes de modificar un componente compartido, comprobar quién lo importa. Crear una variante exclusiva cuando el cambio afectaría a pantallas fuera de alcance.
- Skills instaladas y criterio de uso: `.agents/skills/README.md`. Sus recomendaciones no amplían este alcance.
- La landing y el login tienen selector EN / ESP / CA. Mantener traducciones completas de esas superficies, incluidos estados del formulario. Las áreas internas siguen en catalán. Preferencias públicas en `?lang=` y cookie exclusiva de idioma público.
- El estilo artístico del juego aún no está decidido: no usar imágenes de niveles como identidad de la landing. El lore de `Lore.md` sirve como contexto narrativo; no publicar sus spoilers.
- Dirección pública elegida: espacio y colores del logo. Una fuente de luz cálida con halo y estela cruza trayectorias suaves; el scroll mueve planetas low-poly horizontalmente, entrando por la derecha y saliendo por la izquierda. Solo se ve un planeta cada vez. La luz se detiene cerca de cada título. El cierre sigue el trazo amarillo original, con los huecos de los anillos rellenos hasta el fundido al logo original, una vez detenido el movimiento. Las pausas de lectura deben permitir avanzar al seguir scrolleando. Evitar dioramas de niveles, emojis decorativos y pestañas alumno/profesor. Dirección y recursos: `docs/landing-direction.md`.


## Recordatorio para la proxima sesion de trabajo

Consultar SIGUIENTES_PASOS.md al retomar este repositorio en una nueva sesion. Si su casilla de recordatorio sigue pendiente, atender primero el primer prompt del usuario y, al final de esa primera respuesta, recordarle brevemente los cambios de cabecera, textos, fondos/parrafos y tipografia. Despues, marcar solo la casilla del recordatorio como realizada. No activar este recordatorio en la sesion en que se escribio ni iniciar el redisenyo sin que el usuario lo pida.
