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
import { app } from 'electron';
import { readEqualizerApoFile } from './flush';

let AUTOEQ_DIR = './resources/autoeq';
if (!!app && !app.isPackaged) {
  // dev mode means there is no resources folder and we must access our repo's autoeq folder.
  AUTOEQ_DIR = path.join(__dirname, '../../autoeq');
}

export const getAutoEqDeviceList = (autoeqDir: string = AUTOEQ_DIR) => {
  return fs.readdirSync(autoeqDir);
};

export const getAutoEqResponseList = (
  device: string,
  autoeqDir: string = AUTOEQ_DIR
) => {
  return fs.readdirSync(path.join(autoeqDir, device));
};

export const getAutoEqPreset = (
  device: string,
  response: string,
  autoeqDir: string = AUTOEQ_DIR
) => {
  const filePath = path.join(autoeqDir, device, response);
  return readEqualizerApoFile(filePath);
};
