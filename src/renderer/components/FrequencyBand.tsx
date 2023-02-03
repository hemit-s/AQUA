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
} from 'common/constants';
import IconButton, { IconName } from 'renderer/widgets/IconButton';
import { ForwardedRef, forwardRef, useMemo, useState } from 'react';
import { useThrottleFuture } from 'renderer/utils/utils';
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
  sliderIndex: number;
  filter: IFilter;
  isMinSliderCount: boolean;
}

const FrequencyBand = forwardRef(
  (
    { sliderIndex, filter, isMinSliderCount }: IFrequencyBandProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const INTERVAL = 100;
    const { globalError, setGlobalError, dispatchFilter } = useAquaContext();
    const [isLoading, setIsLoading] = useState(false);
    const isRemoveDisabled = useMemo(
      () => isMinSliderCount || isLoading,
      [isLoading, isMinSliderCount]
    );

    const throttleSetGain = useThrottleFuture(async (newValue: number) => {
      // Always dispatch first so that we don't see jitter in the sliders.
      // This is because dispatch will trigger the ui rerender and ensure user inputs do not get
      // out of order. This means that the backend will be "behind" what the frontend shows, but
      // thats okay. In case of a backend error, we will rollback to the last backend snapshot.
      // Consider the following case where the user increases the gain twice when we setGain first.
      // On the first increase input, slider updates but we are stuck on setGain.
      // On the second increase input, slider updates and the 2nd setGain is delayed by this hook.
      // Then first setGain finishes and we dispatch. This results in the jitter.
      // 2nd setGain finishes and we dispatch again. Another jitter occurs.
      // Note that the final UI state is correct, but the ui changes are strange.
      dispatchFilter({
        type: FilterActionEnum.GAIN,
        id: filter.id,
        newValue,
      });
      await setGain(sliderIndex, newValue);
    }, INTERVAL);

    const handleGainSubmit = async (newValue: number) => {
      try {
        await throttleSetGain(newValue);
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const handleFrequencySubmit = async (newValue: number) => {
      try {
        await setFrequency(sliderIndex, newValue);
        dispatchFilter({
          type: FilterActionEnum.FREQUENCY,
          id: filter.id,
          newValue,
        });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const handleQualitySubmit = async (newValue: number) => {
      try {
        await setQuality(sliderIndex, newValue);
        dispatchFilter({
          type: FilterActionEnum.QUALITY,
          id: filter.id,
          newValue,
        });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const handleFilterTypeSubmit = async (newValue: string) => {
      try {
        await setType(sliderIndex, newValue);
        dispatchFilter({
          type: FilterActionEnum.TYPE,
          id: filter.id,
          newValue: newValue as FilterTypeEnum,
        });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
    };

    const onRemoveEqualizerSlider = async () => {
      if (isRemoveDisabled) {
        return;
      }

      setIsLoading(true);
      try {
        await removeEqualizerSlider(sliderIndex);
        dispatchFilter({ type: FilterActionEnum.REMOVE, id: filter.id });
      } catch (e) {
        setGlobalError(e as ErrorDescription);
      }
      setIsLoading(false);
    };

    return (
      // Need to specify the id here for the sorting to work
      <div ref={ref} id={filter.id} className="col bandWrapper">
        <IconButton
          icon={IconName.TRASH}
          className="removeFilter"
          handleClick={onRemoveEqualizerSlider}
          isDisabled={isRemoveDisabled}
        />
        <div className="col band">
          <Dropdown
            name={`${filter.frequency}-filter-type`}
            value={filter.type}
            options={FILTER_OPTIONS}
            isDisabled={!!globalError}
            handleChange={handleFilterTypeSubmit}
          />
          <NumberInput
            value={filter.frequency}
            min={MIN_FREQUENCY}
            max={MAX_FREQUENCY}
            name={`${filter.frequency}-frequency`}
            isDisabled={!!globalError}
            showArrows
            handleSubmit={handleFrequencySubmit}
          />
          <div className="col center slider">
            <Slider
              name={`${filter.frequency}-gain`}
              min={MIN_GAIN}
              max={MAX_GAIN}
              value={filter.gain}
              sliderHeight={250}
              setValue={handleGainSubmit}
            />
          </div>
          <NumberInput
            value={filter.quality}
            min={MIN_QUALITY}
            max={MAX_QUALITY}
            name={`${filter.frequency}-quality`}
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
