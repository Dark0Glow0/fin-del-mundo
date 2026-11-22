import './style.css';
import * as THREE from 'three';
import { ATAQUES, CRIATURAS, multiplicador } from './datos.js';
import { calcularDanio, crearLuchador, estado, luchadorActivo, jugarTurno, elegirAtaqueRival } from './combate.js';
import { equipoDelDia, semillaDeHoy } from './diario.js';

const criaturasDeHoy = equipoDelDia(CRIATURAS, 3);
estado.jugador.equipo = criaturasDeHoy.map(c => crearLuchador(c.id));
estado.rival.equipo = [crearLuchador('puma'), crearLuchador('cherufe'), crearLuchador('foca')];

console.log('Tú:', luchadorActivo('jugador').nombre, luchadorActivo('jugador').vidaActual);
console.log('Lautaro:', luchadorActivo('rival').nombre, luchadorActivo('rival').vidaActual);

/*
///prueba sistema de tipos
console.log('Mar contra Volcán:', multiplicador('mar', 'volcan'));        
console.log('Volcán contra Mar:', multiplicador('volcan', 'mar'));        
console.log('Volcán contra Desierto:', multiplicador('volcan', 'desierto'));

///info de las criaturas
CRIATURAS.forEach((c) => {
  const total = c.vida + c.ataque + c.defensa + c.velocidad;
  console.log(c.nombre, total);
});

///prueba sistema de combate
const hummble = CRIATURAS.find(c => c.id === 'pinguino');
const cherufe = CRIATURAS.find(c => c.id === 'cherufe');

console.log('Marejada contra Cherufe:', calcularDanio(hummble, cherufe, 'marejada'));
console.log('Erupción contra Hummble:', calcularDanio(cherufe, hummble, 'erupcion'));

///consulta de la versión de three.js
console.log('three.js versión', THREE.REVISION);*/

// 1. La escena: el mundo donde van los objetos
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1a2e');

// 2. La cámara: desde dónde miramos
const camera = new THREE.PerspectiveCamera(
  60,                                      // campo de visión (grados)
  window.innerWidth / window.innerHeight,  // proporción de la pantalla
  0.1,                                     // lo más cerca que ve
  100                                      // lo más lejos que ve
);
camera.position.set(0, 2, 6);  // x, y, z: un poco arriba y hacia atrás
camera.lookAt(0, 0, 0);   // la cámara apunta al centro de la escena

// 3. El renderer: dibuja la escena en la página
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.querySelector('#app').appendChild(renderer.domElement);

// Luces: sin luz, los materiales "standard" se ven negros
const luzAmbiente = new THREE.AmbientLight('#ffffff', 0.5);   // ilumina todo un poco
scene.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight('#ffffff', 1.5);    // como el sol: viene de una dirección
luzSol.position.set(3, 5, 4);
luzSol.castShadow = true;
luzSol.shadow.radius = 5;
luzSol.shadow.mapSize.set(2048, 2048);
scene.add(luzSol);


// Primera criatura (por ahora, una cápsula)
const forma = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);            // radio, largo
const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
const criatura = new THREE.Mesh(forma, material);
criatura.position.set(-2, 0, 0);
criatura.castShadow = true;
scene.add(criatura);


const formaEnemiga = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);            // radio, largo
const materialEnemigo = new THREE.MeshStandardMaterial({ color: '#4dff74' });
const enemigo = new THREE.Mesh(formaEnemiga, materialEnemigo);
enemigo.position.set(2, 0, -3);
enemigo.castShadow = true;
scene.add(enemigo);


const planeCreatura = new THREE.PlaneGeometry(100, 100);
const materialPlano = new THREE.MeshStandardMaterial({ color: '#888888' });
const plano = new THREE.Mesh(planeCreatura, materialPlano);
plano.position.set(0, -1, 0);
plano.rotation.x = -Math.PI / 2;
plano.receiveShadow = true;
scene.add(plano);

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- ESTADIO ----------

// Arena: círculo de tierra donde pelean las criaturas
const arena = new THREE.Mesh(
  new THREE.CircleGeometry(5.5, 48),
  new THREE.MeshStandardMaterial({ color: '#b08a5a' })
);
arena.rotation.x = -Math.PI / 2;      // acostado, como el piso
arena.position.set(0, -0.99, -1.5);   // apenas sobre el piso, para que no parpadee
arena.receiveShadow = true;
scene.add(arena);

// Borde blanco de la arena
const borde = new THREE.Mesh(
  new THREE.RingGeometry(5.5, 5.75, 48),   // anillo: radio interior, radio exterior
  new THREE.MeshStandardMaterial({ color: '#f2f2f2' })
);
borde.rotation.x = -Math.PI / 2;
borde.position.set(0, -0.98, -1.5);
scene.add(borde);

// Gradas con público, en semicírculo detrás de la arena
const formaEscalon = new THREE.BoxGeometry(1.3, 0.6, 1.3);    // se crean UNA vez y se reutilizan
const materialEscalon = new THREE.MeshStandardMaterial({ color: '#4a4f5c' });
const formaPersona = new THREE.CapsuleGeometry(0.16, 0.22, 4, 8);
const coloresPublico = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#f97316', '#a855f7', '#ffffff'];
const materialesPublico = coloresPublico.map(c => new THREE.MeshStandardMaterial({ color: c }));

const publico = [];   // lista de espectadores, para animarlos en el loop

for (let fila = 0; fila < 4; fila++) {
  const radio = 8.5 + fila * 1.2;          // cada fila más lejos…
  const altura = -0.7 + fila * 0.6;        // …y más alta, como escalones
  const cantidad = 24 + fila * 4;          // más asientos en las filas de atrás

  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.PI + (i / (cantidad - 1)) * Math.PI;   // de 180° a 360°: la mitad de atrás
    const x = Math.cos(angulo) * radio;
    const z = -1.5 + Math.sin(angulo) * radio;

    // el escalón
    const escalon = new THREE.Mesh(formaEscalon, materialEscalon);
    escalon.position.set(x, altura, z);
    escalon.receiveShadow = true;
    scene.add(escalon);

    // el espectador, con un color al azar
    const color = materialesPublico[Math.floor(Math.random() * materialesPublico.length)];
    const persona = new THREE.Mesh(formaPersona, color);
    persona.position.set(x, altura + 0.6, z);
    persona.userData.base = persona.position.y;               // altura donde está sentado
    persona.userData.fase = Math.random() * Math.PI * 2;      // cada uno salta a su ritmo…
    persona.userData.rapidez = 4 + Math.random() * 4;         // …y a su velocidad
    persona.userData.angulo = angulo;   // su lugar en el semicírculo (para la ola)
    scene.add(persona);
    publico.push(persona);
  }
}

// Ánimo del público: 'normal', 'ola', 'triste' o 'loco'
let animoPublico = 'normal';
let inicioAnimo = 0;     // en qué segundo empezó el ánimo actual
let tiempoJuego = 0;     // el tiempo del loop, para usarlo fuera de él

// Cuánto dura cada ánimo antes de volver a la normalidad (en segundos)
const DURACION_ANIMO = { ola: 2, triste: 1.6, loco: 2.5 };

// Cambia el ánimo del público
function reaccionPublico(animo) {
  animoPublico = animo;
  inicioAnimo = tiempoJuego;
}

// Loop de animación: como el Update() de Unity
const reloj = new THREE.Timer();

function animar(tiempo) {
  reloj.update(tiempo);               // actualiza el reloj en cada cuadro
  const t = reloj.getElapsed();       // segundos desde que empezó

  // respiración: sube y baja suavemente
  criatura.position.y = Math.sin(t * 2) * 0.1;
  enemigo.position.y = Math.sin(t * 2 + 1) * 0.1;

  tiempoJuego = t;
  const dt = t - inicioAnimo;   // segundos desde que empezó el ánimo actual

  // si el ánimo ya duró lo suficiente, vuelve a la normalidad
  if (animoPublico !== 'normal' && dt > DURACION_ANIMO[animoPublico]) animoPublico = 'normal';

  publico.forEach(function (p) {
    let salto = 0;
    let escala = 1;

    // normal: apenas se mueven
    if (animoPublico === 'normal') {
      salto = Math.abs(Math.sin(t * 2 + p.userData.fase)) * 0.3;
    }

    // ola: un "frente" recorre el semicírculo y salta quien está cerca de él
    if (animoPublico === 'ola') {
      const frente = Math.PI + (dt / 1.5) * Math.PI;              // avanza de 180° a 360° en 1,5 s
      const distancia = Math.abs(p.userData.angulo - frente);
      if (distancia < 0.35) salto = Math.cos(distancia / 0.35 * Math.PI / 2) * 0.6;
    }

    // triste: se agachan
    if (animoPublico === 'triste') {
      escala = 0.55;
    }

    // loco: saltan alto y rapidísimo
    if (animoPublico === 'loco') {
      salto = Math.abs(Math.sin(t * p.userData.rapidez * 2.5 + p.userData.fase)) * 0.5;
    }

    // la escala cambia suave (no de golpe) y, al achicarse, bajan para no flotar
    p.scale.y += (escala - p.scale.y) * 0.15;
    p.position.y = p.userData.base + salto - (1 - p.scale.y) * 0.27;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animar);      // pide al navegador que vuelva a llamar a animar
}
animar();

// ---------- INTERFAZ ----------

// Nombres para mostrar de cada tipo (las claves internas no llevan tildes)
const NOMBRES_TIPO = {
  volcan: 'Volcán', mar: 'Mar', bosque: 'Bosque', hielo: 'Hielo',
  desierto: 'Desierto', cordillera: 'Cordillera', ciudad: 'Ciudad',
};

// Llena un panel de vida con los datos de una criatura
function actualizarPanel(idPanel, luchador) {
  const panel = document.getElementById(idPanel);
  panel.querySelector('.vida-nombre').textContent = luchador.nombre;
  panel.querySelector('.vida-tipo').textContent = NOMBRES_TIPO[luchador.tipo];
  panel.querySelector('.vida-num').textContent = luchador.vidaActual + ' / ' + luchador.vida;

  // la barra: su ancho es el % de vida que queda
  const porcentaje = luchador.vidaActual / luchador.vida * 100;
  const relleno = panel.querySelector('.barra-relleno');
  relleno.style.width = porcentaje + '%';

  // color según la vida: verde, amarillo bajo 50%, rojo bajo 20%
  let color = '#4ade80';
  if (porcentaje < 50) color = '#facc15';
  if (porcentaje < 20) color = '#ef4444';
  relleno.style.background = color;
}

// Crea un botón por cada ataque de tu criatura activa
function mostrarBotones() {
  const contenedor = document.getElementById('botones-ataque');
  contenedor.innerHTML = '';   // borra los botones anteriores

  luchadorActivo('jugador').ataques.forEach(function (id) {
    const ataque = ATAQUES[id];
    const boton = document.createElement('button');
    boton.className = 'btn-ataque';
    boton.innerHTML = ataque.nombre + '<small>' + NOMBRES_TIPO[ataque.tipo] + ' · poder ' + ataque.poder + '</small>';
    boton.addEventListener('click', function () { elegirAtaque(id); });
    boton.addEventListener('mouseenter', function () { mostrarInfoAtaque(id, boton); });
    boton.addEventListener('mouseleave', ocultarInfoAtaque);
    contenedor.appendChild(boton);
  });
}

// Actualiza todo lo que se ve: paneles, botones y colores de las cápsulas
function actualizarInterfaz() {
  actualizarPanel('vida-jugador', luchadorActivo('jugador'));
  actualizarPanel('vida-rival', luchadorActivo('rival'));
  mostrarBotones();

  material.color.set(luchadorActivo('jugador').color);
  materialEnemigo.color.set(luchadorActivo('rival').color);
}

let animando = false;   // true mientras se muestran los mensajes del turno

async function elegirAtaque(id) {
  if (estado.terminado || animando) return;   // || significa "o": si cualquiera es true, no hace nada
  animando = true;
  ocultarInfoAtaque();   // si estaba mostrando la info de un ataque, la oculta

  // desactiva los botones mientras se ve el turno
  document.querySelectorAll('.btn-ataque').forEach(function (b) { b.disabled = true; });

  const mensajes = jugarTurno(id, elegirAtaqueRival());

  guardarPartida(); // guarda el resultado del turno antes de animarlo

  // muestra los mensajes uno por uno, esperando a que termine cada uno
  for (let i = 0; i < mensajes.length; i++) {
    const evento = mensajes[i];
    await escribir(evento.texto);

    // si fue un ataque: el atacante se lanza, y si acertó, el otro recibe el golpe
    if (evento.atacante) {
      if (evento.acerto) {
        const efecto = efectoDeAtaque(evento.tipoAtaque, evento.atacante, evento.golpeado);
        await esperar(400);
        actualizarBarra(evento.golpeado, evento.vida, evento.vidaMax);
        await animarGolpe(evento.golpeado, evento.critico);
        if (evento.critico)
          reaccionPublico('loco');
        if (evento.critico === false)
          reaccionPublico('ola');
        await efecto;
      }
      if (evento.acerto === false) {
        await animarMareo(evento.atacante);   // falló: sin efecto, el atacante se marea
        reaccionPublico('triste');
      }
    }

    if (evento.debilitado) 
      await animarDebilitado(evento.debilitado);
    if (evento.entra){
      reaccionPublico('loco');
      await animarEntrada(evento.entra);
    }
  }

  actualizarInterfaz();   // barras, botones y colores
  if (estado.terminado) {
    guardarRegistro(estado.ganador);
    localStorage.removeItem(CLAVE_PARTIDA);
    await esperar(800);
    mostrarFinal(estado.ganador);
    return;
  }

  // los botones siguen bloqueados mientras se escribe la pregunta
  document.querySelectorAll('.btn-ataque').forEach(function (b) { b.disabled = true; });
  await escribir('¿Qué hará ' + luchadorActivo('jugador').nombre + '?');

  // recién ahora se puede atacar de nuevo
  document.querySelectorAll('.btn-ataque').forEach(function (b) { b.disabled = false; });
  animando = false;
}

let escrituraActual = 0;   // número de la última escritura que empezó

// Espera un tiempo sin congelar el juego (como WaitForSeconds en una corrutina de Unity)
function esperar(ms) {
  return new Promise(function (resolver) { setTimeout(resolver, ms); });
}

// Escribe un texto letra por letra, como máquina de escribir
async function escribir(texto) {
  escrituraActual++;
  const miNumero = escrituraActual;   // el número de ESTA escritura

  const caja = document.getElementById('mensaje');
  caja.textContent = '';
  for (let i = 0; i < texto.length; i++) {
    if (miNumero !== escrituraActual) return;   // empezó otra escritura: esta se detiene
    caja.textContent += texto[i];
    await esperar(25);
  }
  await esperar(700);
}

// Muestra la información de un ataque encima de su botón
function mostrarInfoAtaque(id, boton) {
  const ataque = ATAQUES[id];
  const yo = luchadorActivo('jugador');
  const rival = luchadorActivo('rival');

  // ¿qué tan efectivo es contra la criatura que tengo al frente?
  const efectividad = multiplicador(ataque.tipo, rival.tipo);
  let textoEfectividad = 'Daño normal contra ' + rival.nombre;
  let clase = '';
  if (efectividad === 2) {
    textoEfectividad = '¡Súper efectivo contra ' + rival.nombre + '!';
    clase = 'info-efectivo';
  }
  if (efectividad === 0.5) {
    textoEfectividad = 'Poco efectivo contra ' + rival.nombre;
    clase = 'info-poco';
  }

  // bonus si el ataque es del mismo tipo que mi criatura
  let bonus = '';
  if (ataque.tipo === yo.tipo) bonus = '<div>+50% de daño: es de su mismo tipo</div>';

  const info = document.getElementById('info-ataque');
  info.innerHTML =
    '<div class="info-titulo">' + ataque.nombre + '</div>' +
    '<div>Tipo: ' + NOMBRES_TIPO[ataque.tipo] + '</div>' +
    '<div>Poder: ' + ataque.poder + ' · Precisión: ' + ataque.precision + '%</div>' +
    bonus +
    '<div class="' + clase + '">' + textoEfectividad + '</div>';

  info.style.left = boton.offsetLeft + 'px';   // la caja se alinea con el botón
  info.classList.remove('oculta');
}

function ocultarInfoAtaque() {
  document.getElementById('info-ataque').classList.add('oculta');
}

// ---------- ANIMACIONES ----------

// La cápsula de cada lado
function capsulaDe(lado) {
  if (lado === 'jugador') return criatura;
  return enemigo;
}

function otroDe(lado) {
  if (lado === 'jugador') return 'rival';
  return 'jugador';
}


// El golpeado brilla en blanco y tiembla
async function animarGolpe(lado, critico) {
  const capsula = capsulaDe(lado);
  const x0 = capsula.position.x;

  let color = '#ffffff';
  let fuerza = 0.15;
  if (critico) {
    color = '#ff2a2a';    // rojo intenso
    fuerza = 0.3;         // tiembla el doble
  }

  capsula.material.emissive.set(color);

  for (let i = 0; i < 6; i++) {
    let desvio = fuerza;
    if (i % 2 === 1) desvio = -fuerza;
    capsula.position.x = x0 + desvio;
    await esperar(40);
  }

  capsula.position.x = x0;
  capsula.material.emissive.set('#000000');
}

// El debilitado se encoge hasta desaparecer
async function animarDebilitado(lado) {
  const capsula = capsulaDe(lado);
  for (let i = 1; i <= 20; i++) {
    const escala = 1 - i / 20;
    capsula.scale.set(escala, escala, escala);
    await esperar(20);
  }
}

// Entra una criatura: aparece con un "pop" (crece, rebota) y un destello que se apaga
async function animarEntrada(lado) {
  const capsula = capsulaDe(lado);
  capsula.material.color.set(luchadorActivo(lado).color);
  actualizarPanel('vida-' + lado, luchadorActivo(lado));

  for (let i = 1; i <= 20; i++) {
    const avance = i / 20;   // de 0 a 1

    // crece hasta 1.2 y en el último tramo vuelve a 1 (rebote)
    let escala = avance * 1.2;
    if (avance > 0.8) escala = 1.2 - (avance - 0.8) / 0.2 * 0.2;
    capsula.scale.set(escala, escala, escala);

    // destello blanco que se va apagando
    const brillo = 1 - avance;
    capsula.material.emissive.setRGB(brillo, brillo, brillo);

    await esperar(20);
  }

  capsula.scale.set(1, 1, 1);
  capsula.material.emissive.set('#000000');
}

// Baja solo la barra de un lado, con la vida que trae el evento
function actualizarBarra(lado, vida, vidaMax) {
  const panel = document.getElementById('vida-' + lado);
  panel.querySelector('.vida-num').textContent = vida + ' / ' + vidaMax;

  const porcentaje = vida / vidaMax * 100;
  const relleno = panel.querySelector('.barra-relleno');
  relleno.style.width = porcentaje + '%';

  let color = '#4ade80';
  if (porcentaje < 50) color = '#facc15';
  if (porcentaje < 20) color = '#ef4444';
  relleno.style.background = color;
}

// El que falló se tambalea, como mareado
async function animarMareo(lado) {
  const capsula = capsulaDe(lado);
  for (let c = 0; c < 45; c++) {
    capsula.rotation.z = Math.sin(c * 0.45) * 0.35;   // se inclina a un lado y al otro
    await esperar(16);
  }
  capsula.rotation.z = 0;   // vuelve a quedar derecho
}

// ---------- EFECTOS DE ATAQUE ----------

// Estilo, colores y forma del efecto de cada tipo
const EFECTOS = {
  cordillera: { estilo: 'cae', colores: ['#8b6b4a', '#7a7a7a'], forma: 'roca' },
  volcan: { estilo: 'cae', colores: ['#ff6a00', '#ffb300'], forma: 'bola' },
  mar: { estilo: 'proyectil', colores: ['#2f8cff', '#7fc4ff'], forma: 'bola' },
  hielo: { estilo: 'proyectil', colores: ['#bfefff', '#7fd4ff'], forma: 'cristal' },
  desierto: { estilo: 'proyectil', colores: ['#e3c07a', '#c9a15a'], forma: 'roca' },
  bosque: { estilo: 'sube', colores: ['#3fa34d', '#7bd389'], forma: 'hoja' },
  ciudad: { estilo: 'sismo', colores: ['#8a8a7a'], forma: 'roca' },
};

// La forma de cada partícula
function crearForma(forma) {
  if (forma === 'bola') return new THREE.SphereGeometry(0.12, 8, 8);
  if (forma === 'cristal') return new THREE.OctahedronGeometry(0.14);
  if (forma === 'hoja') return new THREE.BoxGeometry(0.2, 0.02, 0.12);
  return new THREE.BoxGeometry(0.18, 0.18, 0.18);   // roca
}

// Crea una partícula del efecto y la agrega a la escena
function crearParticula(efecto, i) {
  const color = efecto.colores[i % efecto.colores.length];
  const p = new THREE.Mesh(crearForma(efecto.forma), new THREE.MeshStandardMaterial({ color: color }));
  p.castShadow = true;
  p.userData.velocidad = 0;
  scene.add(p);
  return p;
}

// Saca objetos de la escena y libera su memoria
function limpiar(objetos) {
  objetos.forEach(function (o) {
    scene.remove(o);
    o.geometry.dispose();
    o.material.dispose();
  });
}

// Hace caer partículas con gravedad durante cierta cantidad de cuadros
async function caer(particulas, cuadros) {
  for (let c = 0; c < cuadros; c++) {
    particulas.forEach(function (p) {
      p.userData.velocidad += 0.012;
      p.position.y -= p.userData.velocidad;
      p.rotation.x += 0.2;
      p.rotation.y += 0.15;
      if (p.position.y < -0.9) p.position.y = -0.9;
    });
    await esperar(16);
  }
}

// Elige la animación según el estilo del tipo
async function efectoDeAtaque(tipo, atacante, golpeado) {
  const efecto = EFECTOS[tipo];
  if (efecto.estilo === 'cae') await efectoCae(efecto, golpeado);
  if (efecto.estilo === 'proyectil') await efectoProyectil(efecto, atacante, golpeado);
  if (efecto.estilo === 'sube') await efectoSube(efecto, golpeado);
  if (efecto.estilo === 'sismo') await efectoSismo(efecto);
}

// CAE: lluvia desde arriba sobre el golpeado
async function efectoCae(efecto, golpeado) {
  const objetivo = capsulaDe(golpeado).position.clone();   // guarda el lugar: si esquiva, cae en el vacío
  const particulas = [];
  for (let i = 0; i < 14; i++) {
    const p = crearParticula(efecto, i);
    p.position.set(
      objetivo.x + (Math.random() - 0.5) * 1.5,
      3 + Math.random() * 2,
      objetivo.z + (Math.random() - 0.5) * 1.5
    );
    particulas.push(p);
  }
  await caer(particulas, 50);
  limpiar(particulas);
}

// PROYECTIL: sale del atacante y vuela en arco hacia el golpeado
async function efectoProyectil(efecto, atacante, golpeado) {
  const origen = capsulaDe(atacante).position.clone();
  const destino = capsulaDe(golpeado).position.clone();
  const particulas = [];

  for (let i = 0; i < 16; i++) {
    const p = crearParticula(efecto, i);
    p.position.copy(origen);
    p.userData.retraso = i * 2;                                // salen una tras otra, como un chorro
    p.userData.desvio = (Math.random() - 0.5) * 0.6;           // cada una un poco hacia el lado
    particulas.push(p);
  }

  for (let c = 0; c < 55; c++) {
    particulas.forEach(function (p) {
      // progreso del viaje: de 0 (sale) a 1 (llega), en 20 cuadros
      const progreso = Math.min(1, Math.max(0, (c - p.userData.retraso) / 20));
      p.position.lerpVectors(origen, destino, progreso);                    // avanza entre origen y destino
      p.position.y += 0.3 + Math.sin(progreso * Math.PI) * 0.6;            // arco hacia arriba
      p.position.z += p.userData.desvio * Math.sin(progreso * Math.PI);    // se abre un poco y se cierra
      p.rotation.x += 0.2;
      p.visible = progreso > 0 && progreso < 1;                             // solo se ve mientras viaja
    });
    await esperar(16);
  }
  limpiar(particulas);
}

// SUBE: ramas brotan del suelo alrededor del golpeado y botan hojas
async function efectoSube(efecto, golpeado) {
  const centro = capsulaDe(golpeado).position.clone();
  const ramas = [];

  for (let i = 0; i < 5; i++) {
    const angulo = i / 5 * Math.PI * 2;

    const arbol = new THREE.Group();   // "padre" vacío: tronco + copa

    const tronco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: '#6b4a2b' })
    );
    tronco.position.y = 0.6;           // la mitad del alto: así nace desde el piso del grupo
    tronco.castShadow = true;

    const copa = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.9, 7),
      new THREE.MeshStandardMaterial({ color: '#2f7a3a' })
    );
    copa.position.y = 1.5; // encima del tronco
    copa.castShadow = true;

    arbol.add(tronco);
    arbol.add(copa);
    arbol.position.set(centro.x + Math.cos(angulo) * 0.9, -1, centro.z + Math.sin(angulo) * 0.9);
    arbol.scale.y = 0.01;
    scene.add(arbol);
    ramas.push(arbol);
  }

  // crecen desde el suelo
  for (let c = 1; c <= 15; c++) {
    ramas.forEach(function (r) {
      r.scale.y = c / 15;
      r.position.y = -1 + 0.9 * r.scale.y;  // el cilindro crece desde su centro: se sube para que nazca del piso
    });
    await esperar(16);
  }

  // botan hojas desde arriba de las ramas
  const hojas = [];
  for (let i = 0; i < 14; i++) {
    const h = crearParticula(efecto, i);
    h.position.set(
      centro.x + (Math.random() - 0.5) * 1.6,
      0.8 + Math.random() * 0.6,
      centro.z + (Math.random() - 0.5) * 1.6
    );
    hojas.push(h);
  }
  await caer(hojas, 35);

  // las ramas vuelven a hundirse
  for (let c = 15; c >= 0; c--) {
    ramas.forEach(function (r) {
      r.scale.y = Math.max(0.01, c / 15);
      r.position.y = -1 + 0.9 * r.scale.y;
    });
    await esperar(16);
  }
  ramas.forEach(function (arbol) {
    scene.remove(arbol);
    arbol.children.forEach(function (parte) { parte.geometry.dispose(); parte.material.dispose(); });
  });
  limpiar(hojas);
}

// SISMO: smog sobre la escena y la pantalla tiembla
async function efectoSismo(efecto) {
  const camaraOriginal = camera.position.clone();
  scene.fog = new THREE.Fog(efecto.colores[0], 1, 10);   // niebla: empieza a 1 unidad y tapa todo a las 10

  for (let c = 0; c < 45; c++) {
    camera.position.x = camaraOriginal.x + (Math.random() - 0.5) * 0.3;   // sacudón al azar
    camera.position.y = camaraOriginal.y + (Math.random() - 0.5) * 0.3;
    await esperar(16);
  }
  camera.position.copy(camaraOriginal);   // la cámara vuelve a su lugar

  // el smog se disipa de a poco
  for (let c = 0; c < 20; c++) {
    scene.fog.far += 4;
    await esperar(16);
  }
  scene.fog = null;
}

// ---------- PANTALLAS ----------

// Muestra una pantalla y oculta las demás
function mostrarPantalla(id) {
  ['pantalla-inicio', 'pantalla-equipo', 'pantalla-final'].forEach(function (p) {
    document.getElementById(p).classList.add('oculta');
  });
  document.getElementById(id).classList.remove('oculta');
}

// Empieza el combate: oculta las pantallas y muestra la interfaz
function empezarCombate() {
  guardarRegistro('en curso');
  estado.jugador.equipo = orden.map(id => crearLuchador(id));
  guardarPartida();
  document.getElementById('pantalla-equipo').classList.add('oculta');
  document.getElementById('hud').classList.remove('oculta');
  actualizarInterfaz();
  document.getElementById('mensaje').textContent =
    '¡Lautaro te desafía! ¿Qué hará ' + luchadorActivo('jugador').nombre + '?';
  animarEntrada('jugador');
  animarEntrada('rival');
}

document.getElementById('btn-jugar').addEventListener('click', function () {
  mostrarPantalla('pantalla-equipo');
  mostrarCartasEquipo();
});
document.getElementById('btn-pelear').addEventListener('click', empezarCombate);

// ---------- ELEGIR ORDEN ----------
let orden = [];   // ids de las criaturas, en el orden elegido

function mostrarCartasEquipo() {
  const contenedor = document.getElementById('cartas-equipo');
  contenedor.innerHTML = '';

  criaturasDeHoy.forEach(function (c) {
    const posicion = orden.indexOf(c.id);   // en qué lugar fue elegida (-1 si todavía no)

    let numero = '';
    if (posicion !== -1) numero = posicion + 1;

    const carta = document.createElement('button');
    carta.className = 'carta-criatura';
    if (posicion !== -1) carta.classList.add('elegida');

    carta.innerHTML =
      '<span class="carta-orden">' + numero + '</span>' +
      '<span class="carta-color" style="background:' + c.color + '"></span>' +
      '<span class="carta-nombre">' + c.nombre + '</span>' +
      '<span class="carta-tipo">' + NOMBRES_TIPO[c.tipo] + '</span>' +
      '<span class="carta-stats">PS ' + c.vida + ' · ATQ ' + c.ataque + '<br>DEF ' + c.defensa + ' · VEL ' + c.velocidad + '</span>';

    carta.addEventListener('click', function () {
      if (posicion === -1) orden.push(c.id);         // no estaba: la agrega al final
      if (posicion !== -1) orden.splice(posicion, 1); // ya estaba: la quita
      mostrarCartasEquipo();                         // vuelve a dibujar las cartas
    });

    contenedor.appendChild(carta);
  });

  // el botón se activa solo cuando las 3 tienen orden
  document.getElementById('btn-pelear').disabled = orden.length < criaturasDeHoy.length;
}

// ---------- UN INTENTO POR DÍA ----------
const CLAVE = 'fin-del-mundo';   // nombre con el que se guarda en el navegador
const CLAVE_PARTIDA = 'fin-del-mundo-partida'; // nombre con el que se guarda la partida en curso

function guardarPartida() {
  localStorage.setItem(CLAVE_PARTIDA, JSON.stringify({ fecha: semillaDeHoy(), estado: estado }));
}

function leerPartida() {
  const texto = localStorage.getItem(CLAVE_PARTIDA);
  if (texto === null) return null;
  return JSON.parse(texto);
}

// Retoma un combate guardado
function continuarPartida(guardada) {
  estado.jugador = guardada.estado.jugador;
  estado.rival = guardada.estado.rival;
  estado.turno = guardada.estado.turno;

  document.getElementById('pantalla-inicio').classList.add('oculta');
  document.getElementById('hud').classList.remove('oculta');
  actualizarInterfaz();
  escribir('¡El combate continúa! ¿Qué hará ' + luchadorActivo('jugador').nombre + '?');
  animarEntrada('jugador');
  animarEntrada('rival');
}

// Lee lo que se guardó (o null si nunca ha jugado)
function leerRegistro() {
  const texto = localStorage.getItem(CLAVE);
  if (texto === null) return null;
  return JSON.parse(texto);
}

// Guarda la fecha de hoy y el resultado
function guardarRegistro(resultado) {
  localStorage.setItem(CLAVE, JSON.stringify({ fecha: semillaDeHoy(), resultado: resultado }));
}

// Cuánto falta para la medianoche (el próximo desafío)
function tiempoHastaManana() {
  const ahora = new Date();
  const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);  // hoy + 1 día, a las 00:00
  const ms = manana - ahora;

  const horas = Math.floor(ms / 3600000);
  const minutos = Math.floor(ms % 3600000 / 60000);
  const segundos = Math.floor(ms % 60000 / 1000);
  return horas + 'h ' + minutos + 'm ' + segundos + 's';
}

// Muestra la pantalla final según el resultado
function mostrarFinal(resultado) {
  let titulo = '¡Lautaro ganó!';
  let texto = 'Tu equipo cayó en batalla. Vuelve mañana con un nuevo equipo e inténtalo otra vez.';
  if (resultado === 'jugador') {
    titulo = '¡Felicidades, derrotaste a Lautaro!';
    texto = 'Superaste el desafío de hoy. Vuelve mañana por uno nuevo.';
  }
  document.getElementById('final-titulo').textContent = titulo;
  document.getElementById('final-texto').textContent = texto;
  document.getElementById('hud').classList.add('oculta');
  mostrarPantalla('pantalla-final');

  // contador que se actualiza cada segundo
  setInterval(function () {
    document.getElementById('final-cuenta').textContent = 'Próximo desafío en ' + tiempoHastaManana();
  }, 1000);
}

// Al abrir el juego: si ya jugó hoy, directo a la pantalla final
// Al abrir el juego: ¿ya jugó hoy?
const registro = leerRegistro();
if (registro !== null && registro.fecha === semillaDeHoy()) {
  const partida = leerPartida();

  // ¿quedó un combate a medias hoy? Entonces se continúa
  const continuar = registro.resultado === 'en curso' && partida !== null && partida.fecha === semillaDeHoy();

  if (continuar) continuarPartida(partida);
  if (continuar === false) mostrarFinal(registro.resultado);
}