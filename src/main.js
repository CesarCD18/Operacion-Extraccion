import * as THREE from 'three';
import { CollisionWorld } from './CollisionWorld.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
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

camera.position.set(-0.71, -1.45, 11.03);
camera.rotation.order = 'YXZ';
scene.add(camera);

// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ILUMINACION
scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2));

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(10, 20, 10);
scene.add(sun);

// CARGADOR DE MODELOS
const manager = new THREE.LoadingManager();
manager.onLoad = () => {
    ready = !!collisionWorld && !!pistola && !!rifle && zombies.length === 6 && ammoBoxes.length > 0;
    if (ready) {
        //collisionWorld.snap(camera.position);
        zombies.forEach(zombie => collisionWorld.snap(zombie.position,0));
        ammoBoxes.forEach(box => collisionWorld.snap(box.position,0.03));
        collisionWorld.snap(extraccion.position,0.05);
        markers.forEach(marker => collisionWorld.snap(marker.position,0.8));
    }
    document.getElementById('inicio').disabled = !ready;
    document.getElementById('carga').textContent = ready ? 'Recursos listos. Sobrevive hasta la extracción.' : 'No se pudo preparar el nivel. Revisa la consola y vuelve a cargar.';
};
manager.onProgress = (_, done, total) => { document.getElementById('carga').textContent = `Cargando recursos ${done}/${total}…`; };
manager.onError = url => { document.getElementById('carga').textContent = `No se pudo cargar: ${url}. Usa Live Server.`; };
const loader = new GLTFLoader(manager);

// VARIABLES DEL JUEGO

const keys = {};
const speed = 3.6; // unidades por segundo
let collisionWorld = null;
let ready = false;
let elapsed = 0;
let eliminated = 0;
let delta = 0;
const clock = new THREE.Clock();
const panel = document.getElementById("panel");
const status = document.getElementById("estado");
function playing() { return ready && !juegoTerminado && document.pointerLockElement === document.body; }
function clearKeys() { for (const key in keys) keys[key] = false; }
document.addEventListener("pointerlockchange", () => {
    clearKeys();
    panel.hidden = juegoTerminado || playing();
});
window.addEventListener("blur", () => { clearKeys(); if(document.pointerLockElement) document.exitPointerLock(); });

let juegoTerminado = false;
let recargando = false;
let recargaRestante = 0;
let armaRecargando = 1;
let recogiendoMunicion = false;

// ARMAS
let pistola = null;
let rifle = null;
let armaActual = 1;

// ZOMBIS
const zombies = [];
const distanciaDeteccion = 8;
const velocidadZombie = 0.85;
let etapaActual = 1;

// CAJAS DE MUNICION
const ammoBoxes = [];
let cajaCercana = null;

// MUNICION DE CADA ARMA
const municion = {
    1: {
        balas: 8,
        capacidad: 12,
        reserva: 0
    },
    2: {
        balas: 10,
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

    if (!playing() || event.repeat) return;

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

    if (juegoTerminado || !ready || event.target.closest('button')) return;
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

    if (!playing() || recargando) return;

    armaActual = numero;

    if (pistola) pistola.visible = numero === 1;
    if (rifle) rifle.visible = numero === 2;

    updateAmmo();
}

// DISPARAR
function shoot() {

    if (!playing() || recargando) return;

    const arma = municion[armaActual];

    if (arma.balas <= 0) {
        status.textContent = arma.reserva ? 'Presiona R para recargar.' : 'Sin munición: busca la caja de abastecimiento.';
        return;
    }

    arma.balas--;
    updateAmmo();

    status.textContent = '';
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);

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

    // ZOMBIS VIVOS: también se puede disparar antes de que detecten al jugador.
    const objetivos = [];

    zombies.forEach((zombie) => {

        if (!zombie.userData.vivo) {
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

    // El primer muro alcanzado detiene la bala antes del enemigo.
    const muros = raycaster.intersectObjects(collisionWorld.meshes, false);
    if (muros.length && muros[0].distance < impactos[0].distance) return;
    const zombie = impactos[0].object.userData.enemigo;

    if (!zombie ||
        !zombie.userData.vivo) {
        return;
    }

    // CADA ZOMBI RESISTE DOS IMPACTOS
    zombie.userData.vida--;
    document.getElementById('puntero').classList.add('impacto');
    setTimeout(() => document.getElementById('puntero').classList.remove('impacto'), 130);
    status.textContent = zombie.userData.vida ? 'Impacto 1/2' : 'Zombi eliminado: 2/2 impactos';

    console.log(
        'Impacto. Vida del zombi:',
        zombie.userData.vida
    );

    if (zombie.userData.vida <= 0) {

        zombie.userData.vivo = false;
        zombie.userData.activo = false;

        scene.remove(zombie);
        eliminated++;

        console.log('Zombi eliminado');
    }
}

// RECARGAR ARMA
function reload() {

    if (!playing() || recargando) return;

    const arma = municion[armaActual];

    if (arma.balas === arma.capacidad) return;

    if (arma.reserva <= 0) {
        console.log('No tienes municion de reserva');
        return;
    }

    recargando = true;

    armaRecargando = armaActual;
    recargaRestante = 1.5;
    contador.textContent = 'RECARGANDO...';
}

function updateReload() {
    if (!recargando) return;
    recargaRestante -= delta;
    if (recargaRestante > 0) return;
    const datos = municion[armaRecargando];
    const cantidad = Math.min(datos.capacidad-datos.balas, datos.reserva);
    datos.balas += cantidad;
    datos.reserva -= cantidad;
    recargando = false;
    updateAmmo();
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

        collisionWorld = new CollisionWorld(ciudad);

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

            [0.0, -0.5, 2],
            [1.0, -1.5, 2],

            [6.5, 8.0, 3],
            [5.5, 9.0, 3],
            [4.0, 5.0, 3]
        ];

        posiciones.forEach((pos) => {

            const zombie = clone(gltf.scene);

            const box = new THREE.Box3().setFromObject(zombie);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const escala = 1.05 / size.y;

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

            enemigo.visible = true;

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
    // Los enemigos existen desde el inicio, pero sólo detectan a través de espacio libre.
    for (const zombie of zombies) {
        if (!zombie.userData.vivo) continue;
        const target = zombie.position.clone(); target.y = camera.position.y;
        if (camera.position.distanceTo(target) < distanciaDeteccion &&
            !collisionWorld.occluded(target, camera.position)) zombie.userData.activo = true;
    }
}

// MOVER ZOMBIS
function moveZombies() {

    if (juegoTerminado) return;

    zombies.forEach((zombie) => {

        if (!zombie.userData.vivo || !zombie.userData.activo) {
            return;
        }

        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;

        const distancia = Math.hypot(dx, dz);

        if (
            distancia > 0.6
        ) {

            const previous = zombie.position.clone();
            collisionWorld.move(zombie.position, dx/distancia*velocidadZombie*delta,
                dz/distancia*velocidadZombie*delta, 0.22, 0);
            // Rodear una esquina en vez de atravesar su pared.
            if (previous.distanceToSquared(zombie.position) < 0.000001) {
                const side = zombie.userData.etapa % 2 ? 1 : -1;
                collisionWorld.move(zombie.position, -dz/distancia*side*velocidadZombie*delta,
                    dx/distancia*side*velocidadZombie*delta, 0.22, 0);
            }

            zombie.lookAt(
                camera.position.x,
                zombie.position.y,
                camera.position.z
            );
        }

        if (distancia <= 0.6 && !collisionWorld.occluded(
            new THREE.Vector3(zombie.position.x, camera.position.y, zombie.position.z), camera.position)) {
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

            const caja = clone(gltf.scene);

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

        const target = caja.position.clone(); target.y = camera.position.y;
        if (distancia < 1.5 && !collisionWorld.occluded(camera.position, target)) {
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

    // Una sola recogida, sin teletransportar la cámara ni duplicar reservas.
    municion[1].reserva += 12;
    municion[2].reserva += 30;
    updateAmmo();
    scene.remove(caja);
    ammoBoxes.splice(ammoBoxes.indexOf(caja), 1);
    recogiendoMunicion = false;
    status.textContent = 'Abastecimiento: +12 pistola / +30 rifle. R para recargar.';
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

// Señales visibles en los dos giros del recorrido y en la salida.
const markers = [[-0.74,-0.42],[5.48,-1.67],[6.77,9.08]].map(([x,z],i) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,1.6,12),
        new THREE.MeshBasicMaterial({color: i === 2 ? 0x65ffc4 : 0xffcc66, transparent:true, opacity:0.75}));
    mesh.position.set(x,-1.8,z); scene.add(mesh); mesh.visible = i === 0;
    return mesh;
});
document.getElementById('inicio').addEventListener('click', () => {
    if(ready && !juegoTerminado) document.body.requestPointerLock();
});

// VERIFICAR EXTRACCION
function verificarExtraccion() {

    if (juegoTerminado) return;

    const distancia = Math.hypot(
        camera.position.x - extraccion.position.x,
        camera.position.z - extraccion.position.z
    );

    if (distancia < 1.2 && etapaActual === 3) {
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

    const movement = new THREE.Vector3();
    movement.addScaledVector(direction, Number(!!keys.w)-Number(!!keys.s));
    movement.addScaledVector(right, Number(!!keys.d)-Number(!!keys.a));
    if (movement.lengthSq()) movement.normalize().multiplyScalar(speed * delta);
    collisionWorld.move(camera.position, movement.x, movement.z,0.18,1.25);
    // Dos puntos de paso obligatorios evitan terminar por un atajo junto al inicio.
    if (etapaActual === 1 && Math.hypot(camera.position.x+0.74,camera.position.z+0.42)<2) etapaActual=2;
    if (etapaActual === 2 && Math.hypot(camera.position.x-5.48,camera.position.z+1.67)<2) etapaActual=3;
}

// VICTORIA Y DERROTA
// =====================================

// MOSTRAR MENSAJE FINAL

function mostrarMensaje(texto, tipo) {

    panel.hidden = true;
    clearKeys();
    mensajeFinal.textContent = texto;
    mensajeFinal.className = tipo;

    const botonReinicio = document.createElement('button');

    botonReinicio.textContent = 'Volver a jugar';
    botonReinicio.id = 'botonReinicio';

    botonReinicio.addEventListener('click', () => {
        window.location.reload();
    });

    mensajeFinal.appendChild(botonReinicio);
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
        '¡MISIÓN COMPLETADA! Has llegado a la zona de extracción.',
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

    delta = Math.min(clock.getDelta(), 0.05);
    if (playing()) {
        elapsed += delta;
        updateReload();
        const objetivo = etapaActual === 1 ? [-0.74,-0.42] : etapaActual === 2 ? [5.48,-1.67] : [6.77,9.08];
        document.getElementById('mision').textContent = `TRAMO ${etapaActual}/3 · ${etapaActual === 3 ? 'EXTRACCIÓN' : 'PUNTO DE PASO'} · ${Math.hypot(camera.position.x-objetivo[0],camera.position.z-objetivo[1]).toFixed(1)} m`;
        document.getElementById('resumen').textContent = `${Math.floor(elapsed)} s · ${eliminated}/6 zombis eliminados`;
        markers.forEach((marker,i) => { marker.visible = i === etapaActual-1; });
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
