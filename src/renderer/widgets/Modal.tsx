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

import '../styles/Modal.scss';
import IconButton, { IconName } from './IconButton';

interface IModalProps {
  onClose?: () => void;
  headerContent?: JSX.Element | string;
  bodyContent?: JSX.Element | string;
  footerContent?: JSX.Element | string;
  className?: string;
}

export default function Modal({
  onClose,
  headerContent,
  bodyContent,
  footerContent,
  className,
}: IModalProps) {
  return (
    <div className={`modal col ${className ?? ''}`}>
      <div className="modal-content">
        <div className="header">
          {headerContent}
          {onClose && (
            <IconButton icon={IconName.TIMES} handleClick={onClose} />
          )}
        </div>
        <div className="body">{bodyContent}</div>
        <div className="footer row">{footerContent}</div>
      </div>
    </div>
  );
}
