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

import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-test-renderer';
import { setup } from '__tests__/utils/userEventUtils';
import FilePicker from '../../renderer/widgets/FilePicker';

describe('FilePicker', () => {
  const labelText = 'Select a file';
  const placeholderText = 'No file selected.';
  const handleChange = jest.fn();

  beforeEach(() => {
    handleChange.mockClear();
  });

  it('should render modal and select a file', async () => {
    setup(
      <FilePicker
        label={labelText}
        placeholder={placeholderText}
        isDisabled={false}
        handleChange={handleChange}
      />
    );

    expect(screen.getByText(labelText)).toBeInTheDocument();
    expect(screen.getByText(placeholderText)).toBeInTheDocument();

    const input = screen.getByLabelText(labelText);
    const fakeFile = new File(['hello'], 'hello.txt');
    await act(async () => {
      await waitFor(async () => {
        await userEvent.upload(input, fakeFile);
      });
    });

    expect((input as HTMLInputElement).files).toBeDefined();
    expect((input as HTMLInputElement).files?.[0]).toStrictEqual(fakeFile);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should prevent selecting a file with an invalid file type', async () => {
    setup(
      <FilePicker
        label={labelText}
        placeholder={placeholderText}
        isDisabled={false}
        accept=".png"
        handleChange={handleChange}
      />
    );

    expect(screen.getByText(labelText)).toBeInTheDocument();
    expect(screen.getByText(placeholderText)).toBeInTheDocument();

    const input = screen.getByLabelText(labelText);
    const fakeFile = new File(['hello'], 'hello.txt');
    await act(async () => {
      await waitFor(async () => {
        await userEvent.upload(input, fakeFile);
      });
    });

    expect((input as HTMLInputElement).files).toBeDefined();
    expect((input as HTMLInputElement).files?.length).toBe(0);
    expect(handleChange).toHaveBeenCalledTimes(0);
  });

  it('should be disabled', async () => {
    setup(
      <FilePicker
        label={labelText}
        placeholder={placeholderText}
        isDisabled
        handleChange={handleChange}
      />
    );

    expect(screen.getByText(labelText)).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByLabelText(labelText)).toBeDisabled();
  });
});
