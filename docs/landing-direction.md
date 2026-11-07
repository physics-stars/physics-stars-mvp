# Physics Stars: dirección de la parte pública

## Identidad y contenido

Una aventura científica nacida de estudiantes que aman la física y han dado clases de repaso. El tono tiene entusiasmo y curiosidad, con una premisa clara para quien llega por primera vez: un videojuego narrativo de física para secundaria. El lore aporta la división científica y las misiones, sin publicar giros de la historia.

La animación presenta cuatro ideas: ponerse en la piel de un científico, descubrir el problema, dar sentido a la física de clase y recibir pistas dentro de la historia. La explicación completa del método y su encaje docente continúa después, seguida del equipo y el piloto. Se distingue el prototipo actual de los informes previstos. Contacto: david.diestre.r@gmail.com.

## Sistema visual

- Espacio #080A18, blanco #F0F6F6, lila #7C46B6 y amarillo #FDD835, derivados del logo propio.
- Tipografía Geist Sans para títulos y lectura. Exo 2 para el nombre Physics Stars de cabecera, cierre y pie, con dos pesos para distinguir las palabras sin dificultar la lectura.
- Pantalla fijada durante el viaje horizontal; la imagen acompaña a la lectura, sin tarjetas ni emojis decorativos.
- Referencia de Tierra aportada por el usuario: océano facetado, continentes elevados con paredes costeras y nubes de geometría angular. El low poly depende del relieve y la luz, sin un mosaico de colores por triángulo.

## Movimiento y lectura

Tierra, Luna, Saturno y Neptuno son elementos visuales, sin nombres astronómicos en la interfaz. Solo aparece uno cada vez, entrando por la derecha y saliendo por la izquierda. El primer scroll inicia el movimiento.

Cada planeta gira solo 15° sobre su eje en todo su paso: la mitad al entrar y la mitad al salir. Ambas fases se frenan y reanudan suavemente; el planeta permanece quieto durante la lectura.

Una fuente de luz cálida con halo suave sigue curvas por detrás y delante de cada mundo. La trayectoria se diseña en la proyección visible y la profundidad se añade después. La llegada entra detrás desde arriba a la izquierda y emerge fuera del contorno inferior derecho. La luz se acerca a la cámara y se sitúa junto a la esquina superior derecha de las letras del título, cuyas dimensiones se miden en el DOM. Durante la lectura brilla más y la estela desaparece. La iluminación del texto es amarilla, difusa y muy tenue.

La estela conserva el historial del recorrido en pantalla. Cada inversión efectiva del movimiento borra el historial y empieza a dibujar desde ese punto; detener el scroll a mitad de vuelo conserva la estela. Al volver al inicio se desvanece por completo. La profundidad de cada muestra mantiene la ocultación por los planetas.

La referencia de movimiento elegida es una persona moviendo una varita mágicamente: variación amplia y orgánica a escala global, suavidad a escala local y ritmo estable. Una S larga y suave es válida; evitar ganchos cortos, caídas en picado, parábolas repetidas, rectas de conexión y maniobras circulares idénticas. No imponer puntos orbitales que deformen la trayectoria para alcanzarlos. Al detenerse y continuar, la dirección debe conservarse.

Para mejorar la duración de las transiciones, los planetas deben entrar y salir antes. No compensar una trayectoria demasiado larga acelerando la luz. El desplazamiento de los planetas tiene su propio calendario; la curva de la luz se diseña en la proyección visible y se recorre por distancia, sin reiniciar aceleraciones en sus uniones internas.

La órbita amarilla no alimenta la estela fina. Al retroceder desde el logo, esta empieza de cero al abandonar el amarillo. El brillo junto a los títulos tiene un pequeño suavizado temporal y se intensifica progresivamente durante el fundido final.

Un único progreso amortiguado controla escena y textos, con velocidad máxima de vuelo. El seguimiento progresivo toma como referencia el patrón documentado por [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), implementado con las MotionValues ya presentes. Cada texto es un punto de lectura: descarta la inercia acumulada con una pausa breve, limitada a 350 ms si se continúa scrolleando. Rueda, teclado y pantalla táctil permiten retomar el vuelo. Los enlaces permiten saltar el recorrido y el modo sin animaciones conserva todo el contenido.

La última curva se abre hacia la derecha y conecta desde abajo con el trazo amarillo original. Su revelado usa la misma longitud de recorrido que sigue el centro de la luz. Los trazos principales morado y blanco conservan la geometría del SVG; los huecos pequeños permanecen rellenos hasta que el amarillo alcanza cada cruce. Los huecos reservados a la estrella definitiva permanecen rellenos hasta el fundido final. El halo y la luz sobre los discos no cambian de régimen al empezar la órbita. La luz conserva su escala durante la vuelta. Solo cuando se detiene empieza el fundido suave del conjunto al SVG exacto, con la misma proyección y tamaño.

El texto de cierre aparece después de formarse el logo, con una transición temporal de 1,35 segundos. El scroll no sale del viaje hasta completar ambos. Volver desde los apartados inferiores sitúa el viaje en el logo terminado; rebobinar y repetir vuelve a activar el bloqueo final. El final del viaje también es un punto de encaje del scroll para poder regresar desde los apartados con snap.

Los anillos se colocan antes de que la luz encare la órbita; permanecen fijos durante la incorporación y el trazado. La entrada final de la luz sigue una recta tangente antes de alcanzar el amarillo.

Su aparición empieza después de que Neptuno haya salido completamente del encuadre. El centrado termina cuando la luz alcanza la curva inferior derecha de aproximación, siguiendo la referencia visual del usuario; no deben estar centrados mientras Neptuno sigue en pantalla.

Mientras el viaje controla la entrada, rueda, teclado y gesto táctil actualizan un único destino nativo limitado. Se evita el doble suavizado del scroll del navegador y el anclaje automático del contenido. El snap de los apartados se activa después de terminar el cierre o al saltar expresamente mediante un enlace.

Después del viaje, Sobre Physics Stars, equipo y piloto encajan bajo la cabecera con scroll snap. En pantallas pequeñas el contenido puede crecer para conservar la lectura. Hay modo sin animaciones y soporte de movimiento reducido.

## Recursos y alcance

El logo propio `public/logo.svg` no se modifica. El mapa local de Tierra de [Solar System Scope](https://www.solarsystemscope.com/textures/) se utiliza para extraer geografía; no como textura fotográfica. Licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), acreditada en el pie y en `public/space/ATTRIBUTION.md`. La Luna, los cráteres, las nubes y los otros planetas se construyen con geometría local. No se redistribuyen modelos del asset de Unity ni se muestran niveles concretos.

Solo landing y presentación del login. CSS Modules, componentes exclusivos y preferencia pública EN / ESP / CA. Se conservan las pantallas autenticadas, estilos globales, layout raíz, backend, permisos y redirecciones de sesión.
