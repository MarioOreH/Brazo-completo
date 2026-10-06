/**
 * @fileoverview Diccionario Digital Interactivo de la Mano
 *
 * LECCIÓN (5 escenas) → usa tramos del video assets/video/manooos.mp4.
 * Cada tramo se reproduce y se PAUSA en el fotograma final; ahí aparece
 * el contorno resaltado de la parte (coordenadas del video: 864 x 496).
 *
 *   MANO   0.00 – 0.62 s  plano general
 *   DEDOS  2.30 – 2.80 s  palma abierta (dedos + pulgar)
 *   PALMA  2.55 – 2.80 s  palma abierta (centro de la mano)
 *   SUAVE  2.92 – 4.05 s  mano sobre el peluche
 *   ÁSPERO 0.70 – 1.75 s  dedos sobre la lija
 *
 * JUEGO → una sola imagen (assets/images/mano.jpg) con zonas SVG tocables.
 *
 * @version 3.0.0
 */

'use strict';

/* ============================================================
   DATOS EDUCATIVOS
   ============================================================ */

const AUDIO_BASE = './assets/audios/';

/** Tamaño del video (sistema de coordenadas de los contornos). */
const VIDEO_W = 864, VIDEO_H = 496;

/** Contornos (path SVG) en coordenadas del video. */
const SHAPES = {
  manoAbierta: 'M392 318 L430 270 L500 272 L535 300 L562 322 L558 332 L525 322 L555 350 L598 405 L595 415 L578 450 L552 466 L520 440 L490 440 L470 440 L445 415 L425 380 L400 345 Z',
  dedos:       'M525 205 L600 225 L700 240 L765 270 L770 295 L740 303 L755 320 L750 345 L700 360 L690 375 L670 395 L600 400 L570 420 L535 430 L450 437 L390 420 L380 385 L420 360 L470 325 L505 285 Z ' +
               'M330 62 L420 48 L520 45 L600 52 L605 75 L580 100 L520 122 L445 130 L400 110 L360 85 Z',
  palma:       'M150 200 L210 110 L300 75 L390 100 L440 145 L505 180 L525 215 L505 285 L470 325 L420 360 L380 385 L300 375 L210 320 L150 265 Z',
  peluche:     'M105 360 L150 300 L340 285 L380 140 L500 118 L555 50 L640 100 L700 85 L790 65 L864 95 L864 496 L130 496 L105 420 Z',
  lija:        'M283 345 L558 198 L795 437 L398 492 Z',
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
    clip: { start: 0.00, end: 0.62 }, shape: 'manoAbierta', gameZone: 'mano',
  },
  {
    id: 'dedos', label: 'DEDOS', icon: '🖐️',
    phrase:   'Estos son mis dedos. Mis dedos se pueden mover.',
    question: '¿Dónde están los dedos?',
    answer:   '¡Muy bien! Estos son los dedos.',
    clip: { start: 2.30, end: 2.80 }, shape: 'dedos', gameZone: 'dedos',
  },
  {
    id: 'palma', label: 'PALMA', icon: '🤚',
    phrase:   'Esta es la palma de mi mano.',
    question: '¿Dónde está la palma?',
    answer:   '¡Muy bien! Esta es la palma.',
    clip: { start: 2.55, end: 2.80 }, shape: 'palma', gameZone: 'palma',
  },
  {
    id: 'suave', label: 'SUAVE', icon: '🧸',
    phrase:   'El algodón se siente suave.',
    question: '¿Cuál es el objeto suave?',
    answer:   '¡Muy bien! El peluche es suave.',
    clip: { start: 2.92, end: 4.05 }, shape: 'peluche', gameZone: 'suave',
  },
  {
    id: 'aspero', label: 'ÁSPERO', icon: '🟫',
    phrase:   'El cartón se siente áspero.',
    question: '¿Cuál es el objeto áspero?',
    answer:   '¡Muy bien! La lija es áspera.',
    clip: { start: 0.70, end: 1.75 }, shape: 'lija', gameZone: 'aspero',
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
    videoEl.addEventListener('error', () => { this._videoOk = false; });
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
   * Reproduce el tramo [start, end] del video y lo pausa en `end`.
   * Al pausar muestra el contorno de la parte.
   * @param {{start:number,end:number}} clip
   * @param {string|null} shapeKey  clave de SHAPES
   * @param {() => boolean} isStale  true si la escena ya no está vigente
   */
  async playClip(clip, shapeKey, isStale) {
    const v = this._video;
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);

    // Fade out → cambiar a video
    this._img.classList.add('fading');
    v.classList.add('fading');
    await sleep(250);
    if (isStale()) return;

    if (!this._videoOk) {            // sin video: se queda la imagen del juego
      this._img.classList.remove('fading');
      return;
    }
    v.pause();
    this._img.hidden = true;
    v.hidden = false;
    await this._seek(clip.start);
    if (isStale()) return;
    v.classList.remove('fading');

    try { await v.play(); } catch (e) { /* autoplay bloqueado: se queda en el primer cuadro */ }

    // Esperar hasta el final del tramo
    while (!isStale() && !v.paused && !v.ended && v.currentTime < clip.end) {
      await sleep(30);
    }
    if (isStale()) return;
    v.pause();
    // Fijar el cuadro EXACTO del final (el cuadro mostrado puede ir 1-2 cuadros atrasado)
    await this._seek(clip.end, true);
    if (isStale()) return;

    // Contorno de la parte sobre el cuadro pausado
    if (shapeKey && SHAPES[shapeKey]) {
      this._lesson.setAttribute('viewBox', `0 0 ${VIDEO_W} ${VIDEO_H}`);
      this._shape.setAttribute('d', SHAPES[shapeKey]);
      this._setHidden(this._lesson, false);
    }
  }

  /** Muestra la imagen única del juego y activa el SVG de zonas. */
  async showGameScene() {
    this._video.pause();
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
    this._img.classList.add('fading');
    await sleep(250);
    this._video.hidden = true;
    this._img.hidden   = false;
    if (!this._img.src.endsWith(GAME_IMAGE_SRC.replace('./', ''))) this._img.src = GAME_IMAGE_SRC;
    await new Promise((resolve) => {
      if (this._img.complete && this._img.naturalWidth > 0) { resolve(); return; }
      this._img.onload = resolve; this._img.onerror = resolve;
    });
    this._img.classList.remove('fading');
    this._setHidden(this._svg, false);
  }

  /** Vuelve a la imagen (inicio) y oculta los contornos. */
  showHome() {
    this._video.pause();
    this._video.hidden = true;
    this._img.hidden   = false;
    this._img.classList.remove('fading');
    this.hideSvg();
  }

  /** Oculta los SVG superpuestos. */
  hideSvg() {
    this._setHidden(this._svg, true);
    this._setHidden(this._lesson, true);
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
    else       await sleep(300);
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
    $('repeat').onclick   = () => {
      this.audio.unlock();
      if (this.state.mode === 'lesson') this.lesson.repeat();
      else if (this.state.mode === 'game') this.game.repeatQuestion();
    };
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
      $('sound').textContent = muted ? '🔇' : '🔊';
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
