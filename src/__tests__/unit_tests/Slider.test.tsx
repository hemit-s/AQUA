import '@testing-library/jest-dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AquaProviderWrapper } from 'renderer/utils/AquaContext';
import defaultAquaContext from '../utils/mockAquaProvider';
import { clearAndType, setup } from '../utils/userEventUtils';
import Slider from '../../renderer/components/Slider';

describe('Slider', () => {
  const name = 'Slider';
  const setValue = jest.fn();

  beforeEach(() => {
    setValue.mockClear();
  });

  it('should render with name and initial value', async () => {
    const testValue = 1;
    await act(async () => {
      setup(
        <AquaProviderWrapper value={defaultAquaContext}>
          <Slider
            name={name}
            min={-5}
            max={5}
            value={testValue}
            setValue={setValue}
          />
        </AquaProviderWrapper>
      );
    });
    const rangeInput = screen.getByLabelText(`${name}-range`);
    await waitFor(() => expect(rangeInput).not.toBeDisabled());
    expect(rangeInput).toHaveValue(`${testValue}`);
    expect(screen.getByLabelText(`${name}-number`)).toHaveValue(`${testValue}`);
  });

  it('should update range to match number', async () => {
    const user = userEvent.setup();
    const testValue = 1;
    await act(async () => {
      setup(
        <AquaProviderWrapper value={defaultAquaContext}>
          <Slider
            name={name}
            min={-5}
            max={5}
            value={testValue}
            setValue={setValue}
          />
        </AquaProviderWrapper>
      );
    });
    const rangeInput = screen.getByLabelText(`${name}-range`);
    const numberInput = screen.getByLabelText(`${name}-number`);
    expect(rangeInput).toHaveValue(`${testValue}`);
    expect(numberInput).toHaveValue(`${testValue}`);

    await clearAndType(user, numberInput, '-6');
    expect(numberInput).toHaveValue('-6');
    expect(rangeInput).toHaveValue(`${testValue}`);

    await user.keyboard('{Enter}');
    expect(numberInput).toHaveValue('-5');
    expect(rangeInput).toHaveValue('-5');
  });

  it('should update number to match range', async () => {
    const testValue = 1;
    await act(async () => {
      setup(
        <AquaProviderWrapper value={defaultAquaContext}>
          <Slider
            name={name}
            min={-5}
            max={5}
            value={testValue}
            setValue={setValue}
          />
        </AquaProviderWrapper>
      );
    });
    const rangeInput = screen.getByLabelText(`${name}-range`);
    const numberInput = screen.getByLabelText(`${name}-number`);
    expect(rangeInput).toHaveValue(`${testValue}`);
    expect(numberInput).toHaveValue(`${testValue}`);

    fireEvent.input(rangeInput, { target: { value: 4 } });
    expect(rangeInput).toHaveValue('4');
    expect(numberInput).toHaveValue('4');
  });
});
