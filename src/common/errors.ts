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

export enum ErrorCode {
  EQUALIZER_APO_NOT_INSTALLED,
  CONFIG_NOT_FOUND,
  TIMEOUT,
  INVALID_PARAMETER,
  FAILURE,
  PRESET_FILE_ERROR,
  INVALID_PRESET_NAME,
  AUTO_EQ_READ_ERROR,
  FILE_SYSTEM_ERROR,
}

enum ErrorTitle {
  GENERAL = 'Error',
  INTERNAL_ERROR = 'Internal Error',
  PREREQUISITE = 'Prerequisite Missing',
}

export type ErrorDescription = {
  title: string;
  shortError: string;
  action: string;
  code: ErrorCode;
};

export const CONFIG_FILE_PATH_PLACEHOLDER = 'CONFIG_FILE_PATH_PLACEHOLDER';

export const errors: Record<ErrorCode, ErrorDescription> = {
  [ErrorCode.EQUALIZER_APO_NOT_INSTALLED]: {
    title: ErrorTitle.PREREQUISITE,
    shortError: 'Equalizer APO is not installed.',
    action: 'Please install Equalizer APO before retrying.',
    code: ErrorCode.EQUALIZER_APO_NOT_INSTALLED,
  },
  [ErrorCode.CONFIG_NOT_FOUND]: {
    title: ErrorTitle.PREREQUISITE,
    shortError: 'Unable to locate the configuration file for EqualizerAPO.',
    action: `Please check whether your config file at ${CONFIG_FILE_PATH_PLACEHOLDER} exists or select a new config file.`,
    code: ErrorCode.CONFIG_NOT_FOUND,
  },
  [ErrorCode.TIMEOUT]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Timeout waiting for a response.',
    action:
      'Please restart the application. If the error persists, try reaching out to the developers to resolve the issue.',
    code: ErrorCode.TIMEOUT,
  },
  [ErrorCode.INVALID_PARAMETER]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Invalid parameter.',
    action: 'Please reach out to the developers to resolve the issue.',
    code: ErrorCode.INVALID_PARAMETER,
  },
  [ErrorCode.FAILURE]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Failed to apply equalizer settings.',
    action:
      'Please restart the application. If the error persists, try reaching out to the developers to resolve the issue.',
    code: ErrorCode.FAILURE,
  },
  [ErrorCode.PRESET_FILE_ERROR]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Failed to read or modify preset files.',
    action:
      'Please check that the preset name is saveable as a file and that the installation directory is in a writeable place. In addition, check that you have available storage space. If the error persists, try reaching out to the developers to resolve the issue.',
    code: ErrorCode.PRESET_FILE_ERROR,
  },
  [ErrorCode.INVALID_PRESET_NAME]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Invalid preset name provided.',
    action:
      'Please provide a different preset name. If the error persists, try reaching out to the developers to resolve the issue.',
    code: ErrorCode.INVALID_PRESET_NAME,
  },
  [ErrorCode.AUTO_EQ_READ_ERROR]: {
    title: ErrorTitle.INTERNAL_ERROR,
    shortError: 'Failed to get supported AutoEQ devices.',
    action: 'Please reach out to the developers to resolve the issue.',
    code: ErrorCode.AUTO_EQ_READ_ERROR,
  },
  [ErrorCode.FILE_SYSTEM_ERROR]: {
    shortError: 'Internal Error: Failed to open file system.',
    action: 'Please reach out to the developers to resolve the issue.',
    code: ErrorCode.FILE_SYSTEM_ERROR,
  },
};

export const getErrorDescription = (code: ErrorCode) => errors[code];
