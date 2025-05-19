// when using `"withGlobalTauri": true`, you may use
const { event, window: tauriWindow, webview } = window.__TAURI__;
const { exit } = window.__TAURI__.process;

const appWindow = tauriWindow.getCurrentWindow();

let locked = false;

const $ = (s) => document.querySelector(s);

const $width = $('#width');
const $height = $('#height');
const $frame = $('#frame');
const $button = $('button');
const $x = $('#x');
const $y = $('#y');

appWindow.onCloseRequested(async (event) => {
  exit();
});

$button.addEventListener(
  'click',
  () => {
    locked = !locked;
    event.emitTo('frame', 'lock', { locked });
    document.body.classList.toggle('locked', locked);
    $button.textContent = locked ? 'Unlock' : 'Lock';
  },
  false
);

event.listen('resize', (event) => {
  const { width, height } = event.payload;
  console.log({ width, height });
  $width.value = width;
  $height.value = height;
});

event.listen('resize', (event) => {
  const { width, height } = event.payload;
  console.log({ width, height });
  $width.value = width;
  $height.value = height;
});

event.listen('position', (event) => {
  const { x, y } = event.payload;
  console.log({ x, y });
  $x.value = x;
  $y.value = y;
});

event.listen('log', (event) => {
  const { args } = event.payload;
  console.log('frame', ...args);
});
