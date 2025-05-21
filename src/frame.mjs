// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { window: tauriWindow, event, dpi } = API;
const store = await API.store.load('store.json', { autoSave: true });

const appWindow = tauriWindow.getCurrentWindow();
const frame = document.querySelector('#frame');

const frameWidth = 8;

const _border = await store.get('border');
const _floating = await store.get('floating');
const _titleBar = await store.get('titleBar');

// this is a PITA
let stateLock = false;
let state = {
  floating: _floating,
  titleBar: _titleBar,
  border: _border,
};

updateSize();
updatePosition();

readState();
unlock();

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
  console.log('setting state', prop, value);
  renderFromState({ ...state, [prop]: value });
});

event.listen('lock', lock);
event.listen('unlock', unlock);

async function readState() {
  const { x, y } = await appWindow.innerPosition();
  const { width, height } = await appWindow.innerSize();
  const floating = await appWindow.isAlwaysOnTop();
  const titleBar = await appWindow.isDecorated();
  state = {
    ...state,
    ...{
      x: x + frameWidth,
      y: y + frameWidth,
      width: width - frameWidth * 2,
      height: height - frameWidth * 2,
    },
  };

  document.body.style.setProperty('--border-color', state.border);
}

async function renderFromState(newState) {
  stateLock = true;
  // do position first
  if (newState.width || newState.height) {
    appWindow.setSize(
      new dpi.PhysicalSize({
        width: newState.width + frameWidth * 2,
        height: newState.height + frameWidth * 2,
      })
    );
  }

  if (newState.x || newState.y) {
    appWindow.setPosition(
      new dpi.PhysicalPosition({
        x: newState.x - frameWidth,
        y: newState.y - frameWidth,
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
  state.x = x + frameWidth;
  state.y = y + frameWidth;
  sendState();
}

async function updateSize() {
  const { width, height } = await appWindow.innerSize();
  state.width = width - frameWidth * 2;
  state.height = height - frameWidth * 2;
  sendState();
}

function sendState() {
  if (stateLock) return;
  event.emitTo('main', 'stateRefresh', state);
}
