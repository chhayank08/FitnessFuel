import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  className?: string;
}

// Tiny inline trend line for stat cards. Not a chart: no axes, no tooltip —
// the accompanying number carries the value; this shows shape only.
const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 96,
  height = 28,
  stroke = '#857BFF',
  fill = true,
  className = '',
}) => {
  const id = useId();
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;

  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spark-${id})`} />
        </>
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
