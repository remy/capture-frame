// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { window: tauriWindow, event, dpi } = API;

const appWindow = tauriWindow.getCurrentWindow();
const frame = document.querySelector('#frame');

const state = {
  x: 100,
  y: 100,
  width: 1280,
  height: 720,
  locked: false,
  floating: false,
  titleBar: true,
};

updateSize();
updatePosition();
appWindow.onResized(updateSize);
appWindow.onMoved(updatePosition);

appWindow.onCloseRequested(async (event) => {
  event.preventDefault(); // don't close
});

event.listen('state', (event) => {
  const { payload } = event;
  if (payload.locked) {
    lock();
  } else {
    unlock();
  }

  frame.dataset.floating = payload.floating;
  frame.dataset.titleBar = payload.titleBar;
});

event.listen('xy', (event) => {
  appWindow.setPosition(new dpi.PhysicalPosition(event.payload));
});

event.listen('dims', (event) => {
  appWindow.setSize(new dpi.PhysicalSize(event.payload));
});

event.listen('lock', lock);
event.listen('unlock', unlock);

unlock();

async function lock() {
  try {
    await appWindow.setAlwaysOnTop(true);
    await appWindow.setShadow(false);
    await appWindow.setResizable(false);
    await appWindow.setDecorations(false);
    await appWindow.setIgnoreCursorEvents(true);
    delete document.querySelector('#frame').dataset.tauriDragRegion;
  } catch (e) {
    log({ type: 'lock error', e });
  }
}

async function unlock() {
  try {
    await appWindow.setAlwaysOnTop(false);
    await appWindow.setShadow(true);
    await appWindow.setDecorations(false);
    await appWindow.setResizable(true);
    await appWindow.setIgnoreCursorEvents(false);
    document.querySelector('#frame').dataset.tauriDragRegion = true;
  } catch (e) {
    log({ type: 'unlock error', e });
  }
}

function log(...args) {
  console.log(...args);
  event.emitTo('main', 'log', { args: args || [] });
}

async function updatePosition() {
  event.emitTo('main', 'position', await appWindow.innerPosition());
}

async function updateSize() {
  event.emitTo('main', 'resize', await appWindow.innerSize());
}
