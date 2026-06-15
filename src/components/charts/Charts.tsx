import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { RadarData } from '@/types';

interface PowerRadarProps {
  data: RadarData[];
  size?: number;
  className?: string;
}

export function PowerRadarChart({ data, size = 280, className }: PowerRadarProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="80%">
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#3d2566" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#e5e7eb', fontSize: 11, fontFamily: 'Cinzel, serif', fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickCount={5}
          />
          <Radar
            name="战力"
            dataKey="value"
            stroke="#d4af37"
            strokeWidth={2.5}
            fill="url(#radarGradient)"
            fillOpacity={0.8}
          />
          <Tooltip
            contentStyle={{
              background: '#251444',
              border: '1px solid #d4af37',
              borderRadius: '8px',
              fontFamily: 'Lora, serif',
            }}
            labelStyle={{ color: '#d4af37', fontWeight: 'bold' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { TimeSeriesPoint } from '@/types';

interface LineAreaChartProps {
  data: TimeSeriesPoint[];
  dataKey?: string;
  height?: number;
  color?: string;
  gradientId?: string;
  yLabel?: string;
}

export function LineAreaChart({
  data,
  dataKey = 'value',
  height = 240,
  color = '#4fc3f7',
  gradientId = 'areaGradient',
  yLabel,
}: LineAreaChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d2566" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#3d2566' }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#3d2566' }}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#d4af37', fontSize: 12 } : undefined}
          />
          <Tooltip
            contentStyle={{
              background: '#251444',
              border: '1px solid #7c3aed',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ color: '#e5e7eb' }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: color, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
