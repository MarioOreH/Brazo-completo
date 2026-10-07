/**
 * @fileoverview Diccionario Digital Interactivo de la Mano
 *
 * LECCIÓN (5 escenas) → usa tramos del video assets/video/manos.mp4 (1280 x 720, 10 s).
 * Cada tramo se reproduce y se PAUSA en el fotograma final; ahí aparece
 * el contorno resaltado de la parte (coordenadas del video).
 *
 *   MANO   0.0 – 2.5 s   acercamiento a la mano abierta
 *   DEDOS  2.5 – 4.6 s   acercamiento a los dedos y el pulgar
 *   PALMA  4.6 – 5.0 s   palma abierta
 *   SUAVE  5.0 – 7.2 s   la mano acaricia el peluche
 *   ÁSPERO 7.2 – 9.9 s   la mano frota la lija
 *
 * Los tramos son CONSECUTIVOS: al pasar a la siguiente parte el video sigue
 * desde donde se pausó (sin cortes, sin fundidos, sin pantalla en negro).
 *
 * JUEGO → una sola imagen (assets/images/mano.jpg) con zonas SVG tocables.
 *
 * @version 3.1.0
 */

'use strict';

/* ============================================================
   DATOS EDUCATIVOS
   ============================================================ */

const AUDIO_BASE = './assets/audios/';

/** Tamaño del video (sistema de coordenadas de los contornos). */
const VIDEO_W = 1280, VIDEO_H = 720;

/** Contornos (path SVG) en coordenadas del video. */
const SHAPES = {
  mano:    'M590 418 L640 400 L720 398 L790 410 L925 425 L925 455 L880 468 L790 465 L800 480 L860 520 L1000 580 L1025 600 L1020 625 L940 655 L945 685 L900 690 L835 692 L790 675 L700 650 L620 610 L560 555 L550 500 Z',
  dedos:   'M800 345 L900 372 L1010 415 L1100 445 L1113 470 L1090 495 L1020 500 L1090 525 L1100 555 L1070 583 L1005 580 L1000 625 L985 650 L940 662 L880 650 L850 640 L815 645 L808 665 L770 672 L700 655 L640 615 L580 580 L640 555 L700 520 L740 480 L800 420 Z ' +
           'M610 140 L700 130 L800 128 L880 130 L912 150 L912 180 L880 205 L800 222 L710 235 L680 235 L650 190 Z',
  palma:   'M330 230 L430 180 L560 150 L640 140 L660 200 L690 240 L730 300 L800 345 L800 420 L740 480 L700 520 L640 555 L580 580 L500 560 L400 505 L330 460 L300 400 L300 290 Z',
  peluche: 'M480 470 L520 440 L640 425 L770 425 L840 330 L900 300 L850 190 L920 150 L1040 110 L1100 75 L1160 100 L1200 190 L1280 260 L1280 470 L1250 590 L1220 660 L1100 700 L900 720 L740 700 L600 660 L520 620 L490 560 Z',
  lija:    'M660 318 L735 365 L805 430 L808 470 L805 515 L780 548 L700 578 L600 560 L495 520 L745 700 L1035 540 Z',
};

/**
 * Cada entrada define una escena de la lección.
 *
 * clip:     { start, end } en segundos del video; se pausa en `end`.
 * shape:    contorno que se resalta al pausar (clave de SHAPES) o null.
 * gameZone: id del data-zone del SVG que corresponde a esta parte en el juego.
 */
const PARTS_DATA = [
  {
    id: 'mano', label: 'MANO', icon: '✋',
    phrase:   'Esta es mi mano. Con mi mano puedo tocar y saludar.',
    question: '¿Dónde está la mano?',
    answer:   '¡Muy bien! Esta es la mano.',
    clip: { start: 0.00, end: 2.50 }, shape: 'mano', gameZone: 'mano',
  },
  {
    id: 'dedos', label: 'DEDOS', icon: '🖐️',
    phrase:   'Estos son mis dedos. Mis dedos se pueden mover.',
    question: '¿Dónde están los dedos?',
    answer:   '¡Muy bien! Estos son los dedos.',
    clip: { start: 2.50, end: 4.60 }, shape: 'dedos', gameZone: 'dedos',
  },
  {
    id: 'palma', label: 'PALMA', icon: '🤚',
    phrase:   'Esta es la palma de mi mano.',
    question: '¿Dónde está la palma?',
    answer:   '¡Muy bien! Esta es la palma.',
    clip: { start: 4.60, end: 5.00 }, shape: 'palma', gameZone: 'palma',
  },
  {
    id: 'suave', label: 'SUAVE', icon: '🧸',
    phrase:   'El algodón se siente suave.',
    question: '¿Cuál es el objeto suave?',
    answer:   '¡Muy bien! El peluche es suave.',
    clip: { start: 5.00, end: 7.20 }, shape: 'peluche', gameZone: 'suave',
  },
  {
    id: 'aspero', label: 'ÁSPERO', icon: '🟫',
    phrase:   'El cartón se siente áspero.',
    question: '¿Cuál es el objeto áspero?',
    answer:   '¡Muy bien! La lija es áspera.',
    clip: { start: 7.20, end: 9.90 }, shape: 'lija', gameZone: 'aspero',
  },
];

/** Única imagen del JUEGO (encuadre completo con todos los elementos) */
const GAME_IMAGE_SRC = './assets/images/mano.jpg';

/** Al preguntar por la MANO también es válido tocar la palma o los dedos (son parte de la mano). */
const ZONE_ALIASES = { mano: ['mano', 'palma', 'dedos'] };

const TOTAL_PARTS    = PARTS_DATA.length;
const GAME_QUESTIONS = Math.min(5, TOTAL_PARTS);

/** Mapa de archivos de audio. Si el MP3 no existe → SpeechSynthesis como fallback. */
const AUDIO_MAP = {
  mano:   { main: 'MANO_VERSION_COMPLETA.mp3',   question: 'DONDE_ESTA_LA_MANO.mp3',       answer: 'MUY_BIEN_ESTA_ES_LA_MANO.mp3'      },
  dedos:  { main: 'DEDOS_VERSION_COMPLETA.mp3',  question: 'DONDE_ESTAN_LOS_DEDOS.mp3',    answer: 'MUY_BIEN_ESTOS_SON_LOS_DEDOS.mp3'  },
  palma:  { main: 'PALMA_VERSION_COMPLETA.mp3',  question: 'DONDE_ESTA_LA_PALMA.mp3',      answer: 'MUY_BIEN_ESTA_ES_LA_PALMA.mp3'     },
  suave:  { main: 'SUAVE_VERSION_COMPLETA.mp3',  question: 'CUAL_ES_EL_OBJETO_SUAVE.mp3',  answer: 'MUY_BIEN_EL_PELUCHE_ES_SUAVE.mp3'  },
  aspero: { main: 'ASPERO_VERSION_COMPLETA.mp3', question: 'CUAL_ES_EL_OBJETO_ASPERO.mp3', answer: 'MUY_BIEN_LA_LIJA_ES_ASPERA.mp3'    },
};

const SPECIAL_AUDIO = {
  intro:  'INTRO_MANO.mp3',
  finish: 'EXCELENTE_CONOCES_LA_MANO.mp3',
};

/* ============================================================
   UTILIDADES
   ============================================================ */

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffleAndPick(array, n) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ============================================================
   AUDIO MANAGER
   ============================================================ */

class AudioManager {
  constructor() {
    this._muted        = false;
    this._audioCtx     = null;
    this._currentAudio = null;
    this._utterance    = null;
    this._voice        = null;
    this._speechTimer  = 0;
    this._finishSpeech = null;
    this._tones        = [];
    this._synth        = window.speechSynthesis || null;

    this._loadVoices();
    if (this._synth) {
      this._synth.addEventListener('voiceschanged', () => this._loadVoices());
    }
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    if (this._muted) this.stopAll();
    return this._muted;
  }

  stopAll() {
    this._stopAudioElement();
    this._stopSpeech();
    this._stopTones();
  }

  unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !this._audioCtx) this._audioCtx = new AC();
      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(() => {});
      }
    } catch (e) { /* no soportado */ }
  }

  async playPart(partId) {
    const entry = AUDIO_MAP[partId];
    if (!entry) return;
    try { await this._playFile(AUDIO_BASE + entry.main); }
    catch (e) {
      const part = PARTS_DATA.find((p) => p.id === partId);
      if (part) await this.speak(part.label + '. ' + part.phrase);
    }
  }

  async playQuestion(partId) {
    const entry = AUDIO_MAP[partId];
    if (entry?.question) {
      try { await this._playFile(AUDIO_BASE + entry.question); return; }
      catch (e) { /* fallback */ }
    }
    const part = PARTS_DATA.find((p) => p.id === partId);
    if (part) await this.speak(part.question);
  }

  async playAnswer(partId) {
    const entry = AUDIO_MAP[partId];
    if (entry?.answer) {
      try { await this._playFile(AUDIO_BASE + entry.answer); return; }
      catch (e) { /* fallback */ }
    }
    const part = PARTS_DATA.find((p) => p.id === partId);
    if (part) await this.speak(part.answer);
  }

  async playIntro() {
    try { await this._playFile(AUDIO_BASE + SPECIAL_AUDIO.intro); }
    catch (e) { await this.speak('Hola. Vamos a conocer las partes de la mano.'); }
  }

  async playFinish() {
    try { await this._playFile(AUDIO_BASE + SPECIAL_AUDIO.finish); }
    catch (e) { await this.speak('¡Excelente trabajo! ¡Conoces las partes de la mano y las texturas!'); }
  }

  speak(text) {
    this._stopSpeech();
    if (this._muted || !this._synth) return sleep(450);
    return new Promise((resolve) => {
      this._finishSpeech = resolve;
      const u = new SpeechSynthesisUtterance(text);
      this._utterance = u;
      u.lang  = this._voice?.lang ?? 'es-ES';
      if (this._voice) u.voice = this._voice;
      u.rate = 0.82; u.pitch = 1.25; u.volume = 1;
      const done = () => {
        if (this._utterance !== u) return;
        clearTimeout(this._speechTimer);
        this._utterance = null; this._finishSpeech = null; resolve();
      };
      u.onend  = done;
      u.onerror = () => { if (this._utterance === u) done(); };
      this._speechTimer = setTimeout(() => { if (this._utterance === u) this._stopSpeech(); },
        Math.max(12000, text.length * 150));
      try { this._synth.speak(u); } catch (e) { done(); }
    });
  }

  playChime() {
    if (this._muted || !this._audioCtx) return;
    this._stopTones();
    [523, 659, 784].forEach((freq, i) => {
      const o = this._audioCtx.createOscillator();
      const g = this._audioCtx.createGain();
      const t = this._audioCtx.currentTime + i * 0.14;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(this._audioCtx.destination);
      o.start(t); o.stop(t + 0.4);
      o.onended = () => { o.disconnect(); g.disconnect(); };
      this._tones.push(o);
    });
  }

  playErrorTone() {
    if (this._muted || !this._audioCtx) return;
    this._stopTones();
    const o = this._audioCtx.createOscillator();
    const g = this._audioCtx.createGain();
    const t = this._audioCtx.currentTime;
    o.type = 'triangle';
    o.frequency.setValueAtTime(330, t);
    o.frequency.linearRampToValueAtTime(220, t + 0.3);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(this._audioCtx.destination);
    o.start(t); o.stop(t + 0.5);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    this._tones.push(o);
  }

  getVoiceStatus() {
    if (!this._synth) return 'ESTE NAVEGADOR NO DISPONE DE VOZ.';
    if (!this._voice) return 'PARA AUDIO SIN INTERNET, INSTALA UNA VOZ EN ESPAÑOL.';
    if (!this._voice.localService) return 'LA VOZ DISPONIBLE PUEDE NECESITAR INTERNET.';
    return '';
  }

  _loadVoices() {
    if (!this._synth) return;
    const all = this._synth.getVoices().filter((v) => /^es([-_]|$)/i.test(v.lang));
    if (!all.length) return;
    const score = (v) => {
      let s = 0; const n = v.name.toLowerCase();
      if (n.includes('google'))    s += 50;
      if (n.includes('natural'))   s += 40;
      if (n.includes('online'))    s += 30;
      if (n.includes('microsoft') && !n.includes('desktop')) s += 20;
      if (['elena','paulina','monica','sabina','dalia','female'].some((x) => n.includes(x))) s += 15;
      if (/MX|419|CO|PE/.test(v.lang)) s += 10;
      if (v.localService) s += 5;
      return s;
    };
    all.sort((a, b) => score(b) - score(a));
    this._voice = all[0];
  }

  _playFile(src) {
    this._stopAudioElement(); this._stopSpeech();
    if (this._muted) return sleep(450);
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      this._currentAudio = audio;
      audio.volume  = 1;
      audio.onended = () => { if (this._currentAudio === audio) this._currentAudio = null; resolve(); };
      audio.onerror = () => { if (this._currentAudio === audio) this._currentAudio = null; reject(new Error('Audio failed: ' + src)); };
      audio.play().catch((e) => { if (this._currentAudio === audio) this._currentAudio = null; reject(e); });
    });
  }

  _stopAudioElement() {
    if (this._currentAudio) {
      this._currentAudio.pause(); this._currentAudio.currentTime = 0;
      this._currentAudio.onended = null; this._currentAudio.onerror = null;
      this._currentAudio = null;
    }
  }

  _stopSpeech() {
    clearTimeout(this._speechTimer);
    const done = this._finishSpeech; this._finishSpeech = null;
    if (this._utterance) { this._utterance.onend = null; this._utterance.onerror = null; this._utterance = null; }
    if (this._synth) this._synth.cancel();
    if (done) done();
  }

  _stopTones() {
    this._tones.forEach((o) => { try { o.stop(); } catch (e) { /* ya detenido */ } });
    this._tones = [];
  }
}

/* ============================================================
   SCENE IMAGE CONTROLLER
   Cambia la imagen del escenario con un fade suave.
   ============================================================ */

class SceneImageController {
  /**
   * @param {HTMLImageElement} imgEl    - imagen del juego
   * @param {HTMLVideoElement} videoEl  - video de la lección
   * @param {SVGElement}       svgEl    - zonas del juego
   * @param {SVGElement}       lessonEl - contorno de la lección
   */
  constructor(imgEl, videoEl, svgEl, lessonEl) {
    this._img    = imgEl;
    this._video  = videoEl;
    this._svg    = svgEl;
    this._lesson = lessonEl;
    this._shape  = lessonEl.querySelector('#lessonShape');
    this._videoOk = true;
    // Si el video no carga, se usa la imagen del juego como respaldo
    videoEl.addEventListener('error', () => {
      this._videoOk = false;
      videoEl.hidden = true;
      imgEl.hidden = false;
    });
  }

  /** Los elementos SVG no tienen .hidden → se usa el atributo. */
  _setHidden(el, hide) {
    if (hide) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  _seek(time, force = false) {
    const v = this._video;
    return new Promise((resolve) => {
      const go = () => {
        if (!force && Math.abs(v.currentTime - time) < 0.02 && v.readyState >= 2) { resolve(); return; }
        const done = () => { v.removeEventListener('seeked', done); clearTimeout(t); resolve(); };
        const t = setTimeout(done, 1500);
        v.addEventListener('seeked', done);
        v.currentTime = time;
      };
      if (v.readyState >= 1) go();
      else {
        v.addEventListener('loadedmetadata', go, { once: true });
        setTimeout(resolve, 2000);
      }
    });
  }

  /**
   * Reproduce el tramo [start, end] y lo pausa en `end`, mostrando el contorno.
   * Si el video ya está pausado dentro/al inicio del tramo (navegación hacia
   * adelante), SIGUE desde ahí: sin saltos, sin fundidos.
   * @param {{start:number,end:number}} clip
   * @param {string|null} shapeKey  clave de SHAPES
   * @param {() => boolean} isStale  true si la escena ya no está vigente
   */
  async playClip(clip, shapeKey, isStale) {
    const v = this._video;
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
    if (!this._videoOk) return;

    const t = v.currentTime;
    const continuous = !v.hidden && t >= clip.start - 0.08 && t < clip.end - 0.05;
    if (!continuous) {
      await this._seek(clip.start, true);   // salto instantáneo (solo al repetir / retroceder)
      if (isStale()) return;
    }
    this._img.hidden = true;
    v.hidden = false;

    try { await v.play(); } catch (e) { /* autoplay bloqueado */ }

    while (!isStale() && !v.paused && !v.ended && v.currentTime < clip.end) {
      await sleep(30);
    }
    if (isStale()) return;
    v.pause();
    await this._seek(clip.end, true);       // cuadro EXACTO del final
    if (isStale()) return;

    if (shapeKey && SHAPES[shapeKey]) {
      this._lesson.setAttribute('viewBox', `0 0 ${VIDEO_W} ${VIDEO_H}`);
      this._shape.setAttribute('d', SHAPES[shapeKey]);
      this._setHidden(this._lesson, false);
      this._sparkle();
    }
  }

  /** Pequeños destellos alrededor del contorno resaltado. */
  _sparkle() {
    const g = this._lesson.querySelector('#lessonSparks');
    const bb = this._shape.getBBox();
    const star = (cx, cy, r) =>
      `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;
    const pts = [
      [bb.x + bb.width + 26, bb.y + bb.height * 0.25, 22],
      [bb.x + bb.width + 8,  bb.y + bb.height * 0.78, 30],
      [bb.x + bb.width * 0.35, bb.y + bb.height + 24, 18],
    ];
    g.innerHTML = pts.map(([x, y, r], n) =>
      `<path class="spark" style="animation-delay:${n * 0.4}s" d="${star(x, y, r)}"/>`).join('');
  }

  /** Cambia a la imagen única del juego (instantáneo) y activa el SVG de zonas. */
  async showGameScene() {
    this._video.pause();
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
    if (!this._img.src.endsWith(GAME_IMAGE_SRC.replace('./', ''))) this._img.src = GAME_IMAGE_SRC;
    await new Promise((resolve) => {
      if (this._img.complete && this._img.naturalWidth > 0) { resolve(); return; }
      this._img.onload = resolve; this._img.onerror = resolve;
    });
    this._img.hidden   = false;
    this._video.hidden = true;
    this._setHidden(this._svg, false);
  }

  /** Pantalla de inicio: primer cuadro del video (o la imagen si no hay video). */
  showHome() {
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
    this._video.pause();
    if (this._videoOk) {
      this._img.hidden   = true;
      this._video.hidden = false;
      this._seek(0, true);
    } else {
      this._video.hidden = true;
      this._img.hidden   = false;
    }
  }

  /** Oculta los SVG superpuestos. */
  hideSvg() {
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
    const g = this._lesson.querySelector('#lessonSparks');
    if (g) g.innerHTML = '';
  }
}

/* ============================================================
   STATE MANAGER
   ============================================================ */

class StateManager {
  constructor() {
    this._mode  = 'welcome';
    this._zones = [...document.querySelectorAll('.zone')];
    this._epoch = 0;
  }

  get mode()  { return this._mode; }
  get epoch() { return this._epoch; }
  get zones() { return this._zones; }

  newEpoch() { return ++this._epoch; }

  show(name) {
    this._mode = name;
    ['welcome', 'lesson', 'game', 'finish'].forEach((id) => {
      $(id).hidden = id !== name;
    });
    $('controls').hidden = name === 'welcome' || name === 'finish';
    $('prev').hidden     = name === 'game';
    $('next').hidden     = name === 'game';

    // Las zonas SVG solo son interactivas en el juego
    const interactive = name === 'game';
    this._zones.forEach((z) => {
      z.setAttribute('tabindex', interactive ? '0' : '-1');
      z.setAttribute('aria-disabled', interactive ? 'false' : 'true');
      z.style.cursor = interactive ? 'pointer' : 'default';
    });
  }

  highlight(zoneId) {
    this._zones.forEach((z) => {
      z.classList.toggle('selected', z.dataset.zone === zoneId);
    });
  }

  clearHighlights() {
    this._zones.forEach((z) => z.classList.remove('selected'));
  }

  updateProgress(current, total) {
    $('dots').innerHTML = Array.from({ length: total }, (_, n) => {
      const cls = n === current ? 'current' : n < current ? 'done' : '';
      return `<span class="dot ${cls}"></span>`;
    }).join('');
  }
}

/* ============================================================
   LESSON MODE
   ============================================================ */

class LessonMode {
  constructor(audio, scene, state) {
    this._audio  = audio;
    this._scene  = scene;
    this._state  = state;
    this._index  = 0;
    this._ready  = false;
  }

  get index() { return this._index; }
  get ready()  { return this._ready; }

  async goTo(i, intro = false) {
    const token = this._reset();
    this._index = i;
    this._state.show('lesson');

    // UI inicial
    $('prev').disabled      = i === 0;
    $('next').textContent   = i === TOTAL_PARTS - 1 ? 'JUGAR →' : 'SIGUIENTE →';
    $('word').textContent   = 'MI MANO';
    $('phrase').textContent = '';
    $('count').textContent  = `${i + 1} DE ${TOTAL_PARTS}`;
    $('lessonIcon').hidden  = true;
    this._state.updateProgress(i, TOTAL_PARTS);
    this._scene.hideSvg();

    // Intro solo en la primera escena
    if (intro) await this._audio.playIntro();
    if (token !== this._state.epoch) return;

    await this._play(i, token);
  }

  /** Muestra texto, reproduce el tramo de video y el audio a la vez. */
  async _play(i, token) {
    const part = PARTS_DATA[i];
    $('word').textContent       = part.label;
    $('phrase').textContent     = part.phrase;
    $('lessonIcon').textContent = part.icon;
    $('lessonIcon').hidden      = false;
    this._ready = true;

    const stale = () => token !== this._state.epoch;
    await Promise.all([
      this._scene.playClip(part.clip, part.shape, stale),
      this._audio.playPart(part.id),
    ]);
  }

  /** Repite el tramo de video y el audio de la parte actual. */
  async repeat() {
    if (!this._ready) { this.goTo(this._index); return; }
    const token = this._reset();
    this._state.show('lesson');
    await this._play(this._index, token);
  }

  prev() { if (this._index > 0) this.goTo(this._index - 1); }

  next() {
    if (this._index < TOTAL_PARTS - 1) { this.goTo(this._index + 1); return false; }
    return true; // → iniciar juego
  }

  _reset() {
    const token = this._state.newEpoch();
    this._audio.stopAll();
    this._ready = false;
    this._state.clearHighlights();
    $('celebration').hidden = true;
    $('stage').classList.remove('encourage');
    $('lessonIcon').hidden  = true;
    return token;
  }
}

/* ============================================================
   GAME MODE
   ============================================================ */

class GameMode {
  constructor(audio, scene, state) {
    this._audio  = audio;
    this._scene  = scene;
    this._state  = state;
    this._queue  = [];
    this._turn   = 0;
    this._ready  = false;
    this._locked = false;
  }

  get ready()  { return this._ready; }
  get locked() { return this._locked; }

  async start() {
    this._audio.unlock();
    // Mostrar imagen completa para el juego
    await this._scene.showGameScene();
    this._queue  = shuffleAndPick(PARTS_DATA, GAME_QUESTIONS);
    this._turn   = 0;
    this._askQuestion();
  }

  async handleZoneClick(zoneId) {
    this._audio.unlock();
    if (!this._ready || this._locked) return;
    const token   = this._state.epoch;
    this._locked  = true;
    const current = this._queue[this._turn];
    // Acepta la zona exacta (o una parte de la mano cuando se pregunta por la mano)
    const valid = ZONE_ALIASES[current.gameZone] || [current.gameZone];
    if (valid.includes(zoneId)) {
      await this._onCorrect(token, current);
    } else {
      await this._onWrong(token);
    }
  }

  repeatQuestion() {
    if (!this._locked) this._audio.playQuestion(this._queue[this._turn].id);
  }

  _askQuestion() {
    this._resetVisuals();
    this._state.show('game');
    const current = this._queue[this._turn];
    $('question').textContent  = current.question;
    $('feedback').textContent  = '👆 TOCA EN LA IMAGEN';
    $('gameCount').textContent = `${this._turn + 1} DE ${this._queue.length}`;
    this._ready  = true;
    this._locked = false;
    this._audio.playQuestion(current.id);
  }

  async _onCorrect(token, current) {
    this._state.highlight(current.gameZone);
    $('feedback').textContent = '¡MUY BIEN!';
    $('celebration').hidden   = false;
    this._audio.stopAll();
    this._audio.playChime();

    await sleep(500);
    if (token !== this._state.epoch) return;

    await this._audio.playAnswer(current.id);
    await sleep(800);
    if (token !== this._state.epoch) return;

    this._turn++;
    if (this._turn < this._queue.length) {
      this._askQuestion();
    } else {
      this._finish();
    }
  }

  async _onWrong(token) {
    $('feedback').textContent = '¡INTENTÉMOSLO OTRA VEZ!';
    $('stage').classList.add('encourage');
    this._audio.playErrorTone();
    await this._audio.speak('Intentémoslo otra vez');
    if (token !== this._state.epoch) return;
    $('stage').classList.remove('encourage');
    $('feedback').textContent = '👆 TOCA EN LA IMAGEN';
    this._locked = false;
  }

  _finish() {
    this._resetVisuals();
    this._state.show('finish');
    this._audio.playFinish();
  }

  _resetVisuals() {
    this._state.newEpoch();
    this._audio.stopAll();
    this._ready  = false;
    this._locked = false;
    this._state.clearHighlights();
    $('celebration').hidden = true;
    $('stage').classList.remove('encourage');
  }
}

/* ============================================================
   APP — ORQUESTADOR
   ============================================================ */

class App {
  constructor() {
    this.audio  = new AudioManager();
    this.scene  = new SceneImageController(
      $('sceneImg'),
      $('sceneVideo'),
      $('sceneSvg'),
      $('lessonSvg')
    );
    this.state  = new StateManager();
    this.lesson = new LessonMode(this.audio, this.scene, this.state);
    this.game   = new GameMode(this.audio, this.scene, this.state);

    this._bindEvents();
    this.state.show('welcome');
    $('status').textContent = this.audio.getVoiceStatus();
  }

  _bindEvents() {
    // Zonas del juego
    this.state.zones.forEach((zone) => {
      const handler = () => this._onZoneClick(zone.dataset.zone);
      zone.addEventListener('click', handler);
      zone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    $('start').onclick    = () => { this.audio.unlock(); this.lesson.goTo(0, true); };
    $('prev').onclick     = () => { if (this.state.mode === 'lesson') this.lesson.prev(); };
    $('next').onclick     = () => {
      if (this.state.mode === 'lesson') { if (this.lesson.next()) this.game.start(); }
    };
    $('listen').onclick   = () => {
      this.audio.unlock();
      if (this.state.mode === 'lesson') this.lesson.repeat();
    };
    $('repeat').onclick   = () => {
      this.audio.unlock();
      if (this.state.mode === 'lesson') this.lesson.repeat();
      else if (this.state.mode === 'game') this.game.repeatQuestion();
    };
    this.scene.showHome();
    $('home').onclick     = () => {
      this.state.newEpoch();
      this.audio.stopAll();
      this.state.clearHighlights();
      $('celebration').hidden = true;
      $('lessonIcon').hidden  = true;
      this.scene.showHome();
      this.state.show('welcome');
    };
    $('again').onclick      = () => this.game.start();
    $('dictionary').onclick = () => { this.audio.unlock(); this.lesson.goTo(0, true); };

    $('sound').onclick = () => {
      const muted = this.audio.toggleMute();
      $('sound').setAttribute('aria-label', muted ? 'Activar sonido' : 'Desactivar sonido');
      $('sound').setAttribute('aria-pressed', String(!muted));
      if (!muted) {
        this.audio.unlock();
        if (this.state.mode === 'lesson' && this.lesson.ready) this.lesson.repeat();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.audio.stopAll();
    });
  }

  _onZoneClick(zoneId) {
    this.audio.unlock();
    // Las zonas solo responden en el juego
    if (this.state.mode === 'game') this.game.handleZoneClick(zoneId);
  }
}

/* ============================================================
   INICIO
   ============================================================ */
const app = new App();
