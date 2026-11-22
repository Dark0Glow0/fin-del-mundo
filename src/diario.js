// Generador de azar con semilla: con la misma semilla, siempre da los mismos números.
// (Es un algoritmo conocido llamado mulberry32; no hace falta entender cada operación)
function crearAzar(semilla) {
    return function () {
        semilla = semilla + 0x6D2B79F5 | 0;
        let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;   // número entre 0 y 1, como Math.random()
    };
}

// La semilla de hoy: la fecha como número (21 de noviembre de 2026 → 20261121)
export function semillaDeHoy() {
    const hoy = new Date();
    return hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
}

// Elige criaturas distintas para hoy, sin repetir (como sacar papelitos de una bolsa)
export function equipoDelDia(criaturas, cantidad) {
    const azar = crearAzar(semillaDeHoy());
    const bolsa = criaturas.slice();    // copia de la lista, para no tocar la original
    const equipo = [];

    for (let i = 0; i < cantidad; i++) {
        const posicion = Math.floor(azar() * bolsa.length);   // posición al azar dentro de la bolsa
        equipo.push(bolsa[posicion]);
        bolsa.splice(posicion, 1);                            // la saca de la bolsa: no se repite
    }
    return equipo;
}