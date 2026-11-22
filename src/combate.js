import { ATAQUES, CRIATURAS, multiplicador } from './datos.js';

// Calcula cuánto daño hace un ataque (0 si falla)
export function calcularDanio(atacante, defensor, idAtaque) {
    const ataque = ATAQUES[idAtaque];

    // 1. ¿Acierta?
    const acierta = Math.random() * 100 < ataque.precision;
    if (acierta === false) return { danio: 0, critico: false };

    // 2. Bonus si el ataque es del mismo tipo que la criatura
    let bonusTipo = 1;
    if (ataque.tipo === atacante.tipo) bonusTipo = 1.5;

    // 3. Ventaja de tipos (x2, x1 o x0.5)
    const efectividad = multiplicador(ataque.tipo, defensor.tipo);

    // 4. Daño base: el poder, ajustado por ataque contra defensa
    const base = ataque.poder * (atacante.ataque / defensor.defensa) / 3;
    // 5. ¿Golpe crítico? 1 de cada 16 veces (6,25%), como en los juegos clásicos
    const critico = Math.random() < 1 / 16;
    let bonusCritico = 1;
    if (critico) bonusCritico = 1.5;

    return {
        danio: Math.round(base * bonusTipo * efectividad * bonusCritico),
        critico: critico,
    };
}

// Estado del combate: todo lo que cambia mientras se pelea
export const estado = {
    jugador: { equipo: [], activo: 0 },   // activo = posición de la criatura que está peleando
    rival: { equipo: [], activo: 0 },
    turno: 1,
    terminado: false,
};

// Devuelve la criatura que está peleando de un lado ('jugador' o 'rival')
export function luchadorActivo(lado) {
    return estado[lado].equipo[estado[lado].activo];
}

export function crearLuchador(id) {
    const base = CRIATURAS.find(c => c.id === id);
    return { ...base, vidaActual: base.vida };
}

// ¿Quién ataca primero? El más rápido; si empatan, al azar
function quienEmpieza() {
    const velJugador = luchadorActivo('jugador').velocidad;
    const velRival = luchadorActivo('rival').velocidad;

    if (velJugador > velRival) return 'jugador';
    if (velRival > velJugador) return 'rival';
    if (Math.random() < 0.5) return 'jugador';   // empate: 50% cada uno
    return 'rival';
}

// Un lado ataca al otro y anota lo que pasó en la lista de eventos
function atacar(lado, idAtaque, mensajes) {
    let otroLado = 'jugador';
    if (lado === 'jugador') otroLado = 'rival';

    const atacante = luchadorActivo(lado);
    const defensor = luchadorActivo(otroLado);
    const ataque = ATAQUES[idAtaque];

    const resultado = calcularDanio(atacante, defensor, idAtaque);
    const danio = resultado.danio;
    defensor.vidaActual = Math.max(0, defensor.vidaActual - danio);

    // UN solo evento por ataque
    mensajes.push({
        texto: atacante.nombre + ' usó ' + ataque.nombre + '.',
        atacante: lado,
        golpeado: otroLado,
        acerto: danio > 0,
        vida: defensor.vidaActual,
        vidaMax: defensor.vida,
        tipoAtaque: ataque.tipo,
        idAtaque: idAtaque,
        critico: resultado.critico,
    });

    if (danio === 0) {
        mensajes.push({ texto: '¡Pero falló!' });
        return;
    }

    if (resultado.critico) mensajes.push({ texto: '¡Golpe crítico!' });

    const efectividad = multiplicador(ataque.tipo, defensor.tipo);
    if (efectividad === 2) mensajes.push({ texto: '¡Es súper efectivo!' });
    if (efectividad === 0.5) mensajes.push({ texto: 'No es muy efectivo...' });

    if (defensor.vidaActual === 0) {
        mensajes.push({ texto: '¡' + defensor.nombre + ' se debilitó!', debilitado: otroLado });
    }
}

// Si la criatura activa de un lado se debilitó: entra la siguiente o se acaba el combate
function revisarDebilitado(lado, mensajes) {
    if (luchadorActivo(lado).vidaActual > 0) return;   // sigue en pie: no pasa nada

    let otroLado = 'jugador';
    if (lado === 'jugador') otroLado = 'Lautaro';

    const equipo = estado[lado].equipo;

    // ¿era la última del equipo? Entonces gana el otro lado
    if (estado[lado].activo === equipo.length - 1) {
        estado.terminado = true;
        estado.ganador = otroLado;
        return;
    }

    // si quedan criaturas, entra la siguiente
    estado[lado].activo++;
    mensajes.push({ texto: '¡Entra ' + luchadorActivo(lado).nombre + '!', entra: lado });
}

// Juega un turno completo con el ataque que eligió cada lado
export function jugarTurno(ataqueJugador, ataqueRival) {
    const mensajes = [];
    const ataques = { jugador: ataqueJugador, rival: ataqueRival };

    const primero = quienEmpieza();
    let segundo = 'jugador';
    if (primero === 'jugador') segundo = 'rival';

    atacar(primero, ataques[primero], mensajes);

    // el segundo solo ataca si sigue en pie
    if (luchadorActivo(segundo).vidaActual > 0) {
        atacar(segundo, ataques[segundo], mensajes);
    }

    revisarDebilitado('jugador', mensajes);
    revisarDebilitado('rival', mensajes);
    estado.turno++;
    return mensajes;
}

// IA de Lautaro: elige el ataque con más daño esperado contra la criatura del jugador
export function elegirAtaqueRival() {
    const atacante = luchadorActivo('rival');
    const defensor = luchadorActivo('jugador');

    let mejorAtaque = atacante.ataques[0];
    let mejorValor = 0;

    atacante.ataques.forEach(function (id) {
        const ataque = ATAQUES[id];

        let bonusTipo = 1;
        if (ataque.tipo === atacante.tipo) bonusTipo = 1.5;

        // daño esperado = poder x probabilidad de acertar x bonus x efectividad
        const valor = ataque.poder * (ataque.precision / 100) * bonusTipo * multiplicador(ataque.tipo, defensor.tipo);

        if (valor > mejorValor) {
            mejorValor = valor;
            mejorAtaque = id;
        }
    });

    return mejorAtaque;
}