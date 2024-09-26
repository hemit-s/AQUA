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

import { DefineStepFunction } from 'jest-cucumber';
import { getDefaultFilterWithId, IState } from 'common/constants';
import { flush } from 'main/flush';
import { getConfigPath, isEqualizerAPOInstalled } from 'main/registry';

export const givenEqualizerApoIsInstalled = (given: DefineStepFunction) => {
  given('EqualizerAPO is installed', async () => {
    if (!(await isEqualizerAPOInstalled())) {
      throw new Error('EqualizerAPO not installed');
    }
    // TODO find a way to install EqualizerAPO
  });
};

export const givenCanWriteToAquaConfig = (given: DefineStepFunction) => {
  given('Aqua can write to Aqua config', async () => {
    const emptyState: IState = {
      isEnabled: false,
      isAutoPreAmpOn: false,
      isGraphViewOn: false,
      isCaseSensitiveFs: false,
      preAmp: 0,
      configFilePath: '',
      filters: { unique_id: getDefaultFilterWithId() },
    };
    const configDirPath = await getConfigPath();
    flush(emptyState, configDirPath);
  });
};
