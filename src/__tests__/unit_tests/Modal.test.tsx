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
import Modal from 'renderer/widgets/Modal';

describe('Modal', () => {
  const headerContent = 'Header';
  const bodyContent = 'Body';
  const footerContent = 'Footer';
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('should render modal', async () => {
    setup(
      <Modal
        headerContent={headerContent}
        bodyContent={bodyContent}
        footerContent={footerContent}
        onClose={onClose}
      />
    );

    expect(screen.getByText(headerContent)).toBeInTheDocument();
    expect(screen.getByText(bodyContent)).toBeInTheDocument();
    expect(screen.getByText(footerContent)).toBeInTheDocument();
    expect(screen.getByLabelText('Close Icon')).toBeInTheDocument();
  });

  it('should be empty', async () => {
    setup(<Modal />);

    expect(screen.queryByText(headerContent)).not.toBeInTheDocument();
    expect(screen.queryByText(bodyContent)).not.toBeInTheDocument();
    expect(screen.queryByText(footerContent)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Close Icon')).not.toBeInTheDocument();
  });

  it('should close when clicked', async () => {
    const { user } = setup(
      <Modal
        headerContent={headerContent}
        bodyContent={bodyContent}
        footerContent={footerContent}
        onClose={onClose}
      />
    );

    const closeIcon = screen.getByLabelText('Close Icon');
    expect(closeIcon).toBeInTheDocument();
    await user.click(closeIcon);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
