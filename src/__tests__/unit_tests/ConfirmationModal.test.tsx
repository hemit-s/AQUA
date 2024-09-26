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
import { screen } from '@testing-library/react';
import { setup } from '__tests__/utils/userEventUtils';
import mockElectronAPI from '__tests__/utils/mockElectronAPI';
import ConfirmationModal from 'renderer/widgets/ConfirmationModal';

describe('ConfirmationModal', () => {
  const headerText = 'Header';
  const bodyText = 'Body';
  const retryText = 'Close & Retry';
  const exitText = 'Exit';
  const onSubmit = jest.fn();
  const mockClose = jest.fn();

  beforeAll(() => {
    mockElectronAPI({ closeApp: mockClose });
  });

  beforeEach(() => {
    mockClose.mockClear();
    onSubmit.mockClear();
  });

  it('should render confirmation modal', async () => {
    setup(
      <ConfirmationModal
        isLoading={false}
        headerText={headerText}
        bodyText={bodyText}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(headerText)).toBeInTheDocument();
    expect(screen.getByText(bodyText)).toBeInTheDocument();
  });

  it('should be disabled', async () => {
    setup(
      <ConfirmationModal
        isLoading
        headerText={headerText}
        bodyText={bodyText}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(retryText)).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByText(exitText)).toHaveAttribute('aria-disabled', 'true');
  });

  it('should disable retry and enable exit', async () => {
    setup(
      <ConfirmationModal
        isLoading={false}
        isSumbitDisabled
        headerText={headerText}
        bodyText={bodyText}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(retryText)).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByText(exitText)).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('should retry when clicked', async () => {
    const { user } = setup(
      <ConfirmationModal
        isLoading={false}
        headerText={headerText}
        bodyText={bodyText}
        onSubmit={onSubmit}
      />
    );

    const retryButton = screen.getByText(retryText);
    expect(retryButton).toBeInTheDocument();
    await user.click(retryButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should close when clicked', async () => {
    const { user } = setup(
      <ConfirmationModal
        isLoading={false}
        headerText={headerText}
        bodyText={bodyText}
        onSubmit={onSubmit}
      />
    );

    const exitButton = screen.getByText(exitText);
    expect(exitButton).toBeInTheDocument();
    await user.click(exitButton);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
