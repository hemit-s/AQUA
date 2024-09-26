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

/* eslint-disable @typescript-eslint/no-unused-vars */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import defaultAquaContext from '__tests__/utils/mockAquaProvider';
import {
  CONFIG_FILE_PATH_PLACEHOLDER,
  ErrorCode,
  getErrorDescription,
} from 'common/errors';
import mockElectronAPI from '__tests__/utils/mockElectronAPI';
import { DEFAULT_CONFIG_FILENAME } from 'common/constants';
import App, { AppContent } from '../../renderer/App';
import { AquaProviderWrapper } from '../../renderer/utils/AquaContext';

describe('App', () => {
  beforeAll(() => {
    mockElectronAPI();
  });

  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });

  describe('AppContent', () => {
    const configFilePickerText = 'Select a config file';
    it('should render timeout error', () => {
      const error = getErrorDescription(ErrorCode.TIMEOUT);
      render(
        <AquaProviderWrapper
          value={{
            ...defaultAquaContext,
            globalError: error,
          }}
        >
          <AppContent />
        </AquaProviderWrapper>
      );

      expect(screen.getByText(error.title)).toBeInTheDocument();
      expect(
        screen.getByText(`${error.shortError} ${error.action}`)
      ).toBeInTheDocument();
      expect(screen.queryByText(configFilePickerText)).not.toBeInTheDocument();
    });

    it('should render config file missing error', () => {
      const error = getErrorDescription(ErrorCode.CONFIG_NOT_FOUND);
      render(
        <AquaProviderWrapper
          value={{
            ...defaultAquaContext,
            globalError: error,
            configFilePath: DEFAULT_CONFIG_FILENAME,
          }}
        >
          <AppContent />
        </AquaProviderWrapper>
      );

      expect(screen.getByText(error.title)).toBeInTheDocument();
      expect(
        screen.getByText(
          `${error.shortError} ${error.action.replace(
            CONFIG_FILE_PATH_PLACEHOLDER,
            DEFAULT_CONFIG_FILENAME
          )}`
        )
      ).toBeInTheDocument();
      expect(screen.getByText(configFilePickerText)).toBeInTheDocument();
    });
  });
});
