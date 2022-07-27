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
import Dropdown from '../widgets/Dropdown';
import {
  setFrequency,
  setGain,
  setQuality,
  setType,
} from '../utils/equalizerApi';
import NumberInput from '../widgets/NumberInput';
import { FilterActionEnum, useAquaContext } from '../utils/AquaContext';
import Slider from './Slider';
import '../styles/MainContent.scss';
import { FILTER_OPTIONS } from '../icons/FilterTypeIcon';

interface IFrequencyBandProps {
  sliderIndex: number;
  filter: IFilter;
}

const FrequencyBand = ({ sliderIndex, filter }: IFrequencyBandProps) => {
  const { globalError, setGlobalError, dispatchFilter } = useAquaContext();

  const handleGainSubmit = async (newValue: number) => {
    try {
      await setGain(sliderIndex, newValue);
      dispatchFilter({
        type: FilterActionEnum.GAIN,
        index: sliderIndex,
        newValue,
      });
    } catch (e) {
      setGlobalError(e as ErrorDescription);
    }
  };

  const handleFrequencySubmit = async (newValue: number) => {
    try {
      await setFrequency(sliderIndex, newValue);
      dispatchFilter({
        type: FilterActionEnum.FREQUENCY,
        index: sliderIndex,
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
        index: sliderIndex,
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
        index: sliderIndex,
        newValue: newValue as FilterTypeEnum,
      });
    } catch (e) {
      setGlobalError(e as ErrorDescription);
    }
  };

  return (
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
        floatPrecision={3}
        showArrows
        handleSubmit={handleQualitySubmit}
      />
    </div>
  );
};

export default FrequencyBand;
