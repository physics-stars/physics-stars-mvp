# Rework público — 8 de noviembre de 2026

## Dirección

Actualización del movimiento: [variante de scroll continuo](continuous-scroll-experiment.md).
Esta variante sustituye los bloqueos, pausas y tiempos de espera documentados
en el rework original.

La identidad nace de una idea concreta: antes de aplicar una fórmula, alguien
tiene que descubrir qué pregunta quiere resolver. El origen del equipo dando
clases de repaso conecta esa idea con la pregunta que conocen: «¿y esto para qué sirve?».
El tono es cercano y específico. Se evita repetir «aventura» y «descubrir»,
prometer resultados educativos o presentar el prototipo como un juego terminado.

Referencias consultadas: [Linear](https://linear.app/) y [Brilliant](https://brilliant.org/).
Se tomó como criterio la claridad de jerarquía y la concreción del producto;
el espacio, la paleta y el movimiento siguen siendo los de Physics Stars.
Revisión con `frontend-design`, crítica independiente de diseño,
[Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
y React Best Practices.

## Sistema visual

- Espacio `#080A18`, papel `#F8F7FB`, tinta `#2A223B`, lila `#EEE9F5`,
  morado `#7542AD` y amarillo del logo `#FDD835`.
- Barlow Semi Condensed para titulares de peso 600, con tracking `-0.025em`.
  Barlow para lectura y controles. Exo 2 conserva la marca original.
- Cinco archivos WOFF2 locales de Barlow, unos 110 KB en total, con licencia OFL.
  Los estilos y las variables tipográficas viven dentro de `PublicShell`.
- Cabecera con enlaces de 14 px, punto activo, selector de idioma subrayado
  y acceso de contraste claro. Alturas conservadas: 76/68 px.
- Método abierto en dos columnas: premisa a la izquierda, secuencia real de
  cuatro decisiones a la derecha. Una nota lila distingue la información docente.
- Equipo sobre lila, relato en dos párrafos y fotografías abiertas al pie.
- Contacto con invitación concreta, estado del prototipo visible y enlace de correo en el pie.
- Login con el logo original sobre violeta y un formulario claro de lectura amplia.

## Alcance conservado

Solo `/`, presentación de `/login` y sus componentes exclusivos. No se modifican
`globals.css`, layout raíz, pantallas internas, APIs, sesiones, permisos,
credenciales ni redirecciones. `LoginForm.tsx` conserva exactamente su código.

El recorrido de los planetas, la estrella principal, las pausas y los tiempos
de la intro se conservan. `StarVoyageScene.tsx` y sus módulos de movimiento no
cambian. Por petición posterior, `LandingDescent.tsx` y `descent-motion.ts`
corrigen la adaptación del recorrido inferior a los textos y al encuadre;
se mantienen los atributos de anclaje. `StarVoyage.tsx` solo sustituye su fondo
decorativo por `VoyageStarfield`, por petición posterior del usuario. En
`voyage.module.css` cambian la presentación del texto y la retirada del fondo
anterior. La escena continúa midiendo los títulos
y adaptando su composición mediante su lógica existente.

## Verificación

- Compilación de producción y TypeScript correctos.
- ESLint sobre `src`, `prisma` y `next.config.ts`: cero errores; un aviso previo
  de `eslint-disable` innecesario en `src/lib/db/client.ts`.
  El comando sin filtros intenta recorrer una carpeta temporal preexistente con
  permisos restringidos; la verificación se limita a las fuentes del proyecto.
- Textos de intro y slides sin cortes en ESP/CA/EN a 320×740, 390×844,
  768×1024, 844×390 y 1440×900. Recorrido de los cinco destinos en móvil.
- Apartados inferiores sin desbordamiento a 320/390/768/1440 px en los tres idiomas.
- Movimiento reducido, navegación con teclado, enlace de salto, foco de contraste
  alto, preferencia pública de idioma y conservación de `redirectTo` comprobados.
- Login: campos vacíos, mostrar/ocultar contraseña, envío con botón deshabilitado
  y texto de espera, y errores 401/403/429/500/red
  comprobados en los tres idiomas mediante respuestas simuladas en navegador.
  No se inicia sesión con cuentas reales ni se modifica la base de datos.
- Cierre del recorrido comprobado hasta su desbloqueo, con el indicador para
  continuar dentro de la pantalla.
- Capturas revisadas en escritorio y móvil en `output/playwright/rework-*`.
  Los scripts de comprobación son locales e ignorados por Git en `.tmp/qa/`.

## Ajuste del cielo

Por petición del usuario, el patrón repetido de puntos se sustituye por 24
estrellas distantes y cinco estrellas con halo y destellos finos de cuatro rayos.
Son ciclos suaves independientes de 13–29 segundos, sin desplazamiento ni
parpadeos rápidos. En móvil quedan doce estrellas distantes y tres con destello.
Todo está aislado en `VoyageStarfield.tsx` y `starfield.module.css`, sin imágenes,
dependencias ni cambios en los motores del viaje. Se comprobó el pulso real de
las animaciones, el descenso de densidad en móvil y el modo de movimiento reducido.

## Recorrido y composición adaptables

La barra del equipo está encima de las fotografías. La luz entra al alcanzar
su posición visible, sin esperar al final de la sección. Durante la entrada y
la carga se permite bajar dentro del equipo, con límite en su final; subir y
pasar a la siguiente sección quedan bloqueados. El piloto recibe la luz al
final de su sección. Cuando todo el apartado cabe en pantalla, la aproximación
se completa automáticamente, sin dejar la luz suspendida esperando otro gesto.

Los títulos del equipo tienen dos líneas explícitas en escritorio en EN / ES /
CA y vuelven al flujo normal en móvil. En móvil se usan márgenes simétricos de
32 px, nombres en una línea y cargos debajo. La barra del equipo se acorta 10 px
por extremo; el CTA deja 12 px adicionales a su derecha para la entrada tangente.
El texto de contacto conserva una línea y su subrayado vuelve a quedar próximo.
El estado del prototipo utiliza la misma raya que los otros apartados.

El carril móvil mide 18 px desde el borde útil de la página, con halo de 8 px
y una onda suave. La entrada conserva la tangencia y el margen frente al texto
y las fotografías.
La salida derecha conserva su tangencia y utiliza un giro más compacto; en
escritorio el carril queda más lejos del borde. La geometría utiliza el ancho
real sin la barra de scroll y se recalcula al cambiar fuentes o proporciones.

Un único RAF actualiza el desplazamiento y la luz. Rueda, teclado y gesto táctil
cambian un destino limitado por la siguiente parada de lectura; el sobrante no
pasa a otro slide. El imán usa ese mismo destino. La reversa descarta la cola
anterior y la llegada absorbe la inercia, permitiendo reanudar con un gesto nuevo
o con entrada continua deliberada tras una pausa breve. El flash del matraz
dura 300 ms y la iluminación de las barras 340 ms.

`pnpm test:motion` ejecuta 49 pruebas de geometría, scroll y estela. La revisión conjunta
de movimiento, estela, gestos e imán suma 71 pruebas. Compilación, TypeScript y
ESLint de los archivos cambiados correctos. La composición se verifica en 24
combinaciones de idioma y pantalla (320–1920 px), incluyendo títulos de dos
líneas, nombres, cargos y CTA. Se comprueban ráfagas de varias pantallas con
inercia, regreso al matraz y redimensionamiento durante el vuelo; la prueba
específica de la carga permite bajar, impide subir y respeta el límite del equipo
con pantallas de 390×600, 320×600, 844×390 y 1280×600.
También se comprueba el gesto táctil emulado, activar movimiento reducido en
pleno vuelo y la carga automática de ambos apartados completos en escritorio.

La referencia confirmada es `c473e92`, la última versión guardada antes del
rework de textos y estilo. Se recuperan sus curvas y su coordenada de scroll:
140 px de salida, un píxel de vuelo por píxel de página y 100 px de entrada.
Se retira la velocidad calculada según la longitud visible y la altura del
apartado. Solo se adaptan los anclajes a la barra elevada, el carril móvil y las
ventanas bajas. Se mantienen el diseño y los cambios posteriores autorizados.

El imán espera 420 ms sin actividad y deja terminar el desplazamiento ya
aceptado. Durante el gesto no actúa; cualquier entrada nueva cancela el encaje.
El retorno usa una curva de transición quíntica de 1,2 s (1 s en el indicador
del logo). La salida de ese indicador conserva 900 ms.

La estela de los planetas mide 180 px en PC y 120 px en móvil. El último ajuste
de la primera diapositiva reduce únicamente su relleno inferior de 32 a 16 px;
no modifica los espacios internos ni el tamaño del texto.

Al regresar desde la primera diapositiva al logo, una pausa de 900 ms descarta
la entrada y vuelve a absorber su cola de inercia; un gesto nuevo permite seguir
después. En móvil, los nombres y cargos se agrupan en columna con 3 px de separación.
