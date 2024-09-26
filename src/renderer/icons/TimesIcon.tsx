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

const TimesIcon = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12.6062 10L16.5152 6.09102C16.9949 5.61133 16.9949 4.83359 16.5152 4.35352L15.6465 3.48477C15.1668 3.00508 14.3891 3.00508 13.909 3.48477L10 7.39375L6.09102 3.48477C5.61133 3.00508 4.83359 3.00508 4.35352 3.48477L3.48477 4.35352C3.00508 4.8332 3.00508 5.61094 3.48477 6.09102L7.39375 10L3.48477 13.909C3.00508 14.3887 3.00508 15.1664 3.48477 15.6465L4.35352 16.5152C4.8332 16.9949 5.61133 16.9949 6.09102 16.5152L10 12.6062L13.909 16.5152C14.3887 16.9949 15.1668 16.9949 15.6465 16.5152L16.5152 15.6465C16.9949 15.1668 16.9949 14.3891 16.5152 13.909L12.6062 10Z"
        fill="white"
      />
    </svg>
  );
};

export default TimesIcon;
