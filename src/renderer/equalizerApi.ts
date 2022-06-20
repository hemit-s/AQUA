import {
  ErrorCode,
  ErrorDescription,
  getErrorDescription,
} from 'common/errors';

const TIMEOUT = 10000;

// Peace returns numerical values as unsigned integers
// This is the offset for the value -1000, used when fetching gain values
const OVERFLOW_OFFSET = 4294967296;

export interface TSuccess {
  result: number;
}

export interface TError {
  errorCode: ErrorCode;
}

type TResult = TSuccess | TError;

const promisifyResult = <Type>(
  responseHandler: (
    arg: TResult,
    resolve: (value: Type | PromiseLike<Type>) => void,
    reject: (reason?: ErrorDescription) => void
  ) => void,
  channel: string
) => {
  return new Promise<Type>((resolve, reject) => {
    let timer: NodeJS.Timeout;

    const handler = (arg: unknown) => {
      responseHandler(arg as TResult, resolve, reject);
      clearTimeout(timer);
    };

    window.electron.ipcRenderer.once(channel, handler);

    timer = setTimeout(() => {
      reject(getErrorDescription(ErrorCode.PEACE_TIMEOUT));
      window.electron.ipcRenderer.removeListener(channel, handler);
    }, TIMEOUT);
  });
};

const buildResponseHandler = <Type>(
  resultEvaluator: (
    result: number,
    resolve: (value: Type | PromiseLike<Type>) => void,
    reject: (reason?: ErrorDescription) => void
  ) => void
) => {
  return (
    arg: TResult,
    resolve: (value: Type | PromiseLike<Type>) => void,
    reject: (reason?: ErrorDescription) => void
  ) => {
    if ('errorCode' in arg) {
      reject(getErrorDescription(arg.errorCode));
      return;
    }
    const { result } = arg as TSuccess;
    resultEvaluator(result, resolve, reject);
  };
};

const setterResponseHandler = buildResponseHandler<void>(
  (result, resolve, reject) => {
    if (result !== 1) {
      reject(getErrorDescription(ErrorCode.PEACE_UNKNOWN_ERROR));
    }
    resolve();
  }
);

/**
 * Get the current main preamplification gain value
 * @returns { Promise<number> } gain - current system gain value in the range [-30, 30]
 */
export const getMainPreAmp = (): Promise<number> => {
  const channel = 'getMainPreAmp';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 5, 5, 0]);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    const MAX_GAIN = 30;
    const MIN_GAIN = -30;

    // If gain is larger than MAX_GAIN, assume that Peace returned an unsigned negative number
    // If after adjusting for the unsigned number gives a positive value, default to -30
    if (result / 1000 > MAX_GAIN && (result - OVERFLOW_OFFSET) / 1000 > 0) {
      resolve(MIN_GAIN);
      return;
    }

    const gain =
      result / 1000 > MAX_GAIN
        ? (result - OVERFLOW_OFFSET) / 1000 // Unsigned negative case
        : result / 1000; // Positive value case

    // Round up any lower gain values up to -30
    resolve(Math.max(gain, MIN_GAIN));
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Adjusts the main preamplification gain value
 * @param {number} gain - new gain value in [-30, 30]
 */
export const setMainPreAmp = (gain: number) => {
  const channel = 'setMainPreAmp';
  if (gain > 30 || gain < -30) {
    throw new Error('Invalid gain value - outside of range [-30, 30]');
  }
  window.electron.ipcRenderer.sendMessage('peace', [
    channel,
    5,
    1,
    gain * 1000,
  ]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Get the current main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @returns { Promise<number> } gain - current system gain value in the range [-30, 30]
 */
export const getGain = (index: number): Promise<number> => {
  const channel = `getGain${index}`;
  window.electron.ipcRenderer.sendMessage('peace', [
    channel,
    100 + index,
    5,
    0,
  ]);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    const MAX_GAIN = 30;
    const MIN_GAIN = -30;

    // If gain is larger than MAX_GAIN, assume that Peace returned an unsigned negative number
    // If after adjusting for the unsigned number gives a positive value, default to -30
    if (result / 1000 > MAX_GAIN && (result - OVERFLOW_OFFSET) / 1000 > 0) {
      resolve(MIN_GAIN);
      return;
    }

    const gain =
      result / 1000 > MAX_GAIN
        ? (result - OVERFLOW_OFFSET) / 1000 // Unsigned negative case
        : result / 1000; // Positive value case

    // Round up any lower gain values up to MIN_GAIN
    resolve(Math.max(gain, MIN_GAIN));
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Adjusts the main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @param {number} gain - new gain value in [-30, 30]
 */
export const setGain = (index: number, gain: number) => {
  const channel = `setGain${index}`;
  if (gain > 30 || gain < -30) {
    throw new Error('Invalid gain value - outside of range [-30, 30]');
  }
  window.electron.ipcRenderer.sendMessage('peace', [
    channel,
    100 + index,
    1,
    gain * 1000,
  ]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Get the current main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @returns { Promise<number> } gain - current system gain value in the range [-30, 30]
 */
export const getFrequency = (index: number): Promise<number> => {
  const channel = `getFrequency${index}`;
  window.electron.ipcRenderer.sendMessage('peace', [
    channel,
    100 + index,
    8,
    0,
  ]);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    const MAX_FREQUENCY = 22050;
    const MIN_FREQUENCY = 10;

    // If gain is larger than the MAX_FREQUENCY, assume that Peace returned an unsigned negative number
    // Since frequency shouldn't be negative, default to the MIN_FREQUENCY
    if (result > MAX_FREQUENCY) {
      resolve(MIN_FREQUENCY);
    }

    // Round up any lower frequency values up to MIN_FREQUENCY
    const frequency = Math.max(result, MIN_FREQUENCY);
    resolve(frequency);
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Get program state for Peace. We will use this as a health check call
 * @returns { Promise<void> } exception if Peace is not okay.
 */
export const getProgramState = (): Promise<void> => {
  const channel = 'getProgramState';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 0, 0]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Enable Equalizer
 * @returns { Promise<void> } exception if failed.
 */
export const enableEqualizer = (): Promise<void> => {
  const channel = 'enableEqualizer';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 3, 0]);
  const responseHandler = buildResponseHandler<void>(
    (result, resolve, reject) => {
      if (result !== 1) {
        reject(getErrorDescription(0));
      }
      resolve();
    }
  );
  return promisifyResult(responseHandler, channel);
};

/**
 * Disable Equalizer
 * @returns { Promise<void> } exception if failed.
 */
export const disableEqualizer = (): Promise<void> => {
  const channel = 'disableEqualizer';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 3, 1]);
  const responseHandler = buildResponseHandler<void>(
    (result, resolve, reject) => {
      if (result !== 2) {
        reject(getErrorDescription(0));
      }
      resolve();
    }
  );
  return promisifyResult(responseHandler, channel);
};

/**
 * Get the current equalizer status
 * @returns { Promise<boolean> } true for on, false for off, exception otherwise
 */
export const getEqualizerStatus = (): Promise<boolean> => {
  const channel = 'getEqualizerStatus';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 3, 3, 0]);

  const responseHandler = buildResponseHandler<boolean>(
    (result, resolve, reject) => {
      if (result === 1) {
        resolve(true);
      } else if (result === 2) {
        resolve(false);
      } else {
        reject(getErrorDescription(0));
      }
    }
  );
  return promisifyResult(responseHandler, channel);
};
