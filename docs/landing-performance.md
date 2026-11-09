# Optimización sin cambios visuales

Se mantienen geometría, materiales, resolución, partículas, iluminación,
ocultaciones, curvas y tiempos de las animaciones.

- Los materiales WebGL se compilan durante la carga, incluidos los planetas
  inicialmente ocultos, para reducir las compilaciones al aparecer.
- Las comprobaciones de visibilidad reutilizan el resultado cuando la pose es
  idéntica y combinan las matrices antes de proyectar los vértices.
- Las muestras de posición y profundidad reutilizan cálculos del mismo progreso,
  sin aproximar ni cuantizar la trayectoria.
- Las medidas del viaje y del descenso se guardan y actualizan al cambiar el
  tamaño, las fuentes o la geometría observada. Los fotogramas no intercalan
  escrituras de estilos con nuevas lecturas del layout.
- El descenso omite el trabajo de dibujo cuando está fuera de pantalla y no
  controla el scroll. Los valores de iluminación idénticos no se reescriben.
- En producción se conservan los atributos funcionales de visibilidad; los
  atributos de diagnóstico por fotograma quedan limitados al desarrollo.

No se han ejecutado pruebas, perfiles de rendimiento ni comparaciones visuales,
por preferencia del usuario. Estos cambios eliminan trabajo redundante detectado
en el código; su impacto en el dispositivo y despliegue concretos queda pendiente
de la comprobación del usuario. No garantizan por sí solos eliminar todos los tirones.
