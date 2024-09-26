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

enum ChannelEnum {
  HEALTH_CHECK = 'healthCheck',
  SET_WINDOW_SIZE = 'setWindowSize',
  GET_STATE = 'getState',
  GET_ENABLE = 'getEnable',
  SET_ENABLE = 'setEnable',
  SET_AUTO_PREAMP = 'setAutoPreAmp',
  SET_GRAPH_VIEW = 'setGraphView',
  GET_PREAMP = 'getPreAmp',
  SET_PREAMP = 'setPreAmp',
  GET_FILTER_GAIN = 'getFilterGain',
  SET_FILTER_GAIN = 'setFilterGain',
  GET_FILTER_FREQUENCY = 'getFilterFrequency',
  SET_FILTER_FREQUENCY = 'setFilterFrequency',
  GET_FILTER_QUALITY = 'getFilterQuality',
  SET_FILTER_QUALITY = 'setFilterQuality',
  GET_FILTER_TYPE = 'getFilterType',
  SET_FILTER_TYPE = 'setFilterType',
  GET_FILTER_COUNT = 'getFilterCount',
  ADD_FILTER = 'addFilter',
  REMOVE_FILTER = 'removeFilter',
  LOAD_PRESET = 'loadPreset',
  SAVE_PRESET = 'savePreset',
  DELETE_PRESET = 'deletePreset',
  RENAME_PRESET = 'renamePreset',
  GET_PRESET_FILE_LIST = 'getPresetFileList',
  GET_AUTO_EQ_DEVICE_LIST = 'getAutoEqDeviceList',
  GET_AUTO_EQ_RESPONSE_LIST = 'getAutoEqResponseList',
  LOAD_AUTO_EQ_PRESET = 'loadAutoEqPreset',
  CLEAR_GAINS = 'clearGains',
  SET_FIXED_BAND = 'setFixedBand',
  UPDATE_CONFIG_FILE_PATH = 'updateConfigFilePath',
}

export default ChannelEnum;
