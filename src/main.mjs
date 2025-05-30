import Cycle from './Cycle.mjs';

// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { event, window: tauriWindow, webview, process, menu } = API;

const store = await API.store.load('store.json', { autoSave: true });

let locked = false;

const appWindow = tauriWindow.getCurrentWindow();
const $frame = $('#frame');
const $button = $('button');
const $x = $('#x');
const $y = $('#y');
const x = new Cycle($x);
const y = new Cycle($y);
const $width = $('#width');
const $height = $('#height');
const width = new Cycle($width);
const height = new Cycle($height);
const $border = $('#border');

const $titleBar = $('#titleBar');
const $floating = $('#floating');

const _border = await store.get('border');
const _floating = await store.get('floating');
const _titleBar = await store.get('titleBar');

console.log({ _floating, _titleBar, _border });

let state = {
  x: 100,
  y: 100,
  width: 1280,
  height: 720,
  floating: _floating,
  titleBar: _titleBar,
  border: _border || '#ff0000',
};

x.onUpdate = () => updateState('x', x.value);
y.onUpdate = () => updateState('y', y.value);
width.onUpdate = () => updateState('width', width.value);
height.onUpdate = () => updateState('height', height.value);
$titleBar.onchange = async () => {
  updateState('titleBar', $titleBar.checked);
  await store.set('titleBar', $titleBar.checked);
};
$floating.onchange = async () => {
  updateState('floating', $floating.checked);
  await store.set('floating', $floating.checked);
};
$border.onchange = async () => {
  // modify --border-color on body to $border.value
  document.body.style.setProperty('--border-color', $border.value);
  updateState('border', $border.value);
  await store.set('border', $border.value);
};

$border.value = state.border;
$titleBar.checked = state.titleBar;
$floating.checked = state.floating;
$titleBar.onchange();
$floating.onchange();
$border.onchange();

$button.addEventListener(
  'click',
  () => {
    if (locked) {
      unlock();
    } else {
      lock();
    }
  },
  false
);

appWindow.onCloseRequested((event) => {
  event.preventDefault(); // don't close
  appWindow.hide();
});

event.listen('menu-event', async (event) => {
  if (event.payload === '/close') {
    if (await appWindow.isFocused()) {
      appWindow.close();
    }
  }
  if (event.payload === '/config') {
    appWindow.show();
    appWindow.setFocus();
  }
});

event.listen('stateRefresh', (event) => {
  console.log('refreshing state', event.payload);

  const newState = event.payload;
  width.setValue(newState.width, false);
  height.setValue(newState.height, false);
  x.setValue(newState.x, false);
  y.setValue(newState.y, false);

  // update floating and titleBar
  $floating.checked = newState.floating;
  $titleBar.checked = newState.titleBar;

  state = newState;
});

event.listen('log', (event) => {
  const { args } = event.payload;
  console.log('frame', ...args);
});

function lock() {
  locked = true;
  event.emitTo('frame', 'lock');
  $button.textContent = 'Unlock';
  document.body.classList.add('locked');
  $x.disabled = true;
  $y.disabled = true;
  $width.disabled = true;
  $height.disabled = true;
  $titleBar.disabled = true;
  $floating.disabled = true;
}

function unlock() {
  locked = false;
  event.emitTo('frame', 'unlock');
  $button.textContent = 'Lock';
  document.body.classList.remove('locked');
  $x.disabled = false;
  $y.disabled = false;
  $width.disabled = false;
  $height.disabled = false;
  $titleBar.disabled = false;
  $floating.disabled = false;
}

function updateState(prop, value) {
  state[prop] = value;
  appWindow.emitTo('frame', 'state', { prop, value });
}

function $(selector) {
  return document.querySelector(selector);
}
