import * as THREE from 'three';

// Colisión con triángulos del GLB. Las celdas XZ evitan recorrer toda la ciudad.
export class CollisionWorld {
    constructor(root) {
        this.cells = new Map();
        this.meshes = [];
        root.updateMatrixWorld(true);
        this.bounds = new THREE.Box3().setFromObject(root);
        root.traverse(mesh => {
            if (!mesh.isMesh) return;
            // Rayos bloqueados por ambas caras de muros del modelo.
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) material.side = THREE.DoubleSide;
            this.meshes.push(mesh);
            const p = mesh.geometry.attributes.position, index = mesh.geometry.index;
            const count = index ? index.count : p.count;
            for (let i=0; i<count; i+=3) {
                const vertices = [0,1,2].map(j => new THREE.Vector3()
                    .fromBufferAttribute(p,index ? index.getX(i+j) : i+j).applyMatrix4(mesh.matrixWorld));
                const triangle = new THREE.Triangle(...vertices);
                const ground = Math.abs(triangle.getNormal(new THREE.Vector3()).y)>0.72;
                const box = new THREE.Box3().setFromPoints(vertices);
                const item = {triangle,box,ground};
                for(let x=Math.floor(box.min.x/2);x<=Math.floor(box.max.x/2);x++) {
                    for(let z=Math.floor(box.min.z/2);z<=Math.floor(box.max.z/2);z++) {
                        const key = `${x},${z}`;
                        if(!this.cells.has(key)) this.cells.set(key,[]);
                        this.cells.get(key).push(item);
                    }
                }
            }
        });
    }
    floorAt(x,z,ceiling=-1.1) {
        const ray = new THREE.Ray(new THREE.Vector3(x,ceiling,z),new THREE.Vector3(0,-1,0));
        const hit = new THREE.Vector3();
        let floor = -Infinity;
        for(const {triangle,ground} of this.cells.get(`${Math.floor(x/2)},${Math.floor(z/2)}`)||[]) {
            if(ground && ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,hit)) floor=Math.max(floor,hit.y);
        }
        return Number.isFinite(floor) ? floor : null;
    }
    snap(position,eyeHeight=1.5) {
        const floor=this.floorAt(position.x,position.z);
        if(floor!==null) position.y=floor+eyeHeight;
    }
    blocked(x,z,radius=0.24,feet=this.floorAt(x,z)) {
        if(feet===null) return true;
        if(x<this.bounds.min.x+radius || x>this.bounds.max.x-radius ||
           z<this.bounds.min.z+radius || z>this.bounds.max.z-radius) return true;
        const candidates = new Set();
        for(let cx=Math.floor((x-radius)/2);cx<=Math.floor((x+radius)/2);cx++) {
            for(let cz=Math.floor((z-radius)/2);cz<=Math.floor((z+radius)/2);cz++) {
                for(const item of this.cells.get(`${cx},${cz}`)||[]) candidates.add(item);
            }
        }
        const point = new THREE.Vector3(), closest = new THREE.Vector3();
        for(const {triangle,box,ground} of candidates) {
            if(ground) continue;
            if(x<box.min.x-radius || x>box.max.x+radius || z<box.min.z-radius || z>box.max.z+radius) continue;
            // Esferas superpuestas desde los pies hasta la cabeza.
            for(let i=0;i<=7;i++) {
                const y=feet+radius+(1.55-2*radius)*i/7;
                point.set(x,y,z); triangle.closestPointToPoint(point,closest);
                if(point.distanceToSquared(closest)<radius*radius) return true;
            }
        }
        return false;
    }

    move(position, dx, dz, radius = 0.24, eyeHeight = 1.5) {

        const steps = Math.max(
            1,
            Math.ceil(Math.hypot(dx, dz) / (radius * 0.5))
        );

        const attempt = (x, z) => {

            // Buscar suelo usando una referencia estable.
            const floor = this.floorAt(x, z, -1.1);

            // Si no existe suelo detectable, no permitir avanzar.
            if (floor === null) return;

            // Mantener la detección de paredes.
            if (this.blocked(x, z, radius, floor)) return;

            // Actualizar solamente la posición horizontal.
            // La altura de la cámara se conserva.
            position.x = x;
            position.z = z;
        };

        for (let i = 0; i < steps; i++) {

            attempt(
                position.x + dx / steps,
                position.z
            );

            attempt(
                position.x,
                position.z + dz / steps
            );
        }
    }

    occluded(from,to) {
        const direction = to.clone().sub(from), distance = direction.length();
        const ray = new THREE.Raycaster(from,direction.normalize(),0.02,distance);
        return ray.intersectObjects(this.meshes,false).some(hit=>hit.distance<distance-0.05);
    }
}
