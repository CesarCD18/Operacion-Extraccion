
# OPERACIÓN EXTRACCIÓN

## Descripción del proyecto

Operación Extracción es un videojuego de supervivencia en primera persona (FPS), desarrollado con JavaScript y la biblioteca Three.js como parte del curso de Computación Gráfica y Visual.

El jugador se encuentra en una ciudad abandonada e infestada de zombis. Su objetivo es sobrevivir, administrar la munición disponible y recorrer el escenario hasta llegar a una zona segura de extracción.

Durante el recorrido deberá enfrentarse a enemigos, recoger recursos y atravesar dos puntos de paso obligatorios antes de alcanzar el destino final.

## Tecnologías utilizadas

- HTML5: estructura de la interfaz del videojuego.
- CSS3: diseño del menú, indicadores y pantallas de resultados.
- JavaScript: programación de las mecánicas y lógica del juego.
- Three.js 0.180.0: renderizado y gestión de la escena tridimensional.
- GLTFLoader: carga de modelos tridimensionales en formato GLB.
- SkeletonUtils: clonación de modelos de zombis.
- WebGL: representación gráfica del escenario 3D.
- Git y GitHub: control de versiones del proyecto.

## Características principales

### Cámara en primera persona

El videojuego utiliza una cámara FPS que permite explorar el escenario desde la perspectiva del jugador.

El mouse controla la orientación de la cámara, mientras que las teclas WASD permiten desplazarse por el entorno.

### Sistema de armas

El jugador dispone de dos armas:

- Pistola.
- Rifle.

Cada arma tiene su propio cargador y reserva de munición.

El jugador puede cambiar de arma durante la partida, disparar y recargar cuando disponga de munición de reserva.

### Sistema de munición

El videojuego incluye una caja de abastecimiento que permite recuperar munición para ambas armas.

El jugador debe acercarse a la caja y presionar la tecla E para recogerla.

### Enemigos

Los zombis están representados mediante modelos tridimensionales en formato GLB.

Sus principales características son:

- Detección del jugador cuando se encuentra dentro del rango establecido.
- Persecución mediante desplazamiento hacia la posición del jugador.
- Movimiento condicionado por las colisiones del escenario.
- Resistencia de dos impactos antes de ser eliminados.
- Derrota del jugador cuando un enemigo consigue alcanzarlo.

### Sistema de colisiones

Se implementó un módulo denominado `CollisionWorld.js` para gestionar las colisiones con la geometría del escenario.

El sistema utiliza triángulos obtenidos del modelo 3D de la ciudad y una división espacial en celdas para consultar las superficies cercanas.

Esto permite restringir el desplazamiento del jugador ante paredes y determinados obstáculos.

### Detección de disparos

Se utiliza `THREE.Raycaster` para detectar los impactos realizados desde la cámara del jugador.

El sistema comprueba si el disparo alcanza a un zombi y considera las superficies del escenario que pueden bloquear la trayectoria.

Cada zombi necesita dos impactos para ser eliminado.

### Progresión de la misión

El recorrido se divide en tres tramos:

1. Desplazamiento hacia el primer punto de paso.
2. Avance hacia el segundo punto de paso.
3. Llegada a la zona de extracción.

Los puntos de paso están señalizados mediante indicadores visuales.

La zona final de extracción se identifica mediante un marcador verde.

### Victoria y derrota

**Victoria:** el jugador completa los puntos de paso y llega a la zona de extracción.

**Derrota:** un zombi alcanza al jugador.

En ambos casos se muestra una pantalla de resultado. El jugador puede reiniciar la partida.

## Controles

| Tecla | Acción |
|-------|--------|
| W | Avanzar |
| A | Moverse a la izquierda |
| S | Retroceder |
| D | Moverse a la derecha |
| Mouse | Controlar la cámara y apuntar |
| Clic izquierdo | Disparar |
| 1 | Seleccionar pistola |
| 2 | Seleccionar rifle |
| R | Recargar el arma |
| E | Recoger munición |
| Esc | Liberar el mouse y pausar |
| P | Mostrar coordenadas del jugador en la consola |

## Estructura del proyecto

```text
Operacion_extracion/
│
├── index.html
├── README.md
│
├── models/
│   ├── zombieland.glb
│   ├── zombie.glb
│   ├── pistola.glb
│   ├── rifle.glb
│   └── ammo_box.glb
│
└── src/
    ├── main.js
    ├── style.css
    └── CollisionWorld.js
```

## Instalación y ejecución

### Requisitos

- Navegador moderno compatible con WebGL.
- Visual Studio Code.
- Extensión Live Server o un servidor HTTP local.
- Conexión a Internet para cargar Three.js desde el CDN.

### Pasos

1. Clonar el repositorio:

```bash
git clone https://github.com/CesarCD18/Operacion-Extraccion.git
```

2. Abrir la carpeta del proyecto en Visual Studio Code.

3. Abrir `index.html` mediante Live Server.

4. Esperar a que se carguen los modelos tridimensionales.

5. Presionar el botón **Entrar / Continuar** para comenzar la partida.

No se recomienda abrir el archivo HTML directamente mediante `file://`, ya que la carga de módulos y modelos puede presentar restricciones del navegador.

## Organización del código

### main.js

Contiene la lógica principal del videojuego:

- Inicialización de la escena y la cámara.
- Configuración de iluminación.
- Carga de modelos GLB.
- Movimiento del jugador.
- Sistema de armas y disparos.
- Gestión de munición.
- Comportamiento de los zombis.
- Control de los puntos de paso.
- Verificación de victoria y derrota.
- Bucle principal de animación.

### CollisionWorld.js

Gestiona las consultas de colisión con el escenario tridimensional.

Entre sus responsabilidades se encuentran:

- Procesamiento de triángulos del modelo de la ciudad.
- Organización espacial mediante celdas.
- Consulta de superficies del terreno.
- Detección de obstáculos.
- Restricción del movimiento.
- Comprobación de obstáculos entre dos posiciones.

### style.css

Define los estilos de la interfaz:

- Menú principal.
- Contador de munición.
- Indicadores de misión.
- Mensajes de interacción.
- Efectos visuales de impacto.
- Pantallas de victoria y derrota.

## Aspectos técnicos destacados

El proyecto integra diferentes conceptos de computación gráfica:

- Representación de escenas tridimensionales.
- Transformaciones de posición, rotación y escala.
- Cámara en perspectiva.
- Iluminación ambiental y direccional.
- Importación de modelos GLB.
- Detección de impactos mediante raycasting.
- Consultas de colisión basadas en geometría.
- Interacción en tiempo real.
- Actualización de objetos mediante un bucle de animación.

## Repositorio

GitHub:

https://github.com/CesarCD18/Operacion-Extraccion

## Estado del proyecto

Proyecto desarrollado como entrega académica de Computación Gráfica y Visual.

Incluye un escenario tridimensional, cámara FPS, dos armas, sistema de munición, enemigos, colisiones, puntos de paso y condiciones de victoria y derrota.
