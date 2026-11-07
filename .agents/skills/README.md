# Skills para la landing y el login de Physics Stars

Preparación: 2026-11-07. Esta instalación no modifica la interfaz ni añade dependencias a la aplicación.

## Base instalada

| Skill | Fuente | Responsabilidad |
| --- | --- | --- |
| `frontend-design` | [Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Dirección visual específica del producto, tipografía, composición, color, movimiento y textos claros. Evitar decisiones de plantilla. |
| `web-design-guidelines` | [Vercel](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Revisar accesibilidad, interacción y calidad de la interfaz con las guías actualizadas del autor. |
| `playwright` | [OpenAI](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | Comprobar páginas reales, navegación, formularios, comportamiento responsive y capturas. No añade tests automáticamente. |

Las versiones exactas están registradas en `SOURCES.json`. Cada carpeta conserva los archivos de la skill original. Instalar instrucciones no equivale a instalar sus herramientas de ejecución.

## Alcance obligatorio

- Solo landing `/` y presentación de `/login`, incluyendo sus componentes exclusivos.
- La landing puede cambiar de estructura y textos; mantener el idioma catalán del producto salvo petición del usuario.
- Mantener intactos alumno, profesor, administración, menús y juego tras el login.
- Mantener autenticación, sesiones, permisos, envío del formulario y redirecciones existentes.
- `src/app/globals.css` y `src/app/layout.tsx` afectan a toda la aplicación. Usar estilos aislados; no sustituir tokens globales para rediseñar la parte pública.
- Consultar las guías de la versión local de Next.js en `node_modules/next/dist/docs/` antes de escribir código.

## Flujo recomendado para el próximo rediseño

1. Leer el contenido real y los recursos disponibles. Definir audiencia, objetivo de la landing y una dirección visual concreta para Physics Stars.
2. Usar `frontend-design` para desarrollar una propuesta coherente. No inventar testimonios, cifras, resultados educativos ni funcionalidades.
3. Implementar únicamente las superficies autorizadas con estilos aislados. El login conserva su funcionamiento.
4. Aplicar `web-design-guidelines` a los archivos cambiados.
5. Verificar desktop y móvil, teclado, foco, contraste, movimiento reducido, enlaces y estados del login. Revisar capturas reales; pasar lint y los checks adecuados al cambio.
6. Revisar el diff para confirmar que no se han cambiado las áreas internas ni estilos compartidos que alteren su presentación.

La skill de Playwright incluye un wrapper Bash y ejemplos para instalación global. En este proyecto Windows, resolver rutas hacia esta carpeta local y usar una herramienta de navegador disponible o el CLI compatible; no asumir que el wrapper `.sh` funciona directamente en PowerShell. No instalar paquetes globales solo por preparar las skills.

## Alternativas contrastadas, no instaladas

No es un catálogo exhaustivo de GitHub. Estas opciones complementan o se solapan con la base anterior:

- [Impeccable, de pbakaus](https://github.com/pbakaus/impeccable): herramientas para crítica, auditoría, tipografía, layout y pulido. Su versión actual usa la skill `impeccable`; `frontend-design` es un alias obsoleto en ese repositorio. La distribución actual incorpora un motor y puede configurar hooks/modo live; valorar esas capacidades por separado antes de instalarlas.
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): catálogo consultable de estilos, paletas, combinaciones tipográficas y recomendaciones. Útil para explorar, pero sus combinaciones necesitan criterio específico para el producto.
- [Frontend App Builder, de OpenAI](https://github.com/openai/plugins/tree/main/plugins/build-web-apps/skills/frontend-app-builder): flujo que exige conceptos mediante Image Gen y comparación visual con la implementación. Alternativa para trabajar desde maquetas generadas; no se instala junto al director de diseño base para evitar procesos superpuestos por defecto.
- [React Best Practices, de Vercel](https://github.com/vercel-labs/agent-skills): revisión técnica de React; complementa rendimiento y estructura, no sustituye la dirección visual.
- [Skills de Figma, de OpenAI](https://github.com/openai/skills/tree/main/skills/.curated): útiles si se elige Figma como fuente del diseño; requieren las herramientas y el acceso correspondientes.

Una skill ayuda a sostener un proceso; el resultado depende del concepto, contenido real, recursos visuales y revisión en navegador. La cantidad de skills no garantiza calidad.
