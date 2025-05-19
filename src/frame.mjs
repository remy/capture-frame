// when using `"withGlobalTauri": true`, you may use
const API = window.__TAURI__;
const { getCurrentWindow, event, dpi } = API;
const appWindow = getCurrentWindow();

const frame = document.querySelector('#frame');

function log(...args) {
  event.emitTo('main', 'log', { args: args || [] });
}

// capture W and H on a window resize and initial load
let W = 0;
let H = 0;
async function updateSize() {
  const res = await appWindow.innerSize();
  W = res.width;
  H = res.height;

  log({ type: 'resize', res });
}
updateSize();
appWindow.onResized(updateSize);

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
  await appWindow.setMinSize({ Physical: { width: W, height: H } });
  await appWindow.setMaxSize({ new dpi.Size({ width: W, height: H }) });
  log('locked', true);
  delete document.querySelector('#frame').dataset.tauriDragRegion;
}

async function unlock() {
  await appWindow.setAlwaysOnTop(false);
  await appWindow.setShadow(true);
  await appWindow.setMinSize(null);
  await appWindow.setMaxSize(null);
  document.querySelector('#frame').dataset.tauriDragRegion = true;
  log('unlocked', true);
}

unlock();
