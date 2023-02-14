import { useEffect, useState } from 'react';
import NumberInput from '../widgets/NumberInput';
import RangeInput from '../widgets/RangeInput';
import { useAquaContext } from '../utils/AquaContext';
import '../styles/Slider.scss';

interface ISliderProps {
  name: string;
  min: number;
  max: number;
  value: number;
  sliderHeight?: number;
  label?: string;
  setValue: (newValue: number) => Promise<void>;
}

const Slider = ({
  name,
  min,
  max,
  value,
  sliderHeight = 150,
  label,
  setValue,
}: ISliderProps) => {
  const { globalError } = useAquaContext();

  // Local copy of slider value used so that the number input increases smoothly while throttling EQ APO writes
  const [sliderValue, setSliderValue] = useState<number>(value);

  useEffect(() => {
    // TODO: investigate whether this is the best way to synchronize values
    setSliderValue(value);
  }, [value]);

  const handleChangeValue = async (newValue: number) => {
    await setValue(newValue);
  };

  const handleInput = async (newValue: number) => {
    setSliderValue(newValue);
    handleChangeValue(newValue);
  };

  return (
    <div className="col center slider">
      <RangeInput
        name={`${name}-range`}
        value={sliderValue}
        min={min}
        max={max}
        width={sliderHeight}
        handleChange={handleInput}
        handleMouseUp={handleInput}
        isDisabled={!!globalError}
        incrementPrecision={0}
        displayPrecision={2}
      />
      {label && <div>{label}</div>}
      <NumberInput
        name={`${name}-number`}
        value={sliderValue}
        min={min}
        max={max}
        handleSubmit={handleInput}
        isDisabled={!!globalError}
        floatPrecision={2}
        showArrows
      />
    </div>
  );
};

export default Slider;
