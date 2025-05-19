// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { window: tauriWindow, event, dpi } = API;
const appWindow = tauriWindow.getCurrentWindow();
const frame = document.querySelector('#frame');

function log(...args) {
  event.emitTo('main', 'log', { args: args || [] });
}

// capture width and height on a window resize and initial load
let width = 0;
let height = 0;

let x = 0;
let y = 0;

async function updatePosition() {
  const res = await appWindow.innerPosition();
  x = res.x;
  y = res.y;

  event.emitTo('main', 'position', { x, y });
}

async function updateSize() {
  const res = await appWindow.innerSize();
  width = res.width;
  height = res.height;

  event.emitTo('main', 'resize', { width, height });
}
updateSize();
updatePosition();
appWindow.onResized(updateSize);
appWindow.onMoved(updatePosition);

appWindow.onCloseRequested(async (event) => {
  event.preventDefault(); // don't close
});

event.listen('lock', async (event) => {
  const { locked } = event.payload;
  // event.emitTo('main', 'lock', { type: 'lock', locked });
  log('lock event', locked);

  // updateSize({ payload: await appWindow.innerSize() });
  if (locked) {
    lock()
      .catch((e) => {
        log({ type: 'lock error', e });
      })
      .then(() => {
        log('locked complete');
      });
  } else {
    unlock()
      .catch((e) => {
        log({ type: 'unlock error', e });
      })
      .then(() => {
        log('unlocked complete');
      });
  }
});

async function lock() {
  await appWindow.setAlwaysOnTop(true);
  await appWindow.setShadow(false);
  // await appWindow.setMaxSize(new dpi.PhysicalSize({ height, width }));
  // await appWindow.setMinSize(new dpi.PhysicalSize({ height, width }));
  await appWindow.setResizable(false);
  await appWindow.setDecorations(false);
  await appWindow.setIgnoreCursorEvents(true);
  delete document.querySelector('#frame').dataset.tauriDragRegion;
}

async function unlock() {
  await appWindow.setAlwaysOnTop(false);
  await appWindow.setShadow(true);
  await appWindow.setDecorations(true);
  // await appWindow.setMinSize(null);
  // await appWindow.setMaxSize(null);
  await appWindow.setResizable(true);
  await appWindow.setIgnoreCursorEvents(false);
  document.querySelector('#frame').dataset.tauriDragRegion = true;
}

unlock();
