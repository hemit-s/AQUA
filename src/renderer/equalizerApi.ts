import ChannelEnum from 'common/channels';
import {
  ErrorCode,
  ErrorDescription,
  getErrorDescription,
} from 'common/errors';
import { peaceFrequencyOutputToNormal } from 'common/peaceConversions';

const TIMEOUT = 10000;

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
  const channel = ChannelEnum.GET_PREAMP;
  window.electron.ipcRenderer.sendMessage(channel, []);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    resolve(result);
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Adjusts the main preamplification gain value
 * @param {number} gain - new gain value in [-30, 30]
 */
export const setMainPreAmp = (gain: number) => {
  const channel = ChannelEnum.SET_PREAMP;
  if (gain > 30 || gain < -30) {
    throw new Error('Invalid gain value - outside of range [-30, 30]');
  }
  window.electron.ipcRenderer.sendMessage(channel, [gain]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Get the current main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @returns { Promise<number> } gain - current system gain value in the range [-30, 30]
 */
export const getGain = (index: number): Promise<number> => {
  const channel = ChannelEnum.GET_GAIN;
  window.electron.ipcRenderer.sendMessage(channel, [index]);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    resolve(result);
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Adjusts the main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @param {number} gain - new gain value in [-30, 30]
 */
export const setGain = (index: number, gain: number) => {
  const channel = ChannelEnum.SET_GAIN;
  if (gain > 30 || gain < -30) {
    throw new Error('Invalid gain value - outside of range [-30, 30]');
  }
  window.electron.ipcRenderer.sendMessage(channel, [index, gain]);
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

  const responseHandler = buildResponseHandler<number>(
    (result, resolve, reject) => {
      if (result > 22050) {
        reject(getErrorDescription(ErrorCode.NEGATIVE_FREQUENCY));
        return;
      }
      resolve(peaceFrequencyOutputToNormal(result));
    }
  );
  return promisifyResult(responseHandler, channel);
};

/**
 * Get the current main preamplification gain value
 * @param {number} index - index of the slider being adjusted
 * @param {frequency} index - index of the slider being adjusted
 */
export const setFrequency = (index: number, frequency: number) => {
  const channel = `setFrequency${index}`;
  window.electron.ipcRenderer.sendMessage('peace', [
    channel,
    100 + index,
    6,
    frequency,
  ]);

  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    resolve(peaceFrequencyOutputToNormal(result));
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
  const channel = ChannelEnum.SET_ENABLE;
  window.electron.ipcRenderer.sendMessage(channel, [1]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Disable Equalizer
 * @returns { Promise<void> } exception if failed.
 */
export const disableEqualizer = (): Promise<void> => {
  const channel = ChannelEnum.SET_ENABLE;
  window.electron.ipcRenderer.sendMessage(channel, [0]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Get the current equalizer status
 * @returns { Promise<boolean> } true for on, false for off, exception otherwise
 */
export const getEqualizerStatus = (): Promise<boolean> => {
  const channel = ChannelEnum.GET_ENABLE;
  window.electron.ipcRenderer.sendMessage(channel, []);

  const responseHandler = buildResponseHandler<boolean>(
    (result, resolve, reject) => {
      if (result === 0 || result === 1) {
        resolve(result === 1);
      } else {
        reject(getErrorDescription(ErrorCode.PEACE_UNKNOWN_ERROR));
      }
    }
  );
  return promisifyResult(responseHandler, channel);
};

/**
 * Get number of equalizer bands
 * @returns { Promise<number> } exception if failed
 */
export const getEqualizerSliderCount = (): Promise<number> => {
  const channel = 'getEqualizerSliderCount';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 22, 13]);
  const responseHandler = buildResponseHandler<number>((result, resolve) => {
    resolve(result);
  });
  return promisifyResult(responseHandler, channel);
};

/**
 * Add another slider
 * @returns { Promise<void> } exception if failed
 */
export const addEqualizerSlider = (): Promise<void> => {
  const channel = 'addEqualizerSlider';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 22, 14]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Remove rightmost slider
 * @returns { Promise<void> } exception if failed
 */
export const removeEqualizerSlider = (): Promise<void> => {
  const channel = 'removeEqualizerSlider';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 22, 15]);
  return promisifyResult(setterResponseHandler, channel);
};

/**
 * Show Peace window
 * @returns { Promise<void> } exception if failed
 */
export const showPeaceWindow = (): Promise<void> => {
  const channel = 'showPeaceWindow';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 1, 0]);
  const responseHandler = buildResponseHandler<void>(
    (result, resolve, reject) => {
      if (result !== 1 && result !== 2) {
        reject(getErrorDescription(ErrorCode.PEACE_UNKNOWN_ERROR));
      }
      resolve();
    }
  );
  return promisifyResult(responseHandler, channel);
};

/**
 * Close Peace window
 * @returns { Promise<void> } exception if failed
 */
export const closePeaceWindow = (): Promise<void> => {
  const channel = 'closePeaceWindow';
  window.electron.ipcRenderer.sendMessage('peace', [channel, 1, 1]);
  const responseHandler = buildResponseHandler<void>(
    (result, resolve, reject) => {
      if (result !== 1 && result !== 2) {
        reject(getErrorDescription(ErrorCode.PEACE_UNKNOWN_ERROR));
      }
      resolve();
    }
  );
  return promisifyResult(responseHandler, channel);
};
