// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { window: tauriWindow, event, dpi } = API;

const appWindow = tauriWindow.getCurrentWindow();
const frame = document.querySelector('#frame');

// this is a PITA
let stateLock = false;
let state = {
  floating: false,
  titleBar: true,
  border: '#000000',
};

updateSize();
updatePosition();
appWindow.onResized(updateSize);
appWindow.onMoved(updatePosition);

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
  if (event.payload === '/frame') {
    appWindow.show();
    appWindow.setFocus();
  }
});

event.listen('state', (event) => {
  const { prop, value } = event.payload;
  renderFromState({ ...state, [prop]: value });
});

event.listen('lock', lock);
event.listen('unlock', unlock);

readState();
unlock();

async function readState() {
  const { x, y } = await appWindow.innerPosition();
  const { width, height } = await appWindow.innerSize();
  const floating = await appWindow.isAlwaysOnTop();
  const titleBar = await appWindow.isDecorated();
  state = {
    x,
    y,
    width,
    height,
    floating,
    titleBar,
  };
}

async function renderFromState(newState) {
  stateLock = true;
  // do position first
  if (newState.width || newState.height) {
    appWindow.setSize(
      new dpi.PhysicalSize({
        width: newState.width,
        height: newState.height,
      })
    );
  }

  if (newState.x || newState.y) {
    appWindow.setPosition(
      new dpi.PhysicalPosition({
        x: newState.x,
        y: newState.y,
      })
    );
  }

  document.body.style.setProperty('--border-color', newState.border);

  appWindow.setAlwaysOnTop(newState.floating);
  appWindow.setDecorations(newState.titleBar);
  state = newState;
  setTimeout(() => {
    stateLock = false;
  });
}

async function lock() {
  try {
    await appWindow.setShadow(false);
    await appWindow.setResizable(false);
    await appWindow.setIgnoreCursorEvents(true);
    delete document.querySelector('#frame').dataset.tauriDragRegion;
    document.documentElement.classList.add('locked');
  } catch (e) {
    log({ type: 'lock error', e });
  }
}

async function unlock() {
  try {
    await appWindow.setShadow(true);
    await appWindow.setResizable(true);
    await appWindow.setIgnoreCursorEvents(false);
    document.querySelector('#frame').dataset.tauriDragRegion = true;
    document.documentElement.classList.remove('locked');
  } catch (e) {
    log({ type: 'unlock error', e });
  }
}

function log(...args) {
  console.log(...args);
  event.emitTo('main', 'log', { args: args || [] });
}

async function updatePosition(event) {
  const { x, y } = await appWindow.innerPosition();
  state.x = x;
  state.y = y;
  sendState();
}

async function updateSize() {
  const { width, height } = await appWindow.innerSize();
  state.width = width;
  state.height = height;
  sendState();
}

function sendState() {
  if (stateLock) return;
  event.emitTo('main', 'stateRefresh', state);
}
