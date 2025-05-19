// when using `"withGlobalTauri": true`, you may use
const { getCurrentWindow } = window.__TAURI__.window;
const { event } = window.__TAURI__;
const appWindow = getCurrentWindow();

let locked = false;

const button = document.querySelector('button');
button.addEventListener(
  'click',
  () => {
    console.log('Button clicked');
    locked = !locked;
    event.emitTo('frame', 'lock', { locked });
    document.body.classList.toggle('locked', locked);
    button.textContent = locked ? 'Unlock' : 'Lock';
  },
  false
);

event.listen('log', (event) => {
  const { args } = event.payload;
  console.log('frame', ...args);
});
