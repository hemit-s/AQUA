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

const GearIcon = ({ className = '' }: { className?: string }) => {
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
        d="M8.75312 0L7.50623 2.96758C7.25686 3.04239 7.03242 3.16708 6.80798 3.29177L3.8404 2.04489L2.04489 3.8404L3.29177 6.80798C3.16708 7.05736 3.06733 7.25686 2.96758 7.50623L0 8.75312V11.2469L2.96758 12.4938C3.06733 12.7431 3.16708 12.9426 3.29177 13.192L2.04489 16.1596L3.8404 17.9551L6.80798 16.7082C7.03242 16.808 7.25686 16.9327 7.50623 17.0324L8.75312 20H11.2469L12.4938 17.0324C12.7182 16.9327 12.9676 16.8329 13.192 16.7082L16.1596 17.9551L17.9551 16.1596L16.7082 13.192C16.808 12.9676 16.9327 12.7182 17.0324 12.4938L20 11.2469V8.75312L17.0324 7.50623C16.9576 7.2818 16.8329 7.03242 16.7082 6.80798L17.9551 3.8404L16.1596 2.04489L13.192 3.29177C12.9676 3.19202 12.7182 3.06733 12.4938 2.96758L11.2469 0L8.75312 0ZM10 6.23441C12.0698 6.23441 13.7406 7.90524 13.7406 9.97506C13.7406 12.0449 12.0698 13.7157 10 13.7157C7.93017 13.7157 6.25935 12.0449 6.25935 9.97506C6.25935 7.90524 7.93017 6.23441 10 6.23441Z"
        fill="white"
      />
    </svg>
  );
};

export default GearIcon;
