import Cycle from './Cycle.mjs';

// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { event, window: tauriWindow, webview, process, menu } = API;

let locked = false;

const appWindow = tauriWindow.getCurrentWindow();
const $width = $('#width');
const $height = $('#height');
const $frame = $('#frame');
const $button = $('button');
const $x = $('#x');
const $y = $('#y');
const x = new Cycle($x);
const y = new Cycle($y);
const width = new Cycle($width);
const height = new Cycle($height);

const state = {
  x: 100,
  y: 100,
  width: 1280,
  height: 720,
  locked: false,
  floating: false,
  titleBar: true,
};

x.onUpdate = updateFramePosition('xy');
y.onUpdate = updateFramePosition('xy');
width.onUpdate = updateFramePosition('dims');
height.onUpdate = updateFramePosition('dims');

$button.addEventListener(
  'click',
  () => {
    locked = !locked;
    event.emitTo('frame', locked ? 'lock' : 'unlock');
    $button.textContent = locked ? 'Unlock' : 'Lock';
    document.body.classList.toggle('locked', locked);
  },
  false
);

event.listen('resize', (event) => {
  width.setValue(event.payload.width);
  height.setValue(event.payload.height);
});

event.listen('position', (event) => {
  x.setValue(event.payload.x);
  y.setValue(event.payload.y);
});

event.listen('log', (event) => {
  const { args } = event.payload;
  console.log('frame', ...args);
});

function updateState(prop, value) {
  state[prop] = value;
  appWindow.emitTo('frame', 'state', { prop, value });
}

function $(selector) {
  return document.querySelector(selector);
}

function updateFramePosition(type) {
  return () => {
    if (type === 'xy') {
      appWindow.emitTo('frame', 'xy', { x: x.value, y: y.value });
    } else if (type === 'dims') {
      appWindow.emitTo('frame', 'dims', {
        width: width.value,
        height: height.value,
      });
    }
  };
}
