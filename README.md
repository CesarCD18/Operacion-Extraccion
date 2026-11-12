# Operación Extracción: Sobrevive al apocalipsis

## 1. Descripción del proyecto

**Operación Extracción** es un videojuego de supervivencia en primera persona (FPS), desarrollado con JavaScript y Three.js.

El jugador se encuentra en una ciudad abandonada e infestada de zombis. Su objetivo es recorrer el escenario, enfrentarse a los enemigos, administrar su munición y llegar con vida a la zona de extracción.

El videojuego fue desarrollado como parte del curso de Computación Gráfica y Visual.

## 2. Objetivo del videojuego

Sobrevivir a los ataques de los zombis y alcanzar la zona de extracción utilizando las armas y los recursos disponibles.

## 3. Características principales

- Exploración de un escenario urbano en 3D.
- Cámara en primera persona con movimiento mediante teclado y mouse.
- Dos armas disponibles: pistola y rifle.
- Sistema de disparos y recarga de munición.
- Zombis que detectan y persiguen al jugador.
- Seis zombis distribuidos en tres etapas de dificultad progresiva.
- Eliminación de enemigos después de dos impactos.
- Caja de munición coleccionable que proporciona balas para ambas armas.
- Zona de extracción para completar la misión.
- Pantallas de victoria y derrota.

## 4. Controles

| Tecla | Acción |
|---|---|
| W | Avanzar |
| A | Moverse a la izquierda |
| S | Retroceder |
| D | Moverse a la derecha |
| Mouse | Mover la cámara |
| Clic izquierdo | Disparar |
| 1 | Seleccionar pistola |
| 2 | Seleccionar rifle |
| R | Recargar el arma |
| E | Recoger munición |
| P | Mostrar coordenadas en consola |
| Esc | Liberar el cursor |

## 5. Tecnologías utilizadas

- **HTML5:** estructura de la aplicación.
- **CSS3:** estilos de la interfaz.
- **JavaScript:** lógica y funcionamiento del videojuego.
- **Three.js:** renderizado y desarrollo del entorno 3D.
- **GLTFLoader:** carga de modelos tridimensionales en formato GLB.
- **Visual Studio Code:** entorno de desarrollo.
- **Live Server:** ejecución del proyecto mediante un servidor local.
- **Git y GitHub:** control de versiones y publicación del código.

## 6. Estructura del proyecto

```text
Operacion_extracion/
├── index.html
├── README.md
├── models/
│   ├── ammo_box.glb
│   ├── pistola.glb
│   ├── rifle.glb
│   ├── zombie.glb
│   └── zombieland.glb
└── src/
    ├── main.js
    └── style.css
```

## 7. Instrucciones de ejecución

1. Descargar o clonar el repositorio:

   ```bash
   git clone https://github.com/CesarCD18/Operacion-Extraccion.git
   ```

2. Abrir la carpeta del proyecto en Visual Studio Code.
3. Instalar la extensión **Live Server**, si todavía no está instalada.
4. Abrir `index.html`.
5. Hacer clic derecho y seleccionar **Open with Live Server**.
6. Esperar a que carguen los modelos 3D.
7. Hacer clic dentro del juego para activar el control del mouse.

**Nota:** se necesita conexión a Internet para cargar Three.js desde el CDN configurado en `index.html`. No es necesario instalar Node.js ni ejecutar `npm install`.

## 8. Mecánica del juego

El jugador comienza en un punto determinado de la ciudad y debe avanzar hacia la zona de extracción.

Durante el recorrido aparecen zombis distribuidos en tres etapas. Los enemigos detectan al jugador cuando se encuentra dentro de su radio de detección y comienzan a perseguirlo.

El jugador puede utilizar una pistola o un rifle. Cada arma tiene su propia capacidad de munición y necesita dos impactos para eliminar a un zombi.

También existe una caja de munición que puede recogerse presionando la tecla `E`. Esta proporciona munición de reserva para ambas armas.

La partida termina de dos maneras:

- **Victoria:** cuando el jugador alcanza la zona de extracción.
- **Derrota:** cuando un zombi alcanza al jugador.

## 9. Repositorio

Código fuente disponible en:

https://github.com/CesarCD18/Operacion-Extraccion

## 10. Estado del proyecto

Versión funcional con exploración FPS, sistema de armas, enemigos, munición coleccionable y zona de extracción.

El proyecto todavía puede recibir mejoras relacionadas con las colisiones del escenario y la jugabilidad.