
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ESCENA Y CAMARA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555555);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(-0.71, -1.2, 11.03);
camera.rotation.order = 'YXZ';
scene.add(camera);

// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ILUMINACION
scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2));

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(10, 20, 10);
scene.add(sun);

// CARGADOR DE MODELOS
const loader = new GLTFLoader();

// VARIABLES DEL JUEGO

const keys = {};
const speed = 0.06;

let juegoTerminado = false;
let recargando = false;
let recogiendoMunicion = false;

// ARMAS
let pistola = null;
let rifle = null;
let armaActual = 1;

// ZOMBIS
const zombies = [];
const distanciaDeteccion = 8;
const velocidadZombie = 0.010;
let etapaActual = 1;

// CAJAS DE MUNICION
const ammoBoxes = [];
let cajaCercana = null;

// MUNICION DE CADA ARMA
const municion = {
    1: {
        balas: 12,
        capacidad: 12,
        reserva: 0
    },
    2: {
        balas: 30,
        capacidad: 30,
        reserva: 0
    }
};

// ELEMENTOS DEL HTML
const contador = document.getElementById('contador');
const mensajeMunicion = document.getElementById('mensajeMunicion');
const mensajeFinal = document.getElementById('mensajeFinal');

// CONTROLES DEL JUGADOR
// =====================================

document.addEventListener('keydown', (event) => {

    const tecla = event.key.toLowerCase();
    keys[tecla] = true;

    if (juegoTerminado) return;

    if (tecla === '1') changeWeapon(1);
    if (tecla === '2') changeWeapon(2);
    if (tecla === 'r') reload();
    if (tecla === 'e') pickupAmmo();

    // MOSTRAR COORDENADAS
    if (tecla === 'p') {
        console.log(
            'Posicion del jugador:',
            camera.position.x,
            camera.position.y,
            camera.position.z
        );
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

// CONTROL DEL MOUSE Y DISPARO
document.addEventListener('mousedown', (event) => {

    if (juegoTerminado) return;
    if (event.button !== 0) return;

    if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
        return;
    }

    shoot();
});

// MOVER CAMARA CON EL MOUSE
document.addEventListener('mousemove', (event) => {

    if (juegoTerminado) return;
    if (document.pointerLockElement !== document.body) return;

    camera.rotation.y -= event.movementX * 0.002;
    camera.rotation.x -= event.movementY * 0.002;

    camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x,
        -Math.PI / 2,
        Math.PI / 2
    );
});

// MUNICION Y ARMAS
// =====================================

// ACTUALIZAR CONTADOR
function updateAmmo() {

    const arma = municion[armaActual];
    const nombre = armaActual === 1 ? 'PISTOLA' : 'RIFLE';

    contador.textContent =
        `${nombre} | ${arma.balas} / ${arma.reserva}`;
}

// CAMBIAR ARMA
function changeWeapon(numero) {

    if (juegoTerminado || recargando) return;

    armaActual = numero;

    if (pistola) pistola.visible = numero === 1;
    if (rifle) rifle.visible = numero === 2;

    updateAmmo();
}

// DISPARAR
function shoot() {

    if (juegoTerminado || recargando) return;

    const arma = municion[armaActual];

    if (arma.balas <= 0) {
        console.log('Sin balas. Presiona R para recargar.');
        return;
    }

    arma.balas--;
    updateAmmo();

    console.log('Disparo realizado');

    // EFECTO VISUAL
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.remove();
    }, 80);

    // DETECTAR DIRECCION DEL DISPARO
    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );

    // SOLO ZOMBIS VIVOS Y ACTIVOS
    const objetivos = [];

    zombies.forEach((zombie) => {

        if (!zombie.userData.vivo ||
            !zombie.userData.activo) {
            return;
        }

        zombie.traverse((objeto) => {
            if (objeto.isMesh) {
                objetivos.push(objeto);
            }
        });
    });

    const impactos = raycaster.intersectObjects(
        objetivos,
        false
    );

    if (impactos.length === 0) return;

    const zombie = impactos[0].object.userData.enemigo;

    if (!zombie ||
        !zombie.userData.vivo ||
        !zombie.userData.activo) {
        return;
    }

    // CADA ZOMBI RESISTE DOS IMPACTOS
    zombie.userData.vida--;

    console.log(
        'Impacto. Vida del zombi:',
        zombie.userData.vida
    );

    if (zombie.userData.vida <= 0) {

        zombie.userData.vivo = false;
        zombie.userData.activo = false;

        scene.remove(zombie);

        console.log('Zombi eliminado');
    }
}

// RECARGAR ARMA
function reload() {

    if (juegoTerminado || recargando) return;

    const arma = municion[armaActual];

    if (arma.balas === arma.capacidad) return;

    if (arma.reserva <= 0) {
        console.log('No tienes municion de reserva');
        return;
    }

    recargando = true;

    const armaRecargando = armaActual;

    contador.textContent = 'RECARGANDO...';

    setTimeout(() => {

        if (juegoTerminado) return;

        const datos = municion[armaRecargando];

        const faltantes = datos.capacidad - datos.balas;
        const cantidad = Math.min(faltantes, datos.reserva);

        datos.balas += cantidad;
        datos.reserva -= cantidad;

        recargando = false;
        updateAmmo();

        console.log('Arma recargada');

    }, 1500);
}

// CARGAR ARMAS
function loadWeapon(archivo, tipo) {

    loader.load(archivo, (gltf) => {

        const modelo = gltf.scene;

        const box = new THREE.Box3().setFromObject(modelo);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const escala = 0.65 / Math.max(
            size.x,
            size.y,
            size.z
        );

        modelo.scale.setScalar(escala);
        modelo.position.copy(center).multiplyScalar(-escala);

        const arma = new THREE.Group();
        arma.add(modelo);

        if (tipo === 1) {

            // PISTOLA
            arma.position.set(0.22, -0.38, -0.45);
            arma.scale.setScalar(1.15);
            arma.rotation.set(0, Math.PI, 0);

        } else {

            // RIFLE
            arma.position.set(0.28, -0.32, -0.65);
            arma.scale.setScalar(1.15);
            arma.rotation.set(0, Math.PI, 0);
        }

        camera.add(arma);

        if (tipo === 1) {
            pistola = arma;
            pistola.visible = armaActual === 1;
        } else {
            rifle = arma;
            rifle.visible = armaActual === 2;
        }

        console.log('Arma cargada:', archivo);

    }, undefined, (error) => {
        console.error('Error al cargar arma:', error);
    });
}

// ESCENARIO
// =====================================

// CARGAR CIUDAD
function loadCity() {

    loader.load('./models/zombieland.glb', (gltf) => {

        const ciudad = gltf.scene;
        scene.add(ciudad);

        const box = new THREE.Box3().setFromObject(ciudad);
        const center = box.getCenter(new THREE.Vector3());

        // CENTRAR MAPA
        ciudad.position.sub(center);

        // POSICION INICIAL
        camera.position.set(-0.71, -1.2, 11.03);
        camera.rotation.set(0, 0, 0);

        console.log('Ciudad cargada correctamente');

    }, undefined, (error) => {
        console.error('Error al cargar ciudad:', error);
    });
}

// ZOMBIES
// =====================================

// CARGAR ZOMBIES
function loadZombies() {

    loader.load('./models/zombie.glb', (gltf) => {

        // X, Z, ETAPA
        const posiciones = [
            [-0.7, 7.5, 1],

            [-0.7, -2.5, 2],
            [1.0, -1.5, 2],

            [6.5, 8.0, 3],
            [5.5, 9.0, 3],
            [4.0, 5.0, 3]
        ];

        posiciones.forEach((pos) => {

            const zombie = gltf.scene.clone(true);

            const box = new THREE.Box3().setFromObject(zombie);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const escala = 1.7 / size.y;

            zombie.scale.setScalar(escala);

            zombie.position.set(
                -center.x * escala,
                -box.min.y * escala,
                -center.z * escala
            );

            const enemigo = new THREE.Group();
            enemigo.add(zombie);

            enemigo.position.set(pos[0], -2.7, pos[1]);

            enemigo.userData.vida = 2;
            enemigo.userData.vivo = true;
            enemigo.userData.activo = false;
            enemigo.userData.etapa = pos[2];

            enemigo.visible = false;

            enemigo.traverse((objeto) => {
                if (objeto.isMesh) {
                    objeto.userData.enemigo = enemigo;
                }
            });

            scene.add(enemigo);
            zombies.push(enemigo);
        });

        console.log('Zombis preparados:', zombies.length);

    }, undefined, (error) => {
        console.error('Error al cargar zombis:', error);
    });
}

// ACTIVAR ETAPAS DE ZOMBIS
function activarEtapasZombies() {

    if (juegoTerminado) return;

    const distanciaPunto2 = Math.hypot(
        camera.position.x - (-0.74),
        camera.position.z - (-0.42)
    );

    const distanciaPunto3 = Math.hypot(
        camera.position.x - 5.48,
        camera.position.z - (-1.67)
    );

    if (etapaActual === 1 && distanciaPunto2 < 2) {
        etapaActual = 2;
        console.log('Etapa 2: aparecen dos zombis');
    }

    if (etapaActual === 2 && distanciaPunto3 < 2) {
        etapaActual = 3;
        console.log('Etapa 3: aparecen tres zombis');
    }

    zombies.forEach((zombie) => {

        // NO REACTIVAR ZOMBIS ELIMINADOS
        if (!zombie.userData.vivo) return;

        if (
            zombie.userData.etapa <= etapaActual &&
            !zombie.userData.activo
        ) {
            zombie.userData.activo = true;
            zombie.visible = true;
        }
    });
}

// MOVER ZOMBIS
function moveZombies() {

    if (juegoTerminado) return;

    zombies.forEach((zombie) => {

        if (!zombie.userData.vivo ||
            !zombie.userData.activo) {
            return;
        }

        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;

        const distancia = Math.hypot(dx, dz);

        if (
            distancia < distanciaDeteccion &&
            distancia > 0.6
        ) {

            zombie.position.x +=
                (dx / distancia) * velocidadZombie;

            zombie.position.z +=
                (dz / distancia) * velocidadZombie;

            zombie.lookAt(
                camera.position.x,
                zombie.position.y,
                camera.position.z
            );
        }

        if (distancia <= 0.6) {
            terminarJuego();
        }
    });
}

// CAJA DE MUNICION
// =====================================

// CARGAR CAJAS DE MUNICION
function loadAmmoBoxes() {

    loader.load('./models/ammo_box.glb', (gltf) => {

        // UNA CAJA ENTRE PUNTO 2 Y 3
        const posiciones = [
            [2.37, -1.05]
        ];

        posiciones.forEach((pos) => {

            const caja = gltf.scene.clone(true);

            const box = new THREE.Box3().setFromObject(caja);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // TAMAÑO PEQUEÑO
            const escala = 0.3 / Math.max(
                size.x,
                size.y,
                size.z
            );

            caja.scale.setScalar(escala);

            caja.position.set(
                -center.x * escala,
                -box.min.y * escala,
                -center.z * escala
            );

            const grupo = new THREE.Group();
            grupo.add(caja);

            // ALTURA QUE AJUSTAMOS
            grupo.position.set(pos[0], -1.8, pos[1]);

            scene.add(grupo);
            ammoBoxes.push(grupo);
        });

        console.log(
            'Cajas de municion cargadas:',
            ammoBoxes.length
        );

    }, undefined, (error) => {
        console.error('Error al cargar municion:', error);
    });
}

// DETECTAR CAJA CERCANA
function checkAmmoPickup() {

    cajaCercana = null;

    if (juegoTerminado || recogiendoMunicion) {
        mensajeMunicion.style.display = 'none';
        return;
    }

    for (const caja of ammoBoxes) {

        const distancia = Math.hypot(
            camera.position.x - caja.position.x,
            camera.position.z - caja.position.z
        );

        if (distancia < 1.5) {
            cajaCercana = caja;
            break;
        }
    }

    mensajeMunicion.style.display =
        cajaCercana ? 'block' : 'none';
}

// RECOGER MUNICION
function pickupAmmo() {

    if (!cajaCercana ||
        juegoTerminado ||
        recogiendoMunicion) {
        return;
    }

    recogiendoMunicion = true;

    const caja = cajaCercana;
    cajaCercana = null;

    mensajeMunicion.style.display = 'none';

    // SIMULAR QUE EL JUGADOR SE AGACHA
    const alturaOriginal = camera.position.y;
    camera.position.y -= 0.35;

    setTimeout(() => {

        camera.position.y = alturaOriginal;

        if (juegoTerminado) return;

        // MUNICION PARA AMBAS ARMAS
        municion[1].reserva += 12;
        municion[2].reserva += 30;

        updateAmmo();

        scene.remove(caja);

        const indice = ammoBoxes.indexOf(caja);

        if (indice !== -1) {
            ammoBoxes.splice(indice, 1);
        }

        recogiendoMunicion = false;

        console.log('Municion recogida para ambas armas');

    }, 350);
}

// ZONA DE EXTRACCION
// =====================================

const geometriaExtraccion = new THREE.CylinderGeometry(
    1,
    1,
    0.08,
    32
);

const materialExtraccion = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.65
});

const extraccion = new THREE.Mesh(
    geometriaExtraccion,
    materialExtraccion
);

extraccion.position.set(6.77, -2.6, 9.08);
scene.add(extraccion);

// VERIFICAR EXTRACCION
function verificarExtraccion() {

    if (juegoTerminado) return;

    const distancia = Math.hypot(
        camera.position.x - extraccion.position.x,
        camera.position.z - extraccion.position.z
    );

    if (distancia < 1.2) {
        ganarJuego();
    }
}

// MOVIMIENTO DEL JUGADOR
// =====================================

// MOVER JUGADOR
function movePlayer() {

    if (juegoTerminado || recogiendoMunicion) return;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, camera.up).normalize();

    if (keys['w']) {
        camera.position.addScaledVector(direction, speed);
    }

    if (keys['s']) {
        camera.position.addScaledVector(direction, -speed);
    }

    if (keys['a']) {
        camera.position.addScaledVector(right, -speed);
    }

    if (keys['d']) {
        camera.position.addScaledVector(right, speed);
    }
}

// VICTORIA Y DERROTA
// =====================================

// MOSTRAR MENSAJE FINAL
function mostrarMensaje(texto, tipo) {

    mensajeFinal.textContent = texto;
    mensajeFinal.className = tipo;
}

// VICTORIA
function ganarJuego() {

    if (juegoTerminado) return;

    juegoTerminado = true;

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    mensajeMunicion.style.display = 'none';

    mostrarMensaje(
        '¡MISIÓN COMPLETADA!',
        'victoria'
    );

    console.log('Victoria: llegaste a la extraccion');
}

// DERROTA
function terminarJuego() {

    if (juegoTerminado) return;

    juegoTerminado = true;

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    mensajeMunicion.style.display = 'none';

    mostrarMensaje(
        'GAME OVER',
        'derrota'
    );

    console.log('Derrota: un zombi te alcanzo');
}

// ANIMACION PRINCIPAL
// =====================================

// ANIMACION
function animate() {

    requestAnimationFrame(animate);

    if (!juegoTerminado) {

        movePlayer();
        checkAmmoPickup();
        verificarExtraccion();

        if (!juegoTerminado) {
            activarEtapasZombies();
            moveZombies();
        }
    }

    renderer.render(scene, camera);
}

// AJUSTAR TAMAÑO DE PANTALLA
window.addEventListener('resize', () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

// INICIAR JUEGO
// =====================================

updateAmmo();

loadWeapon('./models/pistola.glb', 1);
loadWeapon('./models/rifle.glb', 2);

loadCity();
loadZombies();
loadAmmoBoxes();

animate();
