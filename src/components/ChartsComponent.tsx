import React, { useState } from 'react';
import { Sparkles, BarChart2, TrendingUp, Compass, Flame } from 'lucide-react';

interface ChartProps {
  decisionData: { name: string; percentage: number }[];
  outcomeData: { name: string; value: number }[];
  regretData: { period: string; level: number }[];
  countryData: { country: string; count: number; avgRegret: number }[];
}

export default function ChartsComponent({ decisionData, outcomeData, regretData, countryData }: ChartProps) {
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  // DONUT PIE CALCULATIONS
  const donutColors = ['#4F8CFF', '#F4B942', '#FF5D5D', '#2ECC71', '#AAB2C0'];
  let accumulatedAngle = 0;

  const donutSlices = decisionData.map((data, idx) => {
    const percentage = data.percentage;
    const angle = (percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    // Convert polar coordinates to Cartesian
    const radius = 70;
    const x0 = 100 + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
    const y0 = 100 + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
    const x1 = 100 + radius * Math.cos((accumulatedAngle - 90) * (Math.PI / 180));
    const y1 = 100 + radius * Math.sin((accumulatedAngle - 90) * (Math.PI / 180));

    const largeArcFlag = angle > 180 ? 1 : 0;

    // SVG path string for a slice
    const d = `
      M 100 100
      L ${x0} ${y0}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x1} ${y1}
      Z
    `;

    return {
      d,
      color: donutColors[idx % donutColors.length],
      name: data.name,
      percentage
    };
  });

  // BAR CHART MAX
  const maxBarValue = Math.max(...outcomeData.map(o => o.value), 1);

  // LINE CHART PATH
  const maxRegretY = 10;
  const lineW = 320;
  const lineH = 140;
  const points = regretData.map((d, i) => {
    const x = (i / (regretData.length - 1)) * (lineW - 40) + 20;
    // inverse height since SVG 0 is at top
    const y = lineH - (d.level / maxRegretY) * (lineH - 30) - 15;
    return { x, y, label: d.period, level: d.level };
  });

  const linePathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPathD = points.length ? `${linePathD} L ${points[points.length - 1].x} ${lineH - 10} L ${points[0].x} ${lineH - 10} Z` : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">

      {/* 1. PIE CHART: DECISION BREAKDOWN */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm text-white flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#4F8CFF]/15 text-[#4F8CFF]">
              <span className="text-[10px] font-bold">Pie</span>
            </span>
            <h3 className="text-sm font-bold">Decision Breakdown (%)</h3>
          </div>
          <p className="text-[11px] text-[#AAB2C0] mt-1">What did people decide to do in this situation?</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* Donut SVG */}
          <div className="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full select-none transform rotate-0 transition-transform">
              {donutSlices.map((slice, i) => (
                <path
                  key={i}
                  d={slice.d}
                  fill={slice.color}
                  stroke="#161B22"
                  strokeWidth="2"
                  onMouseEnter={() => setActiveDonut(i)}
                  onMouseLeave={() => setActiveDonut(null)}
                  className="transition-all duration-150 cursor-pointer hover:opacity-90"
                  style={{
                    transform: activeDonut === i ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: '100px 100px'
                  }}
                />
              ))}
              {/* Inner cutout hole to make it a donut */}
              <circle cx="100" cy="100" r="45" fill="#161B22" />
              
              {/* Center status labels */}
              <foreignObject x="60" y="70" width="80" height="60">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-[10px] uppercase font-bold text-[#AAB2C0] tracking-wider leading-none">
                    {activeDonut !== null ? 'Selected' : 'Primary'}
                  </span>
                  <span className="text-xl font-black text-white mt-1 leading-none">
                    {activeDonut !== null ? `${donutSlices[activeDonut].percentage}%` : `${decisionData[0]?.percentage || 0}%`}
                  </span>
                </div>
              </foreignObject>
            </svg>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 w-full space-y-2">
            {decisionData.map((data, idx) => (
              <div
                key={data.name}
                onMouseEnter={() => setActiveDonut(idx)}
                onMouseLeave={() => setActiveDonut(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeDonut === idx ? 'bg-[#30363D]/50' : 'hover:bg-[#161B22]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                  <span className="text-[11px] font-medium text-[#FFFFFF]/90 truncate max-w-[130px] sm:max-w-xs">{data.name}</span>
                </div>
                <span className="text-xs font-extrabold text-white">{data.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BAR CHART: OUTCOME BREAKDOWN */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm text-white flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-[#2ECC71]">
              <BarChart2 className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold">Long-Term Outcome Frequency</h3>
          </div>
          <p className="text-[11px] text-[#AAB2C0] mt-1">What happened years after making the decision?</p>
        </div>

        <div className="space-y-3.5 mt-2">
          {outcomeData.map((item, idx) => {
            const pct = (item.value / maxBarValue) * 100;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveBar(idx)}
                onMouseLeave={() => setActiveBar(null)}
                className="space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-[#AAB2C0]">
                  <span className={`font-semibold transition-colors ${activeBar === idx ? 'text-[#4F8CFF]' : 'text-white/95'}`}>
                    {item.name}
                  </span>
                  <span className="font-extrabold text-white text-[11px]">{item.value}%</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-[#30363D] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-[#4F8CFF] to-indigo-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  {activeBar === idx && (
                    <div className="absolute top-0 bottom-0 left-0 rounded-full bg-white opacity-20 w-full animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LINE CHART: REGRET OVER TIME */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm text-white flex flex-col justify-between">
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/15 text-purple-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold">Decisional Regret Over Time</h3>
          </div>
          <p className="text-[11px] text-[#AAB2C0] mt-1">Average regret score (1-10) graphed across 5 years of tracking.</p>
        </div>

        <div className="w-full">
          <svg viewBox={`0 0 ${lineW} ${lineH}`} className="w-full h-full overflow-visible select-none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5D5D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="20" y1="15" x2={lineW - 20} y2="15" stroke="#30363D" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="20" y1="70" x2={lineW - 20} y2="70" stroke="#30363D" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="20" y1="125" x2={lineW - 20} y2="125" stroke="#30363D" strokeWidth="1" />

            {/* Gradient Area under curve */}
            {points.length > 0 && <path d={areaPathD} fill="url(#areaGrad)" />}

            {/* Main Path Line */}
            {points.length > 0 && (
              <path
                d={linePathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                className="stroke-red-400"
              />
            )}

            {/* Plot Nodes & Labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  className="fill-red-400 stroke-zinc-900 duration-150 cursor-pointer hover:r-5 hover:fill-white"
                  strokeWidth="2"
                />
                
                {/* Score Above Point */}
                <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[10px] font-black fill-white leading-none">
                  {p.level.toFixed(1)}
                </text>

                {/* X Axis Label */}
                <text x={p.x} y={lineH + 2} textAnchor="middle" className="text-[9px] font-bold fill-[#AAB2C0]">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 4. COUNTRY HEATMAP MATRIX / DENSITY */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm text-white flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#F4B942]/15 text-[#F4B942]">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold">Country Heatmap (Density & Regret)</h3>
          </div>
          <p className="text-[11px] text-[#AAB2C0] mt-1">Cross-referencing reported counts and localized regret score levels.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-1">
          {countryData.slice(0, 4).map((c) => {
            const colorClass = 
              c.avgRegret >= 8 ? 'from-amber-600/30 to-red-600/20 border-red-500/30 hover:border-red-500 text-red-300' :
              c.avgRegret >= 6.5 ? 'from-amber-600/20 to-orange-500/10 border-orange-500/20 hover:border-orange-500 text-orange-200' :
              'from-emerald-600/10 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500 text-emerald-200';

            return (
              <div
                key={c.country}
                className={`rounded-xl border p-3 flex flex-col justify-between bg-gradient-to-br transition-all cursor-crosshair ${colorClass}`}
              >
                <div className="text-xs font-bold text-white truncate">{c.country}</div>
                <div className="mt-2 flex items-baseline justify-between gap-1">
                  <div>
                    <span className="text-[9px] text-[#AAB2C0] uppercase block">Cases Logged</span>
                    <span className="text-sm font-extrabold text-white leading-none">{c.count.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#AAB2C0] uppercase block">Avg Regret</span>
                    <span className="text-xs font-extrabold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                      {c.avgRegret.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
