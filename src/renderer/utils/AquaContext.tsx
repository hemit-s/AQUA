import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import {
  FilterTypeEnum,
  getDefaultFilterWithId,
  getDefaultState,
  Filters,
  IState,
} from '../../common/constants';
import { ErrorDescription } from '../../common/errors';
import { cloneFilters } from '../../common/utils';
import { getEqualizerState } from './equalizerApi';

export enum FilterActionEnum {
  INIT,
  FREQUENCY,
  GAIN,
  QUALITY,
  TYPE,
  ADD,
  REMOVE,
}

type NumericalFilterAction =
  | FilterActionEnum.FREQUENCY
  | FilterActionEnum.GAIN
  | FilterActionEnum.QUALITY;

export type FilterAction =
  | { type: FilterActionEnum.INIT; filters: Filters }
  | { type: NumericalFilterAction; id: string; newValue: number }
  | { type: FilterActionEnum.TYPE; id: string; newValue: FilterTypeEnum }
  | { type: FilterActionEnum.ADD; id: string; frequency: number }
  | { type: FilterActionEnum.REMOVE; id: string };

type FilterDispatch = (action: FilterAction) => void;

export interface IAquaContext extends IState {
  isLoading: boolean;
  globalError: ErrorDescription | undefined;
  performHealthCheck: () => void;
  setGlobalError: (newValue?: ErrorDescription) => void;
  setIsEnabled: (newValue: boolean) => void;
  setAutoPreAmpOn: (newValue: boolean) => void;
  setGraphViewOn: (newValue: boolean) => void;
  setPreAmp: (newValue: number) => void;
  dispatchFilter: FilterDispatch;
}

const AquaContext = createContext<IAquaContext | undefined>(undefined);

type IFilterReducer = (filters: Filters, action: FilterAction) => Filters;

const filterReducer: IFilterReducer = (
  filters: Filters,
  action: FilterAction
) => {
  switch (action.type) {
    case FilterActionEnum.INIT:
      return action.filters;
    case FilterActionEnum.FREQUENCY: {
      const filtersCloned = cloneFilters(filters);
      filtersCloned[action.id].frequency = action.newValue;
      return filtersCloned;
    }
    case FilterActionEnum.GAIN: {
      const filtersCloned = cloneFilters(filters);
      console.log(filters);
      filtersCloned[action.id].gain = action.newValue;
      return filtersCloned;
    }
    case FilterActionEnum.QUALITY: {
      const filtersCloned = cloneFilters(filters);
      filtersCloned[action.id].quality = action.newValue;
      return filtersCloned;
    }
    case FilterActionEnum.TYPE: {
      const filtersCloned = cloneFilters(filters);
      filtersCloned[action.id].type = action.newValue;
      return filtersCloned;
    }
    case FilterActionEnum.ADD: {
      const filtersCloned = cloneFilters(filters);
      filtersCloned[action.id] = {
        ...getDefaultFilterWithId(),
        id: action.id,
        frequency: action.frequency,
      };
      return filtersCloned;
    }
    case FilterActionEnum.REMOVE: {
      const filtersCloned = cloneFilters(filters);
      delete filtersCloned[action.id];
      return filtersCloned;
    }
    default:
      // This throw does not actually do anything because
      // we are in a reducer
      throw new Error('Unhandled action type should not occur');
  }
};

export interface IAquaProviderWrapperProps {
  value: IAquaContext;
  children: ReactNode;
}

interface IAquaProviderProps {
  children: ReactNode;
}

export const AquaProviderWrapper = ({
  value,
  children,
}: IAquaProviderWrapperProps) => {
  return <AquaContext.Provider value={value}>{children}</AquaContext.Provider>;
};

export const AquaProvider = ({ children }: IAquaProviderProps) => {
  const [globalError, setGlobalError] = useState<
    ErrorDescription | undefined
  >();

  const DEFAULT_STATE = getDefaultState();

  const [isEnabled, setIsEnabled] = useState<boolean>(DEFAULT_STATE.isEnabled);
  const [isAutoPreAmpOn, setAutoPreAmpOn] = useState<boolean>(
    DEFAULT_STATE.isAutoPreAmpOn
  );
  const [isGraphViewOn, setIsGraphViewOn] = useState<boolean>(
    DEFAULT_STATE.isGraphViewOn
  );
  const [preAmp, setPreAmp] = useState<number>(DEFAULT_STATE.preAmp);
  const [filters, dispatchFilter] = useReducer<IFilterReducer>(
    filterReducer,
    DEFAULT_STATE.filters
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setGraphViewOn = (newValue: boolean) => {
    setIsGraphViewOn(newValue);
    const root = document.getElementById('root');
    root?.setAttribute('class', newValue ? '' : 'minimized');
  };

  const performHealthCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await getEqualizerState();
      setIsEnabled(state.isEnabled);
      setAutoPreAmpOn(state.isAutoPreAmpOn);
      setGraphViewOn(state.isGraphViewOn);
      setPreAmp(state.preAmp);
      dispatchFilter({ type: FilterActionEnum.INIT, filters: state.filters });
      setGlobalError(undefined);
    } catch (e) {
      setGlobalError(e as ErrorDescription);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  return (
    <AquaProviderWrapper
      value={{
        isLoading,
        globalError,
        isEnabled,
        isAutoPreAmpOn,
        isGraphViewOn,
        preAmp,
        filters,
        performHealthCheck,
        setGlobalError,
        setIsEnabled,
        setAutoPreAmpOn,
        setGraphViewOn,
        setPreAmp,
        dispatchFilter,
      }}
    >
      {children}
    </AquaProviderWrapper>
  );
};

export const useAquaContext = () => {
  const context = useContext(AquaContext);
  if (context === undefined) {
    throw new Error('useAquaContext must be used within an AquaProvider');
  }
  return context;
};
