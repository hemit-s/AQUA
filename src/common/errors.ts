export enum ErrorCode {
  PEACE_NOT_INSTALLED = 1,
  PEACE_NOT_RUNNING = 2,
  PEACE_NOT_READY = 3,
  PEACE_TIMEOUT = 4,
}

export type ErrorDescription = {
  shortError: string;
  action: string;
  code: ErrorCode;
};

export const errors: Record<ErrorCode, ErrorDescription> = {
  [ErrorCode.PEACE_NOT_INSTALLED]: {
    shortError: 'Peace not installed.',
    action: 'Please install and launch PeaceGUI before retrying.',
    code: ErrorCode.PEACE_NOT_INSTALLED,
  },
  [ErrorCode.PEACE_NOT_RUNNING]: {
    shortError: 'Peace not running.',
    action: 'Please launch PeaceGUI before retrying.',
    code: ErrorCode.PEACE_NOT_RUNNING,
  },
  [ErrorCode.PEACE_NOT_READY]: {
    shortError: 'Peace not ready yet.',
    action: 'Please launch PeaceGUI before retrying.',
    code: ErrorCode.PEACE_NOT_READY,
  },
  [ErrorCode.PEACE_TIMEOUT]: {
    shortError: 'Timeout waiting for a response.',
    action:
      'Please restart the application. If the error persists, try reaching out to the developers to resolve the issue.',
    code: ErrorCode.PEACE_TIMEOUT,
  },
};

export const getErrorDescription = (code: ErrorCode) => errors[code];
