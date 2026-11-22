// ---------- Diccionario de sonidos ----------

const SONIDOS_ATAQUE = {
    marejada: 'mar.mp3',
    erupcion: 'volcan.mp3',
    temporal: 'bosque.mp3',
    vientoBlanco: 'hielo.mp3',
    camanchaca: 'desierto.mp3',
    derrumbe: 'cordillera.mp3',
    terremoto: 'ciudad.mp3',
    tsunami: 'mar.mp3',
    lluviaVolcanica: 'volcan.mp3',
    florecimiento: 'bosque.mp3',
    ventisca: 'hielo.mp3',
    sequia: 'desierto.mp3',
    aluvion: 'cordillera.mp3',
    microLlena: 'microllena.mp3'
};

function reproducir(archivo, volumen) {
    const audio = new Audio(import.meta.env.BASE_URL + 'sonidos/' + archivo);
    audio.volume = volumen;
    audio.play();
}

export function sonidoAtaque(idAtaque) {
    const archivo = SONIDOS_ATAQUE[idAtaque];

    if (archivo){
        reproducir(archivo, 0.6);
    }
}

// ---------- SONIDO 8 BITS (Web Audio API) ----------
let ctx = null;   // el "motor de audio" del navegador; se crea al primer clic

// Los navegadores no dejan sonar nada hasta que el jugador hace clic: se llama desde el botón Jugar
export function iniciarAudio() {
    if (ctx === null) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();   // si el navegador lo pausó, lo reactiva
}

// Un tono que va de una frecuencia a otra (si son iguales, es un tono fijo)
// forma: 'square' (8 bits), 'triangle' (suave), 'sawtooth' (áspero)
function barrido(desde, hasta, duracion, forma, volumen) {
    if (ctx === null) return;
    const ahora = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = forma;
    osc.frequency.setValueAtTime(desde, ahora);
    osc.frequency.exponentialRampToValueAtTime(hasta, ahora + duracion);   // sube o baja la nota

    const vol = ctx.createGain();
    vol.gain.setValueAtTime(volumen, ahora);
    vol.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);        // se apaga suave

    osc.connect(vol);                  // generador → volumen
    vol.connect(ctx.destination);      // volumen → parlantes
    osc.start(ahora);
    osc.stop(ahora + duracion);
}

// Ruido blanco (como estática): golpes, rocas, público
function ruido(duracion, volumen) {
    if (ctx === null) return;
    const ahora = ctx.currentTime;

    // se llena un "buffer" con números al azar entre -1 y 1: eso suena como estática
    const muestras = Math.floor(ctx.sampleRate * duracion);
    const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    const vol = ctx.createGain();
    vol.gain.setValueAtTime(volumen, ahora);
    vol.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);

    fuente.connect(vol);
    vol.connect(ctx.destination);
    fuente.start(ahora);
}

// Ruido filtrado que entra suave y sale suave: suena como un público
function ovacion(duracion, volumen) {
    if (ctx === null) return;
    const ahora = ctx.currentTime;

    const muestras = Math.floor(ctx.sampleRate * duracion);
    const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    // filtro: deja pasar solo los tonos medios, como voces de mucha gente
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 900;
    filtro.Q.value = 0.8;

    const vol = ctx.createGain();
    vol.gain.setValueAtTime(0.001, ahora);
    vol.gain.exponentialRampToValueAtTime(volumen, ahora + duracion * 0.3);   // sube (entra el grito)
    vol.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);           // baja (se calma)

    fuente.connect(filtro);            // ruido → filtro → volumen → parlantes
    filtro.connect(vol);
    vol.connect(ctx.destination);
    fuente.start(ahora);
}

// ---------- LOS SONIDOS DEL JUEGO ----------

// "blip" de cada letra del texto (como los diálogos de Game Boy)
export function sonidoLetra() { barrido(700, 700, 0.03, 'square', 0.02); }

// golpe normal: un "pum" con ruido
export function sonidoGolpe() {
    ruido(0.15, 0.35);
    barrido(180, 60, 0.15, 'square', 0.2);
}

// golpe crítico: más fuerte y largo
export function sonidoCritico() {
    ruido(0.35, 0.5);
    barrido(300, 40, 0.35, 'sawtooth', 0.25);
}

// fallo: dos notas que bajan ("uh-oh")
export function sonidoFallo() {
    barrido(400, 400, 0.12, 'square', 0.12);
    setTimeout(function () { barrido(280, 280, 0.2, 'square', 0.12); }, 130);
}

// criatura debilitada: una nota que cae
export function sonidoDebilitado() { 
    reproducir('retirada.mp3', 0.6);
}

// entra una criatura: tres notas que suben
export function sonidoEntrada() {
    reproducir('entrada.mp3', 0.6);
}

// el público: ruido que suena como una ovación (más fuerte si está loco)
export function sonidoPublico(animo) {
    if (animo === 'ola') {
        bajarAmbiente(2.5);
        reproducir('publico_ola_cortada.mp3', 0.5)
    }
    if (animo === 'loco') {
        bajarAmbiente(2.5);
        reproducir('publico_loco.mp3', 0.5);
    }
    if (animo === 'triste') {
        bajarAmbiente(2.5);
        reproducir('fallo_ataque.mp3', 0.5);
    }
}

// victoria y derrota: melodías cortas
export function sonidoVictoria() {
    [523, 659, 784, 1047].forEach(function (nota, i) {
        setTimeout(function () { barrido(nota, nota, 0.18, 'square', 0.15); }, i * 150);
    });
}
export function sonidoDerrota() {
    [392, 330, 262, 196].forEach(function (nota, i) {
        setTimeout(function () { barrido(nota, nota, 0.25, 'triangle', 0.18); }, i * 220);
    });
}

// ---------- MURMULLO DEL ESTADIO (sonido de fondo) ----------
let ambiente = null;   // guarda el murmullo mientras suena
const VOLUMEN_AMBIENTE = 0.12;   // volumen normal del murmullo

// Empieza el murmullo del público (si ya está sonando, no hace nada)
export function iniciarAmbiente() {
    if (ctx === null || ambiente !== null) return;
    const ahora = ctx.currentTime;

    // 2 segundos de ruido que se repiten en loop
    const muestras = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.loop = true;                 // se repite para siempre

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';            // deja pasar los graves: suena a rumor de estadio
    filtro.frequency.value = 800;       // más bajo = más sordo y lejano

    const vol = ctx.createGain();
    vol.gain.setValueAtTime(0, ahora);
    vol.gain.linearRampToValueAtTime(VOLUMEN_AMBIENTE, ahora + 1.5);   // entra suave en 1,5 s

    fuente.connect(filtro);
    filtro.connect(vol);
    vol.connect(ctx.destination);
    fuente.start(ahora);

    ambiente = { fuente: fuente, vol: vol };
}

// Apaga el murmullo de a poco
export function detenerAmbiente() {
    if (ambiente === null) return;
    const ahora = ctx.currentTime;
    ambiente.vol.gain.setValueAtTime(ambiente.vol.gain.value, ahora);
    ambiente.vol.gain.linearRampToValueAtTime(0, ahora + 1.5);   // se apaga en 1,5 s
    ambiente.fuente.stop(ahora + 1.5);
    ambiente = null;
}

// Baja el murmullo un rato (mientras el público reacciona) y después lo vuelve a subir
function bajarAmbiente(duracion) {
    if (ambiente === null) return;
    const ahora = ctx.currentTime;
    const volumen = ambiente.vol.gain;

    volumen.cancelScheduledValues(ahora);                                    // cancela rampas anteriores
    volumen.setValueAtTime(volumen.value, ahora);                            // parte desde donde está
    volumen.linearRampToValueAtTime(0.01, ahora + 0.3);                      // baja rápido
    volumen.linearRampToValueAtTime(0.01, ahora + duracion);                 // se mantiene bajo
    volumen.linearRampToValueAtTime(VOLUMEN_AMBIENTE, ahora + duracion + 1); // vuelve suave en 1 s
}