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

import { ErrorDescription } from 'common/errors';
import {
  FilterTypeEnum,
  IFilter,
  MAX_FREQUENCY,
  MAX_GAIN,
  MAX_QUALITY,
  MIN_FREQUENCY,
  MIN_GAIN,
  MIN_QUALITY,
  NO_GAIN_FILTER_TYPES,
} from 'common/constants';
import IconButton, { IconName } from 'renderer/widgets/IconButton';
import {
  ForwardedRef,
  forwardRef,
  useMemo,
  useState,
  WheelEvent,
  CSSProperties,
  useCallback,
  useEffect,
} from 'react';
import { useThrottleAndExecuteLatest } from 'renderer/utils/utils';
import { FILTER_OPTIONS } from '../icons/FilterTypeIcon';
import Dropdown from '../widgets/Dropdown';
import {
  removeEqualizerSlider,
  setFrequency,
  setGain,
  setQuality,
  setType,
} from '../utils/equalizerApi';
import NumberInput from '../widgets/NumberInput';
import { FilterActionEnum, useAquaContext } from '../utils/AquaContext';
import Slider from './Slider';
import '../styles/FrequencyBand.scss';

interface IFrequencyBandProps {
  filter: IFilter;
  isMinSliderCount: boolean;
  style?: CSSProperties;
}

const FrequencyBand = forwardRef(
  (
    { filter, isMinSliderCount, style }: IFrequencyBandProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const INTERVAL = 100;
    const { isGraphViewOn, globalError, setGlobalError, dispatchFilter } =
      useAquaContext();
    const [isLoading, setIsLoading] = useState(false);
    const isRemoveDisabled = useMemo(
      () => isMinSliderCount || isLoading,
      [isLoading, isMinSliderCount]
    );
    // Local copy of quality/freq value used so that the number input increases smoothly while throttling EQ APO writes
    const [qualityValue, setQualityValue] = useState<number>(filter.quality);
    const [frequencyValue, setFrequencyValue] = useState<number>(
      filter.frequency
    );

    useEffect(() => {
      setQualityValue(filter.quality);
    }, [filter.quality]);

    useEffect(() => {
      setFrequencyValue(filter.frequency);
    }, [filter.frequency]);

    // *** Define functions for updating filter values and obtain throttled versions of them  ***
    const normalSetGain = useCallback(
      async (newValue: number) => {
        /*
      Always dispatch first so that we don't see jitter in the sliders.
      This is because dispatch will trigger the ui rerender and ensure user inputs do not get
      out of order. This means that the backend will be "behind" what the frontend shows, but
      thats okay. In case of a backend error, we will rollback to the last backend snapshot.
      Consider the following case where the user increases the gain twice when we setGain first.
      On the first increase input, slider updates but we are stuck on setGain.
      On the second increase input, slider updates and the 2nd setGain is delayed by this hook.
      Then first setGain finishes and we dispatch. This results in the jitter.
      2nd setGain finishes and we dispatch again. Another jitter occurs.
      Note that the final UI state is correct, but the ui changes are strange.
    */
        try {
          dispatchFilter({
            type: FilterActionEnum.GAIN,
            id: filter.id,
            newValue,
          });
          await setGain(filter.id, newValue);
        } catch (e) {
          setGlobalError(e as ErrorDescription);
        }
      },
      [dispatchFilter, filter.id, setGlobalError]
    );

    const throttleSetGain = useThrottleAndExecuteLatest(
      normalSetGain,
      INTERVAL
    );

    const normalSetQuality = useCallback(
      async (newValue: number) => {
        dispatchFilter({
          type: FilterActionEnum.QUALITY,
          id: filter.id,
          newValue,
        });
        await setQuality(filter.id, newValue);
      },
      [dispatchFilter, filter.id]
    );

    const throttleSetQuality = useThrottleAndExecuteLatest(
      normalSetQuality,
      INTERVAL
    );

    const normalSetFrequency = useCallback(
      async (newValue: number) => {
        dispatchFilter({
          type: FilterActionEnum.FREQUENCY,
          id: filter.id,
          newValue,
        });
        await setFrequency(filter.id, newValue);
      },
      [dispatchFilter, filter.id]
    );

    const throttleSetFrequency = useThrottleAndExecuteLatest(
      normalSetFrequency,
      INTERVAL
    );

    // *** Define handlers for handling changes in gain, frequency, quality and filter type ***
    const handleGainSubmit = useCallback(
      async (newValue: number) => {
        try {
          await throttleSetGain(newValue);
        } catch (e) {
          setGlobalError(e as ErrorDescription);
        }
      },
      [setGlobalError, throttleSetGain]
    );

    const handleFrequencySubmit = async (newValue: number) => {
      setFrequencyValue(newValue);
      try {
        throttleSetFrequency(newValue);
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const handleQualitySubmit = async (newValue: number) => {
      setQualityValue(newValue);
      try {
        throttleSetQuality(newValue);
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const handleFilterTypeSubmit = async (newValue: string) => {
      try {
        await setType(filter.id, newValue);
        dispatchFilter({
          type: FilterActionEnum.TYPE,
          id: filter.id,
          newValue: newValue as FilterTypeEnum,
        });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const isGainDisabled = useMemo(
      () =>
        NO_GAIN_FILTER_TYPES.some((filterType) => filterType === filter.type),
      [filter.type]
    );

    const onRemoveEqualizerSlider = async () => {
      if (isRemoveDisabled) {
        return;
      }

      setIsLoading(true);
      try {
        await removeEqualizerSlider(filter.id);
        dispatchFilter({ type: FilterActionEnum.REMOVE, id: filter.id });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
      setIsLoading(false);
    };

    const onWheelFrequency = (e: WheelEvent) => {
      const ranges = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20];
      const range = ranges.find((bound) => bound <= filter.frequency);
      const offset = range ? range / 10 : 1;
      return e.deltaY < 0
        ? offset // scroll up
        : offset * -1; // scroll down
    };

    const sliderHeight = useMemo(
      // Manually determine slider height
      () => (isGraphViewOn ? '161px' : 'calc(100vh - 465px)'),
      [isGraphViewOn]
    );

    return (
      // Need to specify the id here for the sorting to work
      <div ref={ref} id={filter.id} className="col bandWrapper" style={style}>
        <IconButton
          icon={IconName.TRASH}
          className="removeFilter"
          handleClick={onRemoveEqualizerSlider}
          isDisabled={isRemoveDisabled}
        />
        <div className="col band">
          <Dropdown
            name={`${frequencyValue}-filter-type`}
            value={filter.type}
            options={FILTER_OPTIONS}
            isDisabled={!!globalError}
            handleChange={handleFilterTypeSubmit}
          />
          <NumberInput
            value={frequencyValue}
            min={MIN_FREQUENCY}
            max={MAX_FREQUENCY}
            name={`${frequencyValue}-frequency`}
            isDisabled={!!globalError}
            showArrows
            handleSubmit={handleFrequencySubmit}
            onWheelValueChange={onWheelFrequency}
          />
          <div className="col center slider">
            <Slider
              name={`${frequencyValue}-gain`}
              min={MIN_GAIN}
              max={MAX_GAIN}
              value={filter.gain}
              sliderHeight={sliderHeight}
              setValue={handleGainSubmit}
              isDisabled={isGainDisabled}
            />
          </div>
          <NumberInput
            value={qualityValue}
            min={MIN_QUALITY}
            max={MAX_QUALITY}
            name={`${frequencyValue}-quality`}
            isDisabled={!!globalError}
            floatPrecision={2}
            showArrows
            handleSubmit={handleQualitySubmit}
          />
        </div>
      </div>
    );
  }
);

export default FrequencyBand;
