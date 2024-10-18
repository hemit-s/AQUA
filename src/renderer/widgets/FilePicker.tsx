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

import { ChangeEvent, useState } from 'react';
import '../styles/FilePicker.scss';

interface IFilePickerProps {
  label: string;
  placeholder: string;
  accept?: string;
  isDisabled: boolean;
  handleChange: (newValue: File) => void;
}

export default function FilePicker({
  label,
  placeholder,
  accept,
  isDisabled,
  handleChange,
}: IFilePickerProps) {
  const [file, setFile] = useState<File | undefined>(undefined);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    setFile(event.target.files[0]);
    handleChange(event.target.files[0]);
  };

  return (
    <div className="file-picker row">
      {file?.path || placeholder}
      <label
        className="button small"
        htmlFor="filePicker"
        aria-disabled={isDisabled}
      >
        {label}
        <input
          type="file"
          id="filePicker"
          accept={accept}
          onChange={onChange}
          disabled={isDisabled}
        />
      </label>
    </div>
  );
}
