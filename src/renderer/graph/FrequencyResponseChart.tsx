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

import { IFiltersMap, IFilter } from 'common/constants';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Spinner from 'renderer/icons/Spinner';
import { useAquaContext } from 'renderer/utils/AquaContext';
import { setMainPreAmp } from 'renderer/utils/equalizerApi';
import { clamp, useThrottleAndExecuteLatest } from 'renderer/utils/utils';
import { ErrorDescription } from 'common/errors';
import Chart, { ChartDimensions } from './Chart';
import {
  IChartCurveData,
  IChartLineDataPointsById,
  IChartPointData,
} from './ChartController';
import { getFilterLineData, getCombinedLineData } from './utils';
import { GrayScaleEnum } from '../styles/color';

const isFilterEqual = (f1: IFilter, f2: IFilter) => {
  if (!f1 || !f2) {
    return false;
  }

  return (
    f1.frequency === f2.frequency &&
    f1.gain === f2.gain &&
    f1.quality === f2.quality &&
    f1.type === f2.type
  );
};

interface IGraphData {
  chartData: IChartCurveData[];
  autoPreAmpValue: number;
}

const FrequencyResponseChart = () => {
  const {
    filters,
    isAutoPreAmpOn,
    isGraphViewOn,
    isLoading,
    preAmp,
    setGlobalError,
    setPreAmp,
  } = useAquaContext();
  const prevFilters = useRef<IFiltersMap>({});
  const prevFilterLines = useRef<IChartLineDataPointsById>({});

  const { chartData, autoPreAmpValue }: IGraphData = useMemo(() => {
    const controlPointByCurveId: { [id: string]: IChartPointData } = {};

    const updatedFilterLines: IChartLineDataPointsById = {};

    // Update filter lines that have changed
    Object.values(filters).forEach((filter) => {
      // Store control point info
      controlPointByCurveId[filter.id] = {
        x: filter.frequency,
        y: filter.gain,
      };

      // New filters have no previous data
      if (!(filter.id in prevFilters.current)) {
        updatedFilterLines[filter.id] = getFilterLineData(filter);
        return;
      }

      // Recompute filter line if it has been adjusted
      if (!isFilterEqual(filter, prevFilters.current[filter.id])) {
        updatedFilterLines[filter.id] = getFilterLineData(filter);
      } else {
        // Otherwise, reuse previous data
        updatedFilterLines[filter.id] = prevFilterLines.current[filter.id];
      }
    });

    // Update past state
    prevFilterLines.current = updatedFilterLines;
    prevFilters.current = filters;

    // Compute combined line data
    const totalCurveData = getCombinedLineData(preAmp, updatedFilterLines);

    // Compute preAmp line data
    // const preAmpLine = getPreAmpLine(preAmp);

    const highestPoint = totalCurveData.reduce(
      (previousValue, currentValue) => {
        return previousValue.y < currentValue.y ? currentValue : previousValue;
      }
    );

    return {
      chartData: [
        // Do not show preamp line for now
        // {
        //   id: 'PreAmp',
        //   name: 'PreAmp',
        //   line: {
        //     color: ColorEnum.ANALOGOUS2,
        //     strokeWidth: 2,
        //     points: preAmpLine,
        //   },
        // } as IChartCurveData,
        {
          id: 'Total Response',
          name: 'Total Response',
          line: {
            color: GrayScaleEnum.WHITE,
            strokeWidth: 3,
            points: totalCurveData,
          },
        } as IChartCurveData,
        // Do not show individual curves for now
        // ...Object.keys(updatedFilterLines).map((id, index) => {
        //   return {
        //     id,
        //     name: `Filter ${id}`,
        //     line: {
        //       color: getColor(index),
        //       strokeWidth: 2,
        //       points: updatedFilterLines[id],
        //     },
        //     controlPoint: controlPointByCurveId[id],
        //   } as IChartCurveData;
        // }),
      ],
      // Rounding to two decimals
      autoPreAmpValue:
        Math.round(clamp(-1 * (highestPoint.y - preAmp), -30, 30) * 100) / 100,
    };
  }, [filters, preAmp]);

  useEffect(() => {
    const adjustPreAmp = async () => {
      // Don't automatically adjust preamp if state hasn't been fetched yet
      if (!isLoading && isAutoPreAmpOn) {
        try {
          await setMainPreAmp(autoPreAmpValue);
          setPreAmp(autoPreAmpValue);
        } catch (e) {
          setGlobalError(e as ErrorDescription);
        }
      }
    };
    adjustPreAmp();
  }, [autoPreAmpValue, isAutoPreAmpOn, isLoading, setGlobalError, setPreAmp]);

  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const updateDimensions = useCallback(() => {
    const newWidth = ref.current?.clientWidth;
    if (newWidth && newWidth > 0) {
      setWidth(newWidth);
    }
    const newHeight = ref.current?.clientHeight;
    if (newHeight && newHeight > 0) {
      setHeight(newHeight);
    }
  }, []);

  const throttle = useThrottleAndExecuteLatest(updateDimensions, 100);

  useEffect(() => {
    window.addEventListener('resize', throttle);
    return () => window.removeEventListener('resize', throttle);
  }, [throttle]);

  useLayoutEffect(() => {
    // Compute dimensions on initial render and when graph view is toggled
    updateDimensions();
  }, [isGraphViewOn, updateDimensions]);

  const dimensions: ChartDimensions = {
    width,
    height,
    margins: {
      top: 30,
      right: 30,
      bottom: 10,
      left: 30,
    },
  };

  return (
    <>
      {isGraphViewOn && (
        <div className="graph-wrapper" ref={ref}>
          {isLoading ? (
            <div className="center full row">
              <Spinner />
            </div>
          ) : (
            <Chart data={chartData} dimensions={dimensions} />
          )}
        </div>
      )}
    </>
  );
};

export default FrequencyResponseChart;
