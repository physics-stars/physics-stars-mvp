# Variante de scroll continuo — 9 de noviembre de 2026

Esta variante sustituye las pausas y bloqueos descritos en los documentos
anteriores. Se ha preparado después del commit de referencia del usuario y
solo modifica el movimiento de la landing.

## Respuesta al gesto

Actualización del recorrido: los vuelos entre planetas y la formación del logo
usan el 35 % de su distancia anterior. La aparición, lectura y salida de cada
texto planetario conservan toda su distancia y velocidad originales, igual que
la introducción. Solo durante los vuelos se duplica el límite de velocidad y el
margen de respuesta pasa de 90 a 180 ms. La lectura final ocupa 1,2 veces la
distancia media de lectura de los planetas y dura 1,2 veces su duración media
con entrada continua fuerte. Su escala se calcula desde esos intervalos.
Estos valores sustituyen el doble de espacio y el límite de 0,04 indicados abajo.

En PC, la acción de contacto queda más arriba y la llegada a su barra reserva
espacio para mostrar la curva y el halo completos, además del barrido. En móvil,
hay unos 85 px de fondo claro bajo la acción (dos tercios del margen anterior), más el área segura del dispositivo;
la llegada también reserva espacio para la curva y el barrido. El indicador del cierre es un enlace a la primera sección
inferior, con traducción EN / ES / CA y activación por teclado.

Ese enlace baja hasta el inicio de la primera sección con una transición de
850 ms, interrumpible al usar rueda, teclado o gesto táctil. Los planetas se
colocan durante toda la aproximación de la luz, hasta la lectura, y tienen menos
separación vacía entre ellos. El ritmo y las curvas visibles de la luz se conservan.

La gravedad mueve el progreso directamente sobre su curva temporal, sin pasar
por el seguidor ni por los límites de velocidad de vuelo. Una vez capturada,
conserva su destino aunque fluctúe una medición de visibilidad; un gesto nuevo
la cancela. Así no frena ni vuelve a acelerar al cruzar la aparición del texto.

Los enlaces y botones públicos no muestran el recuadro de toque del navegador;
se conserva el foco de teclado. La llegada izquierda abre su curva gradualmente
y atenúa la última ondulación antes de la barra. El recorrido derecho comparte
velocidad entre salida, vuelo y entrada, con arranque suave junto al equipo.
La curva izquierda se abre ligeramente hacia fuera antes de su llegada horizontal,
siguiendo la referencia dibujada. Pulsar la marca de la cabecera desde la landing
reinicia el viaje y devuelve el scroll al comienzo; desde el login conserva su enlace.

La sensibilidad base es el 40 %. Un gesto tiene menos efecto, en lugar de
guardar su desplazamiento para reproducirlo durante varios segundos. El destino
solo puede adelantarse el equivalente a 90 ms a la velocidad permitida. La
respuesta tiene un suavizado breve; no se descartan colas de inercia por alcanzar
un texto, una luz o el logo. Al invertir, el gesto responde desde la posición
visible. El impulso táctil al soltar está limitado a 100 unidades antes de aplicar
la sensibilidad y el margen de respuesta.

Parámetros: `continuous-scroll.ts`. Se conserva el límite de los vuelos y el
ritmo corto original de las lecturas. Las secciones inferiores tienen un máximo
de 1,2 px/ms. Inicio/Fin del teclado siguen siendo navegación explícita.

## Gravedad y lectura

En los planetas, la gravedad se activa cuando la geometría completa está dentro
del área visible, aunque la cámara siga viajando. Se comprueba el recorte real
de la escena, incluidos los anillos, y no solo el centro del planeta. Apunta al
centro del tramo de texto plenamente visible. Espera 550 ms sin entrada y sigue
una curva en S de 2400 ms, con comienzo y final suaves; un nuevo gesto la cancela.
El destino gravitatorio tampoco crea una cola larga por delante de la escena.

El texto llega desde 8 px por debajo de su posición original y sigue subiendo
hasta ella. Curvas suaves superpuestas reparten la subida entre entrada,
lectura y salida, con continuidad de velocidad y aceleración. Posición y
opacidad usan el mismo progreso suavizado del scroll, sin un segundo resorte
que retrase la subida hasta después del fundido. Los planetas conservan el fundido original
ligado directamente al scroll, sin amortiguación temporal que deje el texto
visible después de empezar el siguiente vuelo. El anclaje de la luz se mide
sobre la posición original y no sigue ese desplazamiento. La gravedad apunta a
la mitad del movimiento. Los planetas conservan su intervalo corto de lectura.

El texto final empieza su fundido al completarse el logo, sin espera adicional,
y sube solo 4 px hasta su posición original. Permanece visible al terminar
su tramo y sale de pantalla junto con la sección, sin fundido de salida.
El tramo posterior a la formación conserva el
doble de espacio, con un máximo de 0,04 unidades de progreso por segundo para
ofrecer aproximadamente 1,1 s de lectura incluso con entrada continua fuerte.
El último punto de navegación cae a mitad de ese tramo. El logo final no tiene
gravedad de planeta. No se incluye el gesto automático de «scroll down».

En los apartados, la gravedad se calcula con posiciones físicas de lectura,
independientemente del progreso de la luz. Solo actúa entre los rangos de
lectura de dos apartados, tras 350 ms sin entrada. Dentro de una sección alta,
el scroll permanece donde se deja: no atrae al centro ni a sus extremos. En la
transición atrae al extremo de lectura más cercano. No hay esperas por entrada,
salida, brillo ni carga.
La atracción aumenta suavemente durante los primeros 320 ms tras la espera.
Los seguidores conservan el acercamiento gradual incluso en correcciones muy
pequeñas, sin saltar al destino al quedar menos de un píxel.

## Luces y cámara

Se mantienen las funciones de las trayectorias guardadas. Su muestreo es
independiente del desplazamiento de cámara: la página puede bajar durante la
salida del matraz y durante la entrada a las barras. La carga y descarga siguen
una coordenada de scroll compartida, sin un fundido temporal que pueda
retrasarse. Durante el barrido solo se ve la línea iluminada: se ocultan tanto
la bolita como el punto decorativo del extremo. La bolita reaparece al salir
hacia la siguiente curva y desaparece al entrar en la barra. Todo ello ocurre
mientras siguen actuando el scroll y la gravedad.

Las luces tienen una zona de permanencia, de hasta 96 px antes y después de la
posición central, acotada por la visibilidad real de cada receptor. La barra
puede estar encendida antes de llegar al centro y seguir encendida al empezar a
bajar. El flash de 300 ms es solo visual. El logo tampoco bloquea la vuelta.
La luz alcanza la barra de contacto cuando esta lleva 8 px dentro de pantalla.
El barrido termina 4 px antes de que asome el fondo morado del pie, midiendo su
posición real para adaptarse al tamaño de pantalla.
En móvil, al volver del equipo hacia el apartado anterior, la luz abandona la
barra hasta 96 px antes. La entrada al bajar conserva su momento original.
El cambio de recorrido se prepara con la barra completamente encendida; invertir
un vuelo ya visible recorre la misma curva sin saltos ni cambios en la cámara.

## Verificación

`npm run test:motion` incluye las pruebas nuevas de sensibilidad, margen corto,
centro de gravedad y cámara independiente de las fases de luz. Las pruebas de
las curvas originales permanecen. La revisión de navegador cubre rueda,
gestos táctiles emulados, teclado, inversión, entrada/salida del logo, los tres
idiomas y movimiento reducido.
