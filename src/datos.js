// Tabla de ventajas: cada tipo y los tipos a los que LE GANA.
// Las debilidades no se escriben: salen solas (si X está en mi lista, X es débil contra mí).
export const VENTAJAS = {
    volcan: ['hielo', 'bosque'],
    mar: ['volcan', 'desierto'],
    bosque: ['mar', 'cordillera'],
    hielo: ['mar', 'cordillera'],
    desierto: ['hielo', 'bosque'],
    cordillera: ['volcan', 'desierto'],
    ciudad: [],
};

// Lista de criaturas del juego
export const CRIATURAS = [
    {
        id: 'pinguino',
        nombre: 'Hummble',
        tipo: 'mar',
        color: '#00c0c0',
        vida: 90,
        ataque: 55,
        defensa: 70,
        velocidad: 35,
        ataques: ['marejada', 'tsunami', 'terremoto', 'camanchaca'],
    },
    {
        id: 'puma',
        nombre: 'Andino',
        tipo: 'cordillera',
        color: '#8B4513',
        vida: 70,
        ataque: 75,
        defensa: 45,
        velocidad: 60,
        ataques: ['derrumbe', 'aluvion', 'microLlena', 'sequia'],
    },
    {
        id: 'huemul',
        nombre: 'Huemul',
        tipo: 'bosque',
        color: '#8a6a4a',
        vida: 90,
        ataque: 65,
        defensa: 50,
        velocidad: 45,
        ataques: ['temporal', 'florecimiento', 'terremoto', 'derrumbe'],
    },
    {
        id: 'zorro',
        nombre: 'Chilla',
        tipo: 'desierto',
        color: '#d4a96a',
        vida: 60,
        ataque: 65,
        defensa: 45,
        velocidad: 80,
        ataques: ['camanchaca', 'sequia', 'microLlena', 'florecimiento'],
    },
    {
        id: 'foca',
        nombre: 'Leopardo Antártico',
        tipo: 'hielo',
        color: '#7a8fa3',
        vida: 90,
        ataque: 65,
        defensa: 60,
        velocidad: 35,
        ataques: ['vientoBlanco', 'ventisca', 'terremoto', 'marejada'],
    },
    {
        id: 'cherufe',
        nombre: 'Cherufe',
        tipo: 'volcan',
        color: '#FF4500',
        vida: 85,
        ataque: 70,
        defensa: 60,
        velocidad: 35,
        ataques: ['erupcion', 'lluviaVolcanica', 'terremoto', 'vientoBlanco'],
    },
    {
        id: 'paloma',
        nombre: 'Paloma',
        tipo: 'ciudad',
        color: '#808080',
        vida: 60,
        ataque: 60,
        defensa: 55,
        velocidad: 75,
        ataques: ['terremoto', 'microLlena', 'temporal', 'camanchaca'],
    }
];

// Lista de ataques
export const ATAQUES = {
    marejada: { nombre: 'Marejada', tipo: 'mar', poder: 60, precision: 100 },
    erupcion: { nombre: 'Erupción', tipo: 'volcan', poder: 75, precision: 85 },
    temporal: { nombre: 'Temporal del Sur', tipo: 'bosque', poder: 60, precision: 100 },
    vientoBlanco: { nombre: 'Viento Blanco', tipo: 'hielo', poder: 60, precision: 100 },
    camanchaca: { nombre: 'Camanchaca', tipo: 'desierto', poder: 50, precision: 100 },
    derrumbe: { nombre: 'Deslizamiento de Rocas', tipo: 'cordillera', poder: 85, precision: 70 },
    terremoto: { nombre: 'Terremoto', tipo: 'ciudad', poder: 80, precision: 80 },
    tsunami: { nombre: 'Tsunami', tipo: 'mar', poder: 90, precision: 65 },
    lluviaVolcanica: { nombre: 'Lluvia Volcánica', tipo: 'volcan', poder: 85, precision: 70 },
    florecimiento: { nombre: 'Florecimiento', tipo: 'bosque', poder: 65, precision: 100 },
    ventisca: { nombre: 'Ventisca Antártica', tipo: 'hielo', poder: 70, precision: 90 },
    sequia: { nombre: 'Sequía', tipo: 'desierto', poder: 75, precision: 85 },
    aluvion: { nombre: 'Aluvión', tipo: 'cordillera', poder: 100, precision: 50 },
    microLlena: { nombre: 'Micro Llena', tipo: 'ciudad', poder: 90, precision: 65 },
};

// Cuánto multiplica el daño un ataque según los tipos
export function multiplicador(tipoAtaque, tipoDefensor) {
    if (VENTAJAS[tipoAtaque].includes(tipoDefensor)) return 2;    // súper efectivo
    if (VENTAJAS[tipoDefensor].includes(tipoAtaque)) return 0.5;  // poco efectivo
    return 1;                                                    // neutral
}