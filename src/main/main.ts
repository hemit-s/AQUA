/*
<AQUA: System-wide parametric audio equalizer interface>
Copyright (C) <2023>  <AQUA Dev Team>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import {
  checkConfigFilePath,
  fetchSettings,
  flush,
  save,
  updateConfigFilePath,
  savePreset,
  fetchPreset,
  renamePreset,
  doesPresetExist,
  PRESETS_DIR,
  deletePreset,
} from './flush';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { getConfigPath, isEqualizerAPOInstalled } from './registry';
import ChannelEnum from '../common/channels';
import {
  FilterTypeEnum,
  IState,
  IPresetV2,
  IFilter,
  MAX_FREQUENCY,
  MAX_GAIN,
  MAX_NUM_FILTERS,
  MAX_QUALITY,
  MIN_FREQUENCY,
  MIN_GAIN,
  MIN_NUM_FILTERS,
  MIN_QUALITY,
  WINDOW_HEIGHT,
  WINDOW_HEIGHT_EXPANDED,
  WINDOW_WIDTH,
  getDefaultFilterWithId,
  FixedBandSizeEnum,
  getDefaultFilters,
  IFiltersMap,
  DEFAULT_CONFIG_FILENAME,
} from '../common/constants';
import { ErrorCode } from '../common/errors';
import {
  isFixedBandSizeEnumValue,
  isRestrictedPresetName,
} from '../common/utils';
import { TSuccess, TError } from '../renderer/utils/equalizerApi';
import {
  getAutoEqDeviceList,
  getAutoEqPreset,
  getAutoEqResponseList,
} from './autoeq';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const setWindowDimension = (isExpanded: boolean) => {
  if (mainWindow) {
    const currWidth = mainWindow.getSize()[0];
    const currHeight = mainWindow.getSize()[1];
    if (isExpanded) {
      mainWindow.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED);
      mainWindow.setSize(
        currWidth,
        Math.max(currHeight, WINDOW_HEIGHT_EXPANDED)
      );
    } else {
      mainWindow.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT);
      mainWindow.setSize(currWidth, WINDOW_HEIGHT);
    }
  }
};

/** ----- Equalizer APO Implementation ----- */

// Load initial state from local state file
const userDataDir = app.getPath('userData');
const presetPath = path.join(userDataDir, PRESETS_DIR);
const state: IState = fetchSettings(userDataDir);
let equalizerApoConfigPath = '';

try {
  // create presets dir if it doesn't exist
  if (!fs.existsSync(presetPath)) {
    fs.mkdirSync(presetPath);
  }
} catch (e) {
  console.error('Failed to make presets directory!!');
  console.error(e);
  throw e;
}

// spawn child process to update presets folder so that it can support case-sensitive files
exec(
  `fsutil.exe file SetCaseSensitiveInfo "${presetPath}"`,
  (err, stdout, stderr) => {
    // Error handling should occur in this callback function
    if (err) {
      console.error(err.message.trim());
      console.error(stdout.trim());
      console.error(stderr.trim());
      return;
    }

    // Set case sensitive to true if an error was not thrown
    state.isCaseSensitiveFs = true;
  }
);

const retryHelper = async (attempts: number, f: () => unknown) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await f();
      return;
    } catch (e) {
      if (i === attempts) {
        throw new Error(`Failed to perform action after ${attempts} retrires`);
      }
      // TODO: maybe add a backoff here?
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }
  }
};

const handleError = (
  event: Electron.IpcMainEvent,
  channel: ChannelEnum | string,
  errorCode: ErrorCode
) => {
  const reply: TError = { errorCode };
  console.log(`Error code ${errorCode} detected on channel ${channel}`);
  event.reply(channel, reply);
};

const updateConfigPath = async (
  event: Electron.IpcMainEvent,
  channel: ChannelEnum | string
) => {
  try {
    // Fetch and set the equalizerApoConfigPath so we can edit aqua.txt
    equalizerApoConfigPath = await getConfigPath();

    if (!state.configFilePath) {
      // Retrive configPath assuming EqualizerAPO is installed
      state.configFilePath = path.join(
        equalizerApoConfigPath,
        DEFAULT_CONFIG_FILENAME
      );
    }

    // Overwrite the config file if necessary
    if (!checkConfigFilePath(state.configFilePath)) {
      updateConfigFilePath(state.configFilePath);
    }
  } catch (e) {
    handleError(event, channel, ErrorCode.CONFIG_NOT_FOUND);
    return false;
  }
  return true;
};

const handleUpdateHelper = async <T>(
  event: Electron.IpcMainEvent,
  channel: ChannelEnum | string,
  response: T
) => {
  // Check whether EqualizerAPO is installed every time a change is made
  const isInstalled = await isEqualizerAPOInstalled();
  if (!isInstalled) {
    handleError(event, channel, ErrorCode.EQUALIZER_APO_NOT_INSTALLED);
    return;
  }

  // Check that the config file exists
  try {
    checkConfigFilePath(
      state.configFilePath ||
        // Assume the equalizerApo config path has been fetched by the time we are processing updates
        path.join(equalizerApoConfigPath, DEFAULT_CONFIG_FILENAME)
    );
  } catch (e) {
    handleError(event, channel, ErrorCode.CONFIG_NOT_FOUND);
    return;
  }

  try {
    // Flush changes to EqualizerAPO with a retry in case several requests to write are occuring at the same time
    retryHelper(5, () => flush(state, equalizerApoConfigPath));
  } catch (e) {
    handleError(event, channel, ErrorCode.FAILURE);
    return;
  }

  // Return a success message of undefined
  const reply: TSuccess<T> = { result: response };
  event.reply(channel, reply);

  // Flush changes to our local state file after informing UI that the changes have been applied
  save(state, userDataDir);
};

const handleUpdate = async (
  event: Electron.IpcMainEvent,
  channel: ChannelEnum | string
) => {
  return handleUpdateHelper<void>(event, channel, undefined);
};

const doesFilterIdExist = (
  event: Electron.IpcMainEvent,
  channel: ChannelEnum,
  filterId: string
) => {
  // Filter id must exist
  if (!(filterId in state.filters)) {
    handleError(event, channel + filterId, ErrorCode.INVALID_PARAMETER);
    return false;
  }
  return true;
};

ipcMain.on(ChannelEnum.HEALTH_CHECK, async (event) => {
  const channel = ChannelEnum.HEALTH_CHECK;
  const res = await updateConfigPath(event, channel);
  if (res) {
    await handleUpdate(event, channel);
  }
});

ipcMain.on(ChannelEnum.LOAD_PRESET, async (event, arg) => {
  const channel = ChannelEnum.LOAD_PRESET;
  const presetName = arg[0];
  console.log(`Loading preset: ${presetName}`);

  try {
    const presetSettings: IPresetV2 = fetchPreset(presetName, presetPath);
    state.preAmp = presetSettings.preAmp;
    state.filters = presetSettings.filters;
    await handleUpdate(event, channel);
  } catch (ex) {
    console.log('Failed to read preset: ', presetName);
    console.log(ex);
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.SAVE_PRESET, async (event, arg) => {
  const channel = ChannelEnum.SAVE_PRESET;
  const presetName = arg[0];
  console.log(`Saving preset: ${presetName}`);
  try {
    // Validate that the preset name is not restricted
    if (isRestrictedPresetName(presetName)) {
      handleError(event, channel, ErrorCode.INVALID_PRESET_NAME);
      return;
    }

    savePreset(
      presetName,
      {
        preAmp: state.preAmp,
        filters: state.filters,
      },
      presetPath
    );
    await handleUpdate(event, channel);
  } catch (e) {
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.DELETE_PRESET, async (event, arg) => {
  const channel = ChannelEnum.DELETE_PRESET;
  const presetName = arg[0];
  const pathToDelete = path.join(presetPath, presetName);
  console.log(`Deleting preset: ${presetName} at location ${pathToDelete}`);
  try {
    deletePreset(presetName, presetPath);
    await handleUpdate(event, channel);
  } catch (e) {
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.RENAME_PRESET, async (event, arg) => {
  const channel = ChannelEnum.RENAME_PRESET;
  const [oldName, newName]: string[] = arg;

  // No name change - the UI should handle this scenario and should not reach the BE
  if (oldName === newName) {
    const reply: TSuccess<void> = { result: undefined };
    event.reply(channel, reply);
  }

  try {
    /**
     * Validate the provided name acording to the following rules:
     * - Disallow renaming to a restricted name
     * - Disallow renaming to an existing preset name
     *
     * Note: the function doesPresetExist performs comparisons based on the file system, meaning it whether the comparison
     * is case sensitive depends on the file system settings. For case sensitive systems, the existence of a preset that
     * matches the new name exactly is guaranteed to be an invalid operation (since we already handled the case where the
     * old and new names are exactly equal). For case insensitive systems, there is an edge case where we want to allow
     * the new name to be a duplicate of an existing preset. This is the case where we are renaming a preset to change the
     * casing of the characters.
     */
    if (
      isRestrictedPresetName(newName) ||
      (doesPresetExist(newName, presetPath) &&
        (state.isCaseSensitiveFs ||
          oldName.toLocaleLowerCase() !== newName.toLocaleLowerCase()))
    ) {
      handleError(event, channel, ErrorCode.INVALID_PRESET_NAME);
      return;
    }

    renamePreset(oldName, newName, presetPath);
    await handleUpdate(event, channel);
  } catch (e) {
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.GET_PRESET_FILE_LIST, async (event) => {
  const channel = ChannelEnum.GET_PRESET_FILE_LIST;
  console.log(`Getting Preset List`);

  try {
    const fileNames: string[] = fs.readdirSync(presetPath);
    console.log(`Fetched ${fileNames.length} files`);
    const reply: TSuccess<string[]> = { result: fileNames };
    event.reply(channel, reply);
  } catch (e) {
    console.error('Failed to get filenames');
    console.error(e);
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.GET_AUTO_EQ_DEVICE_LIST, async (event) => {
  const channel = ChannelEnum.GET_AUTO_EQ_DEVICE_LIST;
  console.log(`Getting AutoEQ Device List`);

  try {
    const fileNames: string[] = getAutoEqDeviceList();
    console.log(`Fetched ${fileNames.length} files`);
    const reply: TSuccess<string[]> = { result: fileNames };
    event.reply(channel, reply);
  } catch (e) {
    console.error('Failed to get devices');
    console.error(e);
    handleError(event, channel, ErrorCode.AUTO_EQ_READ_ERROR);
  }
});

ipcMain.on(ChannelEnum.GET_AUTO_EQ_RESPONSE_LIST, async (event, arg) => {
  const channel = ChannelEnum.GET_AUTO_EQ_RESPONSE_LIST;
  const deviceName: string = arg[0];
  console.log(`Getting AutoEQ supported response list for ${deviceName}`);

  try {
    const fileNames: string[] = getAutoEqResponseList(deviceName);
    console.log(`Fetched ${fileNames.length} files`);
    const reply: TSuccess<string[]> = { result: fileNames };
    event.reply(channel, reply);
  } catch (e) {
    console.error(`Failed to get supported responses for ${deviceName}`);
    console.error(e);
    handleError(event, channel, ErrorCode.AUTO_EQ_READ_ERROR);
  }
});

ipcMain.on(ChannelEnum.LOAD_AUTO_EQ_PRESET, async (event, arg) => {
  const channel = ChannelEnum.LOAD_AUTO_EQ_PRESET;
  const [deviceName, responseName] = arg;

  try {
    const presetSettings: IPresetV2 = getAutoEqPreset(deviceName, responseName);
    state.preAmp = presetSettings.preAmp;
    state.filters = presetSettings.filters;
    await handleUpdate(event, channel);
  } catch (ex) {
    console.log(
      `Failed to load autoeq preset from ${deviceName} to ${responseName}`
    );
    console.log(ex);
    handleError(event, channel, ErrorCode.PRESET_FILE_ERROR);
  }
});

ipcMain.on(ChannelEnum.GET_STATE, async (event) => {
  const channel = ChannelEnum.GET_STATE;
  const res = await updateConfigPath(event, channel);
  if (res) {
    const reply: TSuccess<IState> = { result: state };
    event.reply(channel, reply);
  }
});

ipcMain.on(ChannelEnum.GET_ENABLE, async (event) => {
  const reply: TSuccess<boolean> = { result: !!state.isEnabled };
  event.reply(ChannelEnum.GET_ENABLE, reply);
});

ipcMain.on(ChannelEnum.SET_ENABLE, async (event, arg) => {
  // eslint-disable-next-line prefer-destructuring
  state.isEnabled = arg[0];
  await handleUpdate(event, ChannelEnum.SET_ENABLE);
});

ipcMain.on(ChannelEnum.SET_AUTO_PREAMP, async (event, arg) => {
  // eslint-disable-next-line prefer-destructuring
  state.isAutoPreAmpOn = arg[0];
  await handleUpdate(event, ChannelEnum.SET_AUTO_PREAMP);
});

ipcMain.on(ChannelEnum.SET_GRAPH_VIEW, async (event, arg) => {
  // eslint-disable-next-line prefer-destructuring
  state.isGraphViewOn = arg[0];
  await handleUpdate(event, ChannelEnum.SET_GRAPH_VIEW);
});

ipcMain.on(ChannelEnum.GET_PREAMP, async (event) => {
  const reply: TSuccess<number> = { result: state.preAmp || 0 };
  event.reply(ChannelEnum.GET_PREAMP, reply);
});

ipcMain.on(ChannelEnum.SET_PREAMP, async (event, arg) => {
  const channel = ChannelEnum.SET_PREAMP;
  const gain = parseFloat(arg[0]) || 0;

  if (gain < MIN_GAIN || gain > MAX_GAIN) {
    handleError(event, channel, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.preAmp = gain;
  await handleUpdate(event, channel);
});

ipcMain.on(ChannelEnum.GET_FILTER_GAIN, async (event, arg) => {
  const channel = ChannelEnum.GET_FILTER_GAIN;
  const filterId = arg[0];

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  const reply: TSuccess<number> = {
    result: state.filters[filterId].gain || 0,
  };
  event.reply(channel + filterId, reply);
});

ipcMain.on(ChannelEnum.SET_FILTER_GAIN, async (event, arg) => {
  const channel = ChannelEnum.SET_FILTER_GAIN;
  const filterId = arg[0];
  const gain = parseFloat(arg[1]) || 0;

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  if (gain < MIN_GAIN || gain > MAX_GAIN) {
    handleError(event, channel + filterId, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.filters[filterId].gain = gain;
  await handleUpdate(event, channel + filterId);
});

ipcMain.on(ChannelEnum.GET_FILTER_FREQUENCY, async (event, arg) => {
  const channel = ChannelEnum.GET_FILTER_FREQUENCY;
  const filterId = arg[0];

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  const reply: TSuccess<number> = {
    result: state.filters[filterId].frequency || 10,
  };
  event.reply(channel + filterId, reply);
});

ipcMain.on(ChannelEnum.SET_FILTER_FREQUENCY, async (event, arg) => {
  const channel = ChannelEnum.SET_FILTER_FREQUENCY;
  const filterId = arg[0];
  const frequency = parseInt(arg[1], 10) || 0;

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    handleError(event, channel + filterId, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.filters[filterId].frequency = frequency;
  await handleUpdate(event, channel + filterId);
});

ipcMain.on(ChannelEnum.GET_FILTER_QUALITY, async (event, arg) => {
  const channel = ChannelEnum.GET_FILTER_QUALITY;
  const filterId = arg[0];

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  const reply: TSuccess<number> = {
    result: state.filters[filterId].quality || 10,
  };
  event.reply(channel + filterId, reply);
});

ipcMain.on(ChannelEnum.SET_FILTER_QUALITY, async (event, arg) => {
  const channel = ChannelEnum.SET_FILTER_QUALITY;
  const filterId = arg[0];
  const quality = parseFloat(arg[1]) || 0;

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  if (quality < MIN_QUALITY || quality > MAX_QUALITY) {
    handleError(event, channel + filterId, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.filters[filterId].quality = quality;
  await handleUpdate(event, channel + filterId);
});

ipcMain.on(ChannelEnum.GET_FILTER_TYPE, async (event, arg) => {
  const channel = ChannelEnum.GET_FILTER_TYPE;
  const filterId = arg[0];

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  const reply: TSuccess<string> = {
    result: state.filters[filterId].type,
  };
  event.reply(channel + filterId, reply);
});

ipcMain.on(ChannelEnum.SET_FILTER_TYPE, async (event, arg) => {
  const channel = ChannelEnum.SET_FILTER_TYPE;
  const filterId = arg[0];
  const filterType = arg[1];

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  if (!Object.values(FilterTypeEnum).includes(filterType)) {
    handleError(event, channel + filterId, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.filters[filterId].type = filterType as FilterTypeEnum;
  await handleUpdate(event, channel + filterId);
});

ipcMain.on(ChannelEnum.GET_FILTER_COUNT, async (event) => {
  const reply: TSuccess<number> = {
    result: Object.keys(state.filters).length,
  };
  event.reply(ChannelEnum.GET_FILTER_COUNT, reply);
});

ipcMain.on(ChannelEnum.ADD_FILTER, async (event, arg) => {
  const channel = ChannelEnum.ADD_FILTER;
  const frequency: number = arg[0];

  // Cannot exceed the maximum number of filters
  // Frequency must be in valid range
  if (
    Object.keys(state.filters).length === MAX_NUM_FILTERS ||
    frequency < MIN_FREQUENCY ||
    frequency > MAX_FREQUENCY
  ) {
    handleError(event, channel, ErrorCode.INVALID_PARAMETER);
    return;
  }

  const newFilter: IFilter = { ...getDefaultFilterWithId(), frequency };
  state.filters[newFilter.id] = newFilter;
  await handleUpdateHelper(event, channel, newFilter.id);
});

ipcMain.on(ChannelEnum.REMOVE_FILTER, async (event, arg) => {
  const channel = ChannelEnum.REMOVE_FILTER;
  const filterId: string = arg[0];

  // Cannot fall below the minimum number of filters
  if (Object.keys(state.filters).length === MIN_NUM_FILTERS) {
    handleError(event, channel, ErrorCode.INVALID_PARAMETER);
    return;
  }

  // Filter id must exist
  if (!doesFilterIdExist(event, channel, filterId)) {
    return;
  }

  // delete does not throw exception even if the filterId does not exist
  delete state.filters[filterId];
  await handleUpdate(event, channel);
});

ipcMain.on(ChannelEnum.CLEAR_GAINS, async (event) => {
  const channel = ChannelEnum.CLEAR_GAINS;

  Object.keys(state.filters).forEach((key) => {
    state.filters[key].gain = 0;
  });

  await handleUpdate(event, channel);
});

ipcMain.on(ChannelEnum.SET_FIXED_BAND, async (event, arg) => {
  const channel = ChannelEnum.SET_FIXED_BAND;
  const size: FixedBandSizeEnum = arg[0];
  if (!isFixedBandSizeEnumValue(size)) {
    handleError(event, channel, ErrorCode.INVALID_PARAMETER);
  }

  state.filters = getDefaultFilters(size);

  await handleUpdateHelper<IFiltersMap>(event, channel, state.filters);
});

ipcMain.on(ChannelEnum.UPDATE_CONFIG_FILE_PATH, async (event, arg) => {
  const channel = ChannelEnum.UPDATE_CONFIG_FILE_PATH;
  const filePath: string = arg[0];

  // Cannot fall below the minimum number of filters
  if (!fs.existsSync(filePath)) {
    handleError(event, channel, ErrorCode.INVALID_PARAMETER);
    return;
  }

  state.configFilePath = filePath;
  await handleUpdate(event, channel);
});

ipcMain.on(ChannelEnum.SET_WINDOW_SIZE, async (event, arg) => {
  const channel = ChannelEnum.SET_WINDOW_SIZE;
  setWindowDimension(arg[0]);

  const reply: TSuccess<void> = { result: undefined };
  event.reply(channel, reply);
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
    width: WINDOW_WIDTH,
    minWidth: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minHeight: WINDOW_HEIGHT,
    icon: getAssetPath('icon.png'),
    resizable: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1c313a',
      symbolColor: '#ffffff',
      height: 28,
    },
  });

  setWindowDimension(state.isGraphViewOn);

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

    if (isDebug) {
      // When in debug mode, show dev tools after the app loads
      mainWindow.webContents.openDevTools();
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
