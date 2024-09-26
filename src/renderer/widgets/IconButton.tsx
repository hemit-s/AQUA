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

import { KeyboardEvent, MouseEvent, useMemo } from 'react';
import DeleteIcon from 'renderer/icons/DeleteIcon';
import EditIcon from 'renderer/icons/EditIcon';
import GearIcon from 'renderer/icons/GearIcon';
import TimesIcon from 'renderer/icons/TimesIcon';
import TrashIcon from 'renderer/icons/TrashIcon';
import '../styles/IconButton.scss';

export enum IconName {
  EDIT = 'Edit Icon',
  DELETE = 'Delete Icon',
  TRASH = 'Trash Icon',
  GEAR = 'Gear Icon',
  TIMES = 'Close Icon',
}

interface IIconButtonProps {
  icon: IconName;
  isDisabled?: boolean;
  className?: string;
  handleClick: (e?: MouseEvent) => void;
}

const IconButton = ({
  icon,
  isDisabled = false,
  className,
  handleClick,
}: IIconButtonProps) => {
  // Helper for detecting use of the ENTER key
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Enter') {
      handleClick();
    }
  };

  const getIcon = useMemo(() => {
    switch (icon) {
      case IconName.EDIT:
        return <EditIcon />;
      case IconName.DELETE:
        return <DeleteIcon />;
      case IconName.TRASH:
        return <TrashIcon />;
      case IconName.GEAR:
        return <GearIcon />;
      case IconName.TIMES:
        return <TimesIcon />;
      default:
        return null;
    }
  }, [icon]);

  return (
    <div
      role="button"
      aria-label={icon}
      className={`iconButton center ${className}`}
      onKeyUp={onKeyUp}
      onClick={handleClick}
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
    >
      {getIcon}
    </div>
  );
};

export default IconButton;
