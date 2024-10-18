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

import {
  addFileToPath,
  checkConfigFilePath,
  deletePreset,
  doesPresetExist,
  fetchPreset,
  fetchSettings,
  renamePreset,
  save,
  savePreset,
  serializePreset,
  serializeState,
  stateToString,
  updateConfigFilePath,
} from 'main/flush';
import fs from 'fs';
import {
  DEFAULT_CONFIG_FILENAME,
  FilterTypeEnum,
  getDefaultState,
  IPresetV2,
  IState,
} from 'common/constants';
import path from 'path';

const TEST_DATA_DIR = 'src/__tests__/data';
const TEST_DATA_READ_DIR = addFileToPath(TEST_DATA_DIR, 'read_only');
const TEST_DATA_WRITE_DIR = addFileToPath(TEST_DATA_DIR, 'write');
const mockSettings: IState = {
  isEnabled: true,
  isAutoPreAmpOn: true,
  isGraphViewOn: true,
  isCaseSensitiveFs: false,
  configFilePath: path.join(TEST_DATA_READ_DIR, DEFAULT_CONFIG_FILENAME),
  preAmp: 13,
  filters: {
    '7cf32e8a': {
      id: '7cf32e8a',
      frequency: 32,
      gain: 8,
      quality: 1.5,
      type: FilterTypeEnum.PK,
    },
    '3e97b5dc': {
      id: '3e97b5dc',
      frequency: 16000,
      gain: -10,
      quality: 2.3,
      type: FilterTypeEnum.HSC,
    },
  },
};

describe('flush', () => {
  describe('stateToString', () => {
    const defaultState = getDefaultState();
    it('should return empty string if state is disabled', () => {
      expect(stateToString({ ...defaultState, isEnabled: false })).toBe('');
    });

    it('should convert output to correct format', () => {
      const returnedString = stateToString(defaultState);
      expect(returnedString).toMatch(/Device: all\n\rChannel: all\n\r/);
      expect(returnedString).toMatch(/Preamp: 0dB\n\r/);

      // Check for that filters for each frequency exists
      // Note: the order of filters in the string is determined by the generated filter id and not the frequency value
      expect(returnedString).toMatch(/Filter\d: ON PK Fc 32 Hz Gain 0 dB Q 1/);
      expect(returnedString).toMatch(/Filter\d: ON PK Fc 64 Hz Gain 0 dB Q 1/);
      expect(returnedString).toMatch(/Filter\d: ON PK Fc 125 Hz Gain 0 dB Q 1/);
      expect(returnedString).toMatch(/Filter\d: ON PK Fc 250 Hz Gain 0 dB Q 1/);
      expect(returnedString).toMatch(/Filter\d: ON PK Fc 500 Hz Gain 0 dB Q 1/);
      expect(returnedString).toMatch(
        /Filter\d: ON PK Fc 1000 Hz Gain 0 dB Q 1/
      );
      expect(returnedString).toMatch(
        /Filter\d: ON PK Fc 2000 Hz Gain 0 dB Q 1/
      );
      expect(returnedString).toMatch(
        /Filter\d: ON PK Fc 4000 Hz Gain 0 dB Q 1/
      );
      expect(returnedString).toMatch(
        /Filter\d: ON PK Fc 8000 Hz Gain 0 dB Q 1/
      );
      expect(returnedString).toMatch(
        /Filter\d: ON PK Fc 16000 Hz Gain 0 dB Q 1/
      );
    });
  });

  describe('fetchSettings', () => {
    it('should succesfully fetch settings from the state file', () => {
      const settings: IState = fetchSettings(TEST_DATA_READ_DIR);
      expect(settings).toStrictEqual(mockSettings);
    });
  });

  describe('save', () => {
    it('should succesfully save settings to the state file', () => {
      save(mockSettings, TEST_DATA_WRITE_DIR);
      expect(
        fs
          .readFileSync(addFileToPath(TEST_DATA_WRITE_DIR, 'state.txt'))
          .toString()
      ).toBe(serializeState(mockSettings));
    });
  });

  describe('fetchPreset', () => {
    beforeAll(() => {
      fs.copyFileSync(
        addFileToPath(TEST_DATA_READ_DIR, 'presetV1'),
        addFileToPath(TEST_DATA_WRITE_DIR, 'presetV1')
      );
    });
    it('should read succesfully a preset of the IPresetV2 format', () => {
      const presetName = 'presetV2';
      const preset = fetchPreset(presetName, TEST_DATA_READ_DIR);
      expect(preset).toStrictEqual({
        preAmp: 0,
        filters: {
          '0a04dcf8': {
            id: '0a04dcf8',
            frequency: 32,
            gain: -4,
            quality: 1,
            type: FilterTypeEnum.PK,
          },
          d77a7415: {
            id: 'd77a7415',
            frequency: 16000,
            gain: 0,
            quality: 1,
            type: FilterTypeEnum.PK,
          },
        },
      });
    });

    it('should read succesfully a preset of the IPresetV1 format and replace it with a IPresetV2 format', () => {
      const preset = fetchPreset('presetV1', TEST_DATA_WRITE_DIR);
      expect(preset).toStrictEqual({
        preAmp: 0,
        filters: {
          '123': { id: '123', frequency: 2, gain: -4, quality: 6, type: 'PK' },
          '456': {
            id: '456',
            frequency: 8,
            gain: -10,
            quality: 1.2,
            type: FilterTypeEnum.PK,
          },
        },
      });
    });
  });

  describe('save and delete preset', () => {
    it('should save and delete a preset', () => {
      const presetName = 'newPreset';
      const preset: IPresetV2 = {
        preAmp: 0,
        filters: {
          '123': {
            id: '123',
            frequency: 2,
            gain: -4,
            quality: 6,
            type: FilterTypeEnum.PK,
          },
        },
      };
      savePreset(presetName, preset, TEST_DATA_WRITE_DIR);
      expect(doesPresetExist(presetName, TEST_DATA_WRITE_DIR)).toBe(true);
      deletePreset(presetName, TEST_DATA_WRITE_DIR);
      expect(doesPresetExist(presetName, TEST_DATA_WRITE_DIR)).toBe(false);
    });
  });

  describe('doesPresetExist', () => {
    it('should return true for an existing preset', () => {
      const presetName = 'presetV1';
      expect(doesPresetExist(presetName, TEST_DATA_READ_DIR)).toBe(true);
    });

    it('should return false for a non-existing preset', () => {
      const presetName = '404_not_found';
      expect(doesPresetExist(presetName, TEST_DATA_READ_DIR)).toBe(false);
    });
  });

  describe('renamePreset', () => {
    const oldPresetName = 'oldPresetName';
    const newPresetName = 'newPresetName';
    const preset: IPresetV2 = {
      preAmp: 0,
      filters: {
        '123': {
          id: '123',
          frequency: 2,
          gain: -4,
          quality: 6,
          type: FilterTypeEnum.PK,
        },
        '456': {
          id: '456',
          frequency: 8,
          gain: -10,
          quality: 1.2,
          type: FilterTypeEnum.PK,
        },
      },
    };

    beforeAll(() => {
      // Create a file with the old file name in case if it doesn't exist
      if (!doesPresetExist(oldPresetName, TEST_DATA_WRITE_DIR)) {
        fs.writeFileSync(
          addFileToPath(TEST_DATA_WRITE_DIR, oldPresetName),
          serializePreset(preset),
          {
            encoding: 'utf8',
          }
        );
      }
    });

    it('should sucessfully rename a preset', () => {
      renamePreset(oldPresetName, newPresetName, TEST_DATA_WRITE_DIR);
      expect(doesPresetExist(oldPresetName, TEST_DATA_WRITE_DIR)).toBe(false);
      expect(fetchPreset(newPresetName, TEST_DATA_WRITE_DIR)).toStrictEqual(
        preset
      );
      renamePreset(newPresetName, oldPresetName, TEST_DATA_WRITE_DIR);
    });
  });

  describe('checkConfigFilePath', () => {
    it('should throw if file does not exist', () => {
      expect(() =>
        checkConfigFilePath(path.join(TEST_DATA_DIR, DEFAULT_CONFIG_FILENAME))
      ).toThrow();
    });

    it('should return false for an existing config file with missing content', () => {
      expect(
        checkConfigFilePath(
          path.join(TEST_DATA_READ_DIR, DEFAULT_CONFIG_FILENAME)
        )
      ).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should result in a valid config file', () => {
      updateConfigFilePath(
        path.join(TEST_DATA_WRITE_DIR, DEFAULT_CONFIG_FILENAME)
      );
      expect(
        checkConfigFilePath(
          path.join(TEST_DATA_WRITE_DIR, DEFAULT_CONFIG_FILENAME)
        )
      ).toBe(true);
    });
  });
});
