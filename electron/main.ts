import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type WindowBoundsPayload = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type InteractiveRegionPayload = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMac = process.platform === 'darwin';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let interactiveRegions: InteractiveRegionPayload[] = [];
let clickThroughManaged = false;
let forceInteractive = false;
let isIgnoringMouseEvents = false;
let clickThroughTimer: NodeJS.Timeout | null = null;
const SAVE_FILE_NAME = 'save-data.json';
const DESKTOP_PREFERENCES_FILE_NAME = 'desktop-preferences.json';

function getWorkArea() {
  return screen.getPrimaryDisplay().workArea;
}

function getDesktopDataPath(fileName: string) {
  return path.join(app.getPath('userData'), fileName);
}

function readJsonFile<T>(fileName: string): T | null {
  try {
    const raw = fs.readFileSync(getDesktopDataPath(fileName), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(fileName: string, data: unknown) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(getDesktopDataPath(fileName), JSON.stringify(data), 'utf-8');
}

function clampBounds(bounds: WindowBoundsPayload): WindowBoundsPayload {
  const workArea = getWorkArea();
  const width = Math.min(Math.max(Math.round(bounds.width), 140), workArea.width);
  const height = Math.min(Math.max(Math.round(bounds.height), 120), workArea.height);
  const x = Math.min(
    Math.max(Math.round(bounds.x), workArea.x),
    workArea.x + workArea.width - width
  );
  const y = Math.min(
    Math.max(Math.round(bounds.y), workArea.y),
    workArea.y + workArea.height - height
  );

  return { x, y, width, height };
}

function isCursorInsideInteractiveRegion(): boolean {
  if (!mainWindow || interactiveRegions.length === 0) {
    return false;
  }

  const cursor = screen.getCursorScreenPoint();
  const bounds = mainWindow.getBounds();
  const relativeX = cursor.x - bounds.x;
  const relativeY = cursor.y - bounds.y;

  return interactiveRegions.some((region) => {
    return (
      relativeX >= region.x &&
      relativeX <= region.x + region.width &&
      relativeY >= region.y &&
      relativeY <= region.y + region.height
    );
  });
}

function applyIgnoreMouseEvents(ignore: boolean) {
  if (!mainWindow || isIgnoringMouseEvents === ignore) {
    return;
  }

  mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  isIgnoringMouseEvents = ignore;
}

function refreshMousePassthrough() {
  if (!mainWindow) {
    return;
  }

  if (!clickThroughManaged) {
    applyIgnoreMouseEvents(false);
    return;
  }

  const shouldIgnore = !forceInteractive && !isCursorInsideInteractiveRegion();
  applyIgnoreMouseEvents(shouldIgnore);
}

function startClickThroughMonitor() {
  if (clickThroughTimer) {
    return;
  }

  clickThroughTimer = setInterval(() => {
    refreshMousePassthrough();
  }, 70);
}

function stopClickThroughMonitor() {
  if (!clickThroughTimer) {
    return;
  }

  clearInterval(clickThroughTimer);
  clickThroughTimer = null;
}

async function createMainWindow() {
  const workArea = getWorkArea();

  mainWindow = new BrowserWindow({
    width: 240,
    height: 190,
    x: workArea.x + 28,
    y: workArea.y + workArea.height - 190 - 18,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    stopClickThroughMonitor();
    mainWindow = null;
    interactiveRegions = [];
    clickThroughManaged = false;
    forceInteractive = false;
    isIgnoringMouseEvents = false;
  });
}

function sendQuickAction(action: string) {
  mainWindow?.webContents.send('desktop:quick-action', action);
  if (!mainWindow?.isVisible()) {
    mainWindow?.showInactive();
  }
}

function createTray() {
  const iconPath = path.join(app.getAppPath(), 'public', 'sprites', 'cat.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon.resize({ width: 20, height: 20 }));
  tray.setToolTip('AI Coding Pet');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示宠物',
      click: () => {
        mainWindow?.show();
        sendQuickAction('show-window');
      }
    },
    {
      label: '展开照顾面板',
      click: () => sendQuickAction('toggle-panel')
    },
    {
      label: '喂食',
      click: () => sendQuickAction('feed')
    },
    {
      label: '玩耍',
      click: () => sendQuickAction('play')
    },
    {
      label: '清洁',
      click: () => sendQuickAction('clean')
    },
    {
      label: '休息',
      click: () => sendQuickAction('rest')
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    sendQuickAction('toggle-panel');
  });
}

ipcMain.handle('desktop:get-metrics', () => {
  const workArea = getWorkArea();
  const primaryDisplay = screen.getPrimaryDisplay();

  return {
    screenWidth: workArea.width,
    screenHeight: workArea.height,
    scaleFactor: primaryDisplay.scaleFactor
  };
});

ipcMain.handle('desktop:update-window', (_event, bounds: WindowBoundsPayload) => {
  if (!mainWindow) {
    return;
  }

  mainWindow.setBounds(clampBounds(bounds), false);
  refreshMousePassthrough();
});

ipcMain.handle('desktop:show-window', () => {
  mainWindow?.show();
  mainWindow?.focus();
});

ipcMain.on('desktop:read-save-data', (event) => {
  event.returnValue = readJsonFile(SAVE_FILE_NAME);
});

ipcMain.on('desktop:write-save-data', (event, saveData: unknown) => {
  writeJsonFile(SAVE_FILE_NAME, saveData);
  event.returnValue = true;
});

ipcMain.on('desktop:read-desktop-preferences', (event) => {
  event.returnValue = readJsonFile(DESKTOP_PREFERENCES_FILE_NAME);
});

ipcMain.on('desktop:write-desktop-preferences', (event, preferences: unknown) => {
  writeJsonFile(DESKTOP_PREFERENCES_FILE_NAME, preferences);
  event.returnValue = true;
});

ipcMain.handle(
  'desktop:set-ignore-mouse-events',
  (_event, ignore: boolean, options?: { forward?: boolean }) => {
    if (!mainWindow) {
      return;
    }

    clickThroughManaged = false;
    forceInteractive = false;
    interactiveRegions = [];
    mainWindow.setIgnoreMouseEvents(ignore, options);
    isIgnoringMouseEvents = ignore;
  }
);

ipcMain.handle(
  'desktop:set-interactive-regions',
  (_event, regions: InteractiveRegionPayload[]) => {
    interactiveRegions = regions
      .filter((region) => region.width > 0 && region.height > 0)
      .map((region) => ({
        x: Math.round(region.x),
        y: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height)
      }));
    clickThroughManaged = interactiveRegions.length > 0;
    startClickThroughMonitor();
    refreshMousePassthrough();
  }
);

ipcMain.handle('desktop:set-dragging', (_event, dragging: boolean) => {
  forceInteractive = dragging;
  refreshMousePassthrough();
});

app.whenReady().then(async () => {
  await createMainWindow();
  createTray();
  startClickThroughMonitor();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  stopClickThroughMonitor();
  if (!isMac) {
    app.quit();
  }
});
