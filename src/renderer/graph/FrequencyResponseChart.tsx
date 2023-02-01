import { IFilter } from 'common/constants';
import { useEffect, useMemo, useRef } from 'react';
import Spinner from 'renderer/icons/Spinner';
import { useAquaContext } from 'renderer/utils/AquaContext';
import { setMainPreAmp } from 'renderer/utils/equalizerApi';
import { clamp } from 'renderer/utils/utils';
import Chart, { ChartDimensions } from './Chart';
import { ChartData, ChartDataPoint } from './ChartController';
import { getFilterPoints, getTotalPoints } from './utils';

const isFilterEqual = (f1: IFilter, f2: IFilter) => {
  return (
    f1.frequency === f2.frequency &&
    f1.gain === f2.gain &&
    f1.quality === f2.quality &&
    f1.type === f2.type
  );
};

const FrequencyResponseChart = () => {
  const {
    filters,
    isAutoPreAmpOn,
    isGraphViewOn,
    isLoading,
    preAmp,
    setPreAmp,
  } = useAquaContext();
  const prevFilters = useRef<IFilter[]>([]);
  const prevFilterLines = useRef<ChartDataPoint[][]>([]);

  const {
    chartData,
    autoPreAmpValue,
  }: { chartData: ChartData[]; autoPreAmpValue: number } = useMemo(() => {
    // Update filter lines that have changed
    const updatedFilterLines = filters.map((f, index) =>
      index < prevFilters.current.length &&
      isFilterEqual(f, prevFilters.current[index])
        ? prevFilterLines.current[index]
        : getFilterPoints(f)
    );

    // Update past state
    prevFilterLines.current = updatedFilterLines;
    prevFilters.current = filters;

    // Compute and return new chart data
    const data = getTotalPoints(preAmp, updatedFilterLines);

    const highestPoint = data.reduce((previousValue, currentValue) => {
      if (previousValue) {
        return previousValue.y < currentValue.y ? currentValue : previousValue;
      }
      return currentValue;
    });

    return {
      chartData: [
        {
          name: 'Response',
          color: '#ffffff',
          items: data,
        },
      ],
      // Rounding to two decimals
      autoPreAmpValue:
        Math.round(clamp(-1 * (highestPoint.y - preAmp), -30, 30) * 100) / 100,
    };
  }, [filters, preAmp]);

  useEffect(() => {
    if (isAutoPreAmpOn) {
      setMainPreAmp(autoPreAmpValue);
      setPreAmp(autoPreAmpValue);
    }
  }, [autoPreAmpValue, isAutoPreAmpOn, setPreAmp]);

  const dimensions: ChartDimensions = {
    width: 1396,
    height: 380,
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
        <div className="graph-wrapper">
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
