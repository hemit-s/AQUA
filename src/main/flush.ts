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

import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import {
  FILTER_REGEX,
  FilterTypeEnum,
  getDefaultFilterWithId,
  getDefaultState,
  IFilter,
  IFiltersMap,
  IPresetV1,
  IPresetV2,
  IState,
  MAX_NUM_FILTERS,
  PREAMP_REGEX,
} from '../common/constants';
import {
  validatePresetV1,
  validatePresetV2,
  validateState,
} from '../common/validator';

export const stateToString = (state: IState) => {
  if (!state.isEnabled) {
    return '';
  }

  let output: string[] = [];

  output.push('Device: all');
  output.push('Channel: all');
  // This line MUST be "Preamp" without a capitalized P for Equalizer APO to work
  output.push(`Preamp: ${state.preAmp}dB`);

  // Using individual filter bands
  output = output.concat(
    Object.values(state.filters).map(
      ({ frequency, gain, type, quality }, index) => {
        return `Filter${index}: ON ${type} Fc ${frequency} Hz Gain ${gain} dB Q ${quality}`;
      }
    )
  );

  return output.join('\n\r');
};

export const serializeState = (state: IState) => {
  return JSON.stringify(state);
};

export const serializePreset = (preset: IPresetV2) => {
  return JSON.stringify(preset);
};

const CONFIG_CONTENT = 'Include: aqua.txt';
const AQUA_LOCAL_CONFIG_FILENAME = 'state.txt';
export const AQUA_CONFIG_FILENAME = 'aqua.txt';
export const PRESETS_DIR = 'presets';

export const addFileToPath = (pathPrefix: string, fileName: string) => {
  return path.join(pathPrefix, fileName);
};

export const fetchSettings = (settingsDir: string) => {
  const settingsPath = path.join(settingsDir, AQUA_LOCAL_CONFIG_FILENAME);
  try {
    const content = fs.readFileSync(settingsPath, {
      encoding: 'utf8',
    });
    const input = JSON.parse(content);
    if (!validateState(input)) {
      throw new Error('Invalid state file loaded. Using default state.');
    }
    // Manually set case sensitivity as false until it is confirmed in app that it can be enabled
    return { ...input, isCaseSensitiveFs: false } as IState;
  } catch (ex) {
    console.log(ex);
    // if unable to fetch the state, use a default one
    return getDefaultState();
  }
};

export const save = (state: IState, settingsDir: string) => {
  const settingsPath = path.join(settingsDir, AQUA_LOCAL_CONFIG_FILENAME);
  try {
    fs.writeFileSync(settingsPath, serializeState(state), {
      encoding: 'utf8',
    });
  } catch (ex) {
    console.log(`Failed to save to ${settingsPath}`);
    throw ex;
  }
};

export const fetchPreset = (presetName: string, presetsDir: string) => {
  try {
    const presetPath = path.join(presetsDir, presetName);
    const content = fs.readFileSync(presetPath, {
      encoding: 'utf8',
    });
    const json = JSON.parse(content);
    if (validatePresetV1(json)) {
      const oldFormat = json as IPresetV1;
      const newFormat: IPresetV2 = { preAmp: oldFormat.preAmp, filters: {} };
      oldFormat.filters.forEach((filter) => {
        // Its okay to shallow copy the filter because we won't give oldFormat to anyone else.
        newFormat.filters[filter.id] = filter;
      });
      try {
        // Try to update our file.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        savePreset(presetName, newFormat, presetsDir);
      } catch {
        // Ignore failed updates.
      }
      return newFormat;
    }
    if (!validatePresetV2(json)) {
      throw new Error('Invalid preset file');
    }
    return json as IPresetV2;
  } catch (ex) {
    console.log('Failed to get presets!!');
    console.log(ex);
    throw ex;
  }
};

export const savePreset = (
  presetName: string,
  preset_info: IPresetV2,
  presetsDir: string
) => {
  try {
    const presetPath = path.join(presetsDir, presetName);
    fs.writeFileSync(presetPath, serializePreset(preset_info), {
      encoding: 'utf8',
    });
  } catch (ex) {
    console.log('Failed to save to preset %d', presetName);
    throw ex;
  }
  console.log(`Wrote preset for: ${presetName}`);
};

export const deletePreset = (presetName: string, presetsDir: string) => {
  try {
    const presetPath = path.join(presetsDir, presetName);
    fs.unlinkSync(presetPath);
  } catch (ex) {
    console.log('Failed to delete preset');
    throw ex;
  }
  console.log(`Deleted preset: ${presetName}`);
};

export const doesPresetExist = (presetName: string, presetsDir: string) => {
  const testPath = addFileToPath(presetsDir, presetName);
  try {
    return fs.existsSync(testPath);
  } catch (ex) {
    console.log('Failed to check whether preset %d exists', presetName);
    throw ex;
  }
};

export const renamePreset = (
  oldName: string,
  newName: string,
  presetsDir: string
) => {
  const oldPath = addFileToPath(presetsDir, oldName);
  const newPath = addFileToPath(presetsDir, newName);
  try {
    fs.renameSync(oldPath, newPath);
  } catch (ex) {
    console.log('Failed to rename preset %d to preset %d', oldName, newName);
    throw ex;
  }
};

export const flushExplicit = (state: IState, configFilePath: string) => {
  try {
    fs.writeFileSync(configFilePath, stateToString(state), {
      encoding: 'utf8',
    });
  } catch (ex) {
    console.log(`Failed to flush to ${configFilePath}`);
  }
};

export const flush = (state: IState, configDirPath: string) => {
  const configPath = addFileToPath(configDirPath, AQUA_CONFIG_FILENAME);
  flushExplicit(state, configPath);
};

export const checkConfigFilePath = (configFilePath: string) => {
  try {
    const content = fs.readFileSync(configFilePath, {
      encoding: 'utf8',
    });
    return content.search(CONFIG_CONTENT) !== -1;
  } catch (ex) {
    throw new Error(`Unable to locate config file at ${configFilePath}`);
  }
};

export const updateConfigFilePath = (configFilePath: string) => {
  try {
    fs.appendFileSync(configFilePath, `\n${CONFIG_CONTENT}`, {
      encoding: 'utf8',
    });
  } catch (ex) {
    throw new Error(`Unable to locate config file at ${configFilePath}`);
  }
};

export const openFsFileDialog = async () =>
  dialog.showOpenDialog({ properties: ['promptToCreate'] });

export const openFsDirectoryDialog = async () =>
  dialog.showOpenDialog({ properties: ['openDirectory'] });

export const readEqualizerApoFile = (filePath: string) => {
  let preAmpParsed = 0;
  const filters: IFiltersMap = {};
  const file = fs.readFileSync(filePath, 'utf8');

  file.split('\n').forEach((line, i) => {
    if (Object.keys(filters).length >= MAX_NUM_FILTERS) {
      // Ensure filters doesn't exceed filter count cap
      return;
    }
    const preampMatch = line.match(PREAMP_REGEX);
    if (preampMatch) {
      if (preampMatch.length !== 2) {
        throw new Error(
          `Preamp regex match error for AutoEQ file: ${filePath}`
        );
      }

      try {
        preAmpParsed = parseFloat(preampMatch[1]);
      } catch (err) {
        throw new Error(
          `Preamp float parse error for AutoEQ file: ${filePath}`
        );
      }
      return;
    }

    const filterMatch = line.match(FILTER_REGEX);
    if (filterMatch) {
      if (filterMatch.length !== 5) {
        throw new Error(
          `Filter regex match error on line ${i} for AutoEQ file: ${filePath}`
        );
      }

      const filter: IFilter = getDefaultFilterWithId();
      switch (filterMatch[1]) {
        case 'PK':
          filter.type = FilterTypeEnum.PK;
          break;
        case 'LS':
          filter.type = FilterTypeEnum.LSC;
          break;
        case 'HS':
          filter.type = FilterTypeEnum.HSC;
          break;
        default:
          throw new Error(
            `Filter type not (PK|LS|HS) on line ${i} for AutoEQ file: ${filePath}`
          );
      }
      try {
        filter.frequency = Math.min(parseInt(filterMatch[2], 10), 20000);
        filter.gain = parseFloat(filterMatch[3]);
        filter.quality = parseFloat(filterMatch[4]);
      } catch (err) {
        throw new Error(
          `Filter parameter parse error on line ${i} for AutoEQ file: ${filePath}`
        );
      }
      filters[filter.id] = filter;
    }
    // Ignore any lines which we do not recognize
  });

  const preset: IPresetV2 = {
    preAmp: preAmpParsed,
    filters,
  };

  return preset;
};
