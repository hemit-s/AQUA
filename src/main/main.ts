/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import ChannelEnum from '../common/channels';
import {
  getPeaceWindowHandle,
  isPeaceRunning,
  sendPeaceCommand,
} from '../common/peaceIPC';
import { fetch, flush, IState, save } from './flush';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import registry from './registry';
import { ErrorCode } from '../common/errors';
import { TSuccess, TError } from '../renderer/equalizerApi';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const state: IState = fetch();

ipcMain.on('peace', async (event, arg) => {
  const channel: string = arg[0];
  const peaceInstalled = await registry.isPeaceInstalled();
  if (!peaceInstalled) {
    const reply: TError = { errorCode: ErrorCode.PEACE_NOT_INSTALLED };
    event.reply(channel, reply);
    return;
  }

  const peaceHWnd = getPeaceWindowHandle();
  const foundPeace = isPeaceRunning(peaceHWnd);

  if (!foundPeace) {
    const reply: TError = { errorCode: ErrorCode.PEACE_NOT_RUNNING };
    event.reply(channel, reply);
    return;
  }

  const messageCode = parseInt(arg[1], 10) || 0;
  const wParam = parseInt(arg[2], 10) || 0;
  const lParam = parseInt(arg[3], 10) || 0;

  // Send message to Peace
  const res = sendPeaceCommand(peaceHWnd, messageCode, wParam, lParam);
  if (res === 4294967295) {
    const reply: TError = { errorCode: ErrorCode.PEACE_NOT_READY };
    event.reply(channel, reply);
    return;
  }
  const reply: TSuccess = { result: res };
  event.reply(channel, reply);
});

const handleUpdate = (event: Electron.IpcMainEvent, channel: ChannelEnum) => {
  console.log(state);
  flush(state);
  const reply: TSuccess = { result: 1 };
  event.reply(channel, reply);
  save(state);
};

ipcMain.on(ChannelEnum.GET_ENABLE, async (event) => {
  const reply: TSuccess = { result: state.isEnabled ? 1 : 0 };
  event.reply(ChannelEnum.GET_ENABLE, reply);
});

ipcMain.on(ChannelEnum.SET_ENABLE, async (event, arg) => {
  const value = parseInt(arg[0], 10) || 0;
  state.isEnabled = value !== 0;
  handleUpdate(event, ChannelEnum.SET_ENABLE);
});

ipcMain.on(ChannelEnum.GET_PREAMP, async (event) => {
  const reply: TSuccess = { result: state.preAmp || 0 };
  event.reply(ChannelEnum.GET_PREAMP, reply);
});

ipcMain.on(ChannelEnum.SET_PREAMP, async (event, arg) => {
  const gain = parseInt(arg[0], 10) || 0;
  state.preAmp = gain;
  handleUpdate(event, ChannelEnum.SET_PREAMP);
});

ipcMain.on(ChannelEnum.GET_GAIN, async (event, arg) => {
  const filterIndex = parseInt(arg[0], 10) || 0;

  if (filterIndex >= state.filters.length) {
    const reply: TError = { errorCode: ErrorCode.PEACE_UNKNOWN_ERROR };
    event.reply(ChannelEnum.SET_GAIN, reply);
    return;
  }

  const reply: TSuccess = { result: state.filters[filterIndex].gain || 0 };
  event.reply(ChannelEnum.GET_GAIN, reply);
});

ipcMain.on(ChannelEnum.SET_GAIN, async (event, arg) => {
  const filterIndex = parseInt(arg[0], 10) || 0;
  const gain = parseInt(arg[1], 10) || 0;

  if (filterIndex >= state.filters.length) {
    const reply: TError = { errorCode: ErrorCode.PEACE_UNKNOWN_ERROR };
    event.reply(ChannelEnum.SET_GAIN, reply);
    return;
  }
  state.filters[filterIndex].gain = gain;
  handleUpdate(event, ChannelEnum.SET_GAIN);
});

ipcMain.on('quit-app', () => {
  app.quit();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createMainWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    minWidth: 1024,
    height: 728,
    minHeight: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  mainWindow.webContents.openDevTools();

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createMainWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createMainWindow();
      }
    });
  })
  .catch(console.log);
