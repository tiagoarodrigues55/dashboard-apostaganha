/**
 * Dashboard interativo (client component) com filtros e modos de visualização.
 */
'use client';

import { useMemo, useRef, useState } from 'react';
import {
  brains,
  headcountByMonth,
  monthlyMetrics,
  moveoPeriod,
  totalVolumes,
  volumeIaVsHuman,
  zendeskPeriod,
  monthsOrder,
  type MetricKey
} from '../lib/dashboardData';

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function LineAreaChart({
  data,
  color = '#7dd0ff',
  secondary,
  height = 210
}: {
  data: { month: string; value: number }[];
  color?: string;
  secondary?: { month: string; value: number }[];
  height?: number;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const padding = 28;
  const width = 700;
  const maxValue = Math.max(...data.map((d) => d.value), ...(secondary ? secondary.map((d) => d.value) : [0]));
  const stepX = (width - padding * 2) / (data.length - 1 || 1);

  const buildPoints = (list: { month: string; value: number }[]) =>
    list.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (d.value / maxValue) * (height - padding * 2);
      return [x, y];
    });

  const mainPoints = buildPoints(data);
  const secondaryPoints = secondary ? buildPoints(secondary) : [];

  const path = mainPoints
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point[0]},${point[1]}`)
    .join(' ');
  const area = `${path} L ${mainPoints[mainPoints.length - 1][0]},${height - padding} L ${padding},${height - padding} Z`;

  const secondaryPath = secondaryPoints
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point[0]},${point[1]}`)
    .join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="area" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#area)" stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {secondary && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#9ef0c9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 6"
          />
        )}
        {mainPoints.map(([x, y], idx) => (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={5}
            fill={color}
            stroke="var(--panel)"
            strokeWidth="2"
            onMouseEnter={() => setTooltip({ x, y, label: data[idx].month, value: data[idx].value })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {data.map((d, idx) => (
          <text key={d.month} x={padding + idx * stepX} y={height - padding + 16} fill="#93a7c0" fontSize="11" textAnchor="middle">
            {d.month}
          </text>
        ))}
      </svg>
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`
          }}
        >
          <strong>{tooltip.label}</strong>
          <span>{tooltip.value}%</span>
        </div>
      )}
    </div>
  );
}

function DualBarChart({
  data,
  primaryLabel,
  secondaryLabel
}: {
  data: { month: string; ia: number; human: number }[];
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const maxValue = Math.max(...data.flatMap((d) => [d.ia, d.human]));
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <div className="legend">
        <span className="badge">
          <span className="dot" style={{ background: 'var(--accent)' }} />
          {primaryLabel}
        </span>
        <span className="badge">
          <span className="dot" style={{ background: 'var(--accent-2)' }} />
          {secondaryLabel}
        </span>
      </div>
      <div className="bar-group">
        {data.map((d) => {
          const iaHeight = (d.ia / maxValue) * 170;
          const humanHeight = (d.human / maxValue) * 170;
          return (
            <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 180 }}>
                <div
                  className="bar"
                  style={{ height: `${iaHeight}px` }}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = clamp(e.clientX - rect.left, 70, rect.width - 70);
                    const y = clamp(e.clientY - rect.top, 40, rect.height - 40);
                    setTooltip({ x, y, label: `${d.month} • ${primaryLabel}`, value: d.ia });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
                <div
                  className="bar secondary"
                  style={{ height: `${humanHeight}px` }}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = clamp(e.clientX - rect.left, 70, rect.width - 70);
                    const y = clamp(e.clientY - rect.top, 40, rect.height - 40);
                    setTooltip({ x, y, label: `${d.month} • ${secondaryLabel}`, value: d.human });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              </div>
              <div className="bar-labels">{d.month}</div>
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong>
          <span>{formatNumber(tooltip.value)}</span>
        </div>
      )}
    </div>
  );
}

function VolumeVsHeadcountChart() {
  const maxVolume = Math.max(...totalVolumes.map((d) => d.total));
  const maxHeadcount = Math.max(...headcountByMonth.map((d) => d.value));
  const height = 230;
  const padding = 28;
  const width = 700;
  const volumeStep = (width - padding * 2) / (totalVolumes.length - 1 || 1);
  const headcountStep = (width - padding * 2) / (headcountByMonth.length - 1 || 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number; type: 'volume' | 'headcount' } | null>(
    null
  );

  const volumePoints = totalVolumes.map((d, i) => {
    const x = padding + i * volumeStep;
    const y = height - padding - (d.total / maxVolume) * (height - padding * 2);
    return [x, y];
  });

  const headcountPoints = headcountByMonth.map((d, i) => {
    const x = padding + i * headcountStep;
    const y = height - padding - (d.value / maxHeadcount) * (height - padding * 2);
    return [x, y];
  });

  const volumePath = volumePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const volumeArea = `${volumePath} L ${volumePoints[volumePoints.length - 1][0]},${height - padding} L ${padding},${height - padding} Z`;
  const headcountPath = headcountPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <div className="legend">
        <span className="badge">
          <span className="dot" style={{ background: '#f4c076' }} /> Volumetria total
        </span>
        <span className="badge">
          <span className="dot" style={{ background: '#9ef0c9' }} /> Headcount (linha tracejada)
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="volume" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f4c076" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f4c076" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={volumeArea} fill="url(#volume)" stroke="none" />
        <path d={volumePath} fill="none" stroke="#f4c076" strokeWidth="3" strokeLinecap="round" />
        <path
          d={headcountPath}
          fill="none"
          stroke="#9ef0c9"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
        {volumePoints.map(([x, y], idx) => (
          <circle
            key={`vol-${idx}`}
            cx={x}
            cy={y}
            r={5}
            fill="#f4c076"
            stroke="var(--panel)"
            strokeWidth="2"
            onMouseEnter={() => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const scaledX = (x / width) * rect.width;
              const scaledY = (y / height) * rect.height;
              setTooltip({
                x: clamp(scaledX, 70, rect.width - 70),
                y: clamp(scaledY, 40, rect.height - 40),
                label: totalVolumes[idx].month,
                value: totalVolumes[idx].total,
                type: 'volume'
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {headcountPoints.map(([x, y], idx) => (
          <circle
            key={`hc-${idx}`}
            cx={x}
            cy={y}
            r={5}
            fill="#9ef0c9"
            stroke="var(--panel)"
            strokeWidth="2"
            onMouseEnter={() => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const scaledX = (x / width) * rect.width;
              const scaledY = (y / height) * rect.height;
              setTooltip({
                x: clamp(scaledX, 70, rect.width - 70),
                y: clamp(scaledY, 40, rect.height - 40),
                label: headcountByMonth[idx].month,
                value: headcountByMonth[idx].value,
                type: 'headcount'
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {totalVolumes.map((d, idx) => (
          <text key={d.month} x={padding + idx * volumeStep} y={height - padding + 16} fill="#93a7c0" fontSize="11" textAnchor="middle">
            {d.month}
          </text>
        ))}
      </svg>
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong>
          <span>
            {tooltip.type === 'volume' ? `${formatNumber(tooltip.value)} atendimentos` : `${tooltip.value} agentes`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const headcountStart = headcountByMonth[0].value;
  const headcountNow = headcountByMonth[headcountByMonth.length - 1].value;
  const headcountDrop = ((headcountStart - headcountNow) / headcountStart) * 100;

  const selectedMetric: MetricKey = 'containment';
  const metricSeries = monthlyMetrics[selectedMetric];
  const containmentStart = metricSeries[0].value;
  const containmentEnd = metricSeries[metricSeries.length - 1].value;
  const containmentDelta = containmentEnd - containmentStart;

  const transferBaseline = 100 - containmentStart;
  const transferCurrent = 100 - containmentEnd;
  const transferDelta = ((transferBaseline - transferCurrent) / transferBaseline) * 100;

  const ahtDelta = ((zendeskPeriod.aht - moveoPeriod.aht) / zendeskPeriod.aht) * 100;

  const [metricFilter, setMetricFilter] = useState<MetricKey>('containment');
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [stacked, setStacked] = useState<boolean>(true);
  const [brainSort, setBrainSort] = useState<'conversations' | 'messages' | 'clients'>('conversations');
  const [tooltipBar, setTooltipBar] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const barMetricRef = useRef<HTMLDivElement>(null);
  const stackedRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const [tooltipCompare, setTooltipCompare] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  const metricData = monthlyMetrics[metricFilter];
  const containmentTrend = monthlyMetrics['containment'];

  const sortedBrains = useMemo(
    () => [...brains].sort((a, b) => (b[brainSort] ?? 0) - (a[brainSort] ?? 0)),
    [brainSort]
  );

  const barsForMetric = useMemo(() => {
    const maxValue = Math.max(...metricData.map((d) => d.value));
    return metricData.map((d) => ({
      ...d,
      height: (d.value / maxValue) * 170
    }));
  }, [metricData]);

  return (
    <main>
      <header className="header">
        <div className="headline">
          <div className="pill">Dashboard Executivo</div>
          <div className="pill">Mar-Jul (Zendesk) vs Jul-Nov (Moveo)</div>
        </div>
        <h1>Evolução e Impacto da IA Moveo</h1>
        <p className="subtitle">
          Maturidade do agente de IA, ganho de eficiência operacional e performance comparada ao período anterior, evidenciando que a
          operação manteve/expandiu volume mesmo com redução drástica de headcount.
        </p>
      </header>

      <section className="kpi-cards">
        <div className="kpi">
          <small>Taxa de contenção atual</small>
          <strong>{containmentEnd}%</strong>
          <span className="delta">+{containmentDelta.toFixed(0)} p.p. desde Jul</span>
        </div>
        <div className="kpi">
          <small>Headcount humano</small>
          <strong>{headcountStart} ➜ {headcountNow} agentes</strong>
          <span className="delta">-{headcountDrop.toFixed(0)}%</span>
        </div>
        <div className="kpi">
          <small>AHT humano</small>
          <strong>{moveoPeriod.aht.toFixed(1)} min</strong>
          <span className="delta">{ahtDelta.toFixed(1)}% vs Zendesk</span>
        </div>
        <div className="kpi">
          <small>Δ CSAT / Δ Transferência</small>
          <strong>Preencher CSAT</strong>
          <span className="delta">Transferência para humano {transferDelta.toFixed(0)}% menor</span>
        </div>
      </section>

      <div className="section-card">
        <h2>Seção 1 — Maturidade do Agente de IA (Autonomia)</h2>
        <p className="label">Evolução mensal de Jul a Nov</p>
        <div className="filters-row">
          <div className="filter">
            <span>Escolha a métrica</span>
            <div className="pill-group">
              {(['containment', 'coverage', 'meaningful'] as MetricKey[]).map((key) => (
                <button
                  key={key}
                  className={`pill-btn ${metricFilter === key ? 'active' : ''}`}
                  onClick={() => setMetricFilter(key)}
                >
                  {key === 'containment' && 'Contenção'}
                  {key === 'coverage' && 'Coverage'}
                  {key === 'meaningful' && '% Meaningful'}
                </button>
              ))}
            </div>
          </div>
          <div className="filter">
            <span>Visualização</span>
            <div className="pill-group">
              {(['line', 'bar'] as const).map((mode) => (
                <button key={mode} className={`pill-btn ${chartMode === mode ? 'active' : ''}`} onClick={() => setChartMode(mode)}>
                  {mode === 'line' ? 'Linha/Área' : 'Barras'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="section-grid">
          <div className="chart-shell">
            <div className="legend">
              <span className="badge">
                <span className="dot" style={{ background: 'var(--accent)' }} />
                {metricFilter === 'containment' && 'Taxa de contenção'}
                {metricFilter === 'coverage' && 'Coverage'}
                {metricFilter === 'meaningful' && '% Meaningful'}
              </span>
            </div>
            {chartMode === 'line' ? (
              <LineAreaChart data={metricData} color="#7dd0ff" />
            ) : (
              <div>
                <div className="bar-group" style={{ position: 'relative' }} ref={barMetricRef}>
                  {barsForMetric.map((d) => (
                    <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        className="bar"
                        style={{ height: `${d.height}px` }}
                        onMouseEnter={(e) => {
                          const container = barMetricRef.current?.getBoundingClientRect();
                          if (!container) return;
                          const x = clamp(e.clientX - container.left, 70, container.width - 70);
                          const y = clamp(e.clientY - container.top, 40, container.height - 40);
                          setTooltipBar({ x, y, label: d.month, value: d.value });
                        }}
                        onMouseLeave={() => setTooltipBar(null)}
                      />
                      <div className="bar-labels">{d.month}</div>
                    </div>
                  ))}
                  {tooltipBar && (
                    <div
                      className="tooltip"
                      style={{
                        left: tooltipBar.x,
                        top: tooltipBar.y
                      }}
                    >
                      <strong>{tooltipBar.label}</strong>
                      <span>{tooltipBar.value}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="chart-shell">
            <div className="filters-row" style={{ marginBottom: 8 }}>
              <div className="filter small">
                <label>
                  <input type="checkbox" checked={stacked} onChange={(e) => setStacked(e.target.checked)} /> Barras empilhadas
                </label>
              </div>
            </div>
            {stacked ? (
              <div>
                <div className="legend">
                  <span className="badge">
                    <span className="dot" style={{ background: 'var(--accent)' }} />
                    IA
                  </span>
                  <span className="badge">
                    <span className="dot" style={{ background: 'var(--accent-2)' }} />
                    Humano
                  </span>
                </div>
                <div className="bar-group" style={{ position: 'relative' }} ref={stackedRef}>
                  {volumeIaVsHuman.map((d) => {
                    const maxValue = Math.max(...volumeIaVsHuman.map((v) => v.ia + v.human));
                    const iaHeight = (d.ia / maxValue) * 170;
                    const humanHeight = (d.human / maxValue) * 170;
                    return (
                      <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 180 }}>
                          <div
                            className="bar secondary"
                            style={{ height: `${humanHeight}px`, width: 32 }}
                            onMouseEnter={(e) => {
                              const rect = stackedRef.current?.getBoundingClientRect();
                              if (!rect) return;
                              const x = clamp(e.clientX - rect.left, 80, rect.width - 80);
                              const y = clamp(e.clientY - rect.top, 40, rect.height - 40);
                              setTooltipBar({ x, y, label: `${d.month} • Humano`, value: d.human });
                            }}
                            onMouseLeave={() => setTooltipBar(null)}
                          />
                          <div className="bar" style={{ height: `${iaHeight}px`, width: 32 }} title={`IA: ${formatNumber(d.ia)}`} />
                        </div>
                        <div className="bar-labels">{d.month}</div>
                      </div>
                    );
                  })}
                  {tooltipBar && (
                    <div
                      className="tooltip"
                      style={{
                        left: tooltipBar.x,
                        top: tooltipBar.y
                      }}
                    >
                      <strong>{tooltipBar.label}</strong>
                      <span>{formatNumber(tooltipBar.value)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <DualBarChart data={volumeIaVsHuman} primaryLabel="IA" secondaryLabel="Humano" />
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Seção 2 — Moveo vs Período Zendesk</h2>
        <p className="label">Comparativo consolidado de volumetria e AHT humano</p>
        <div className="section-grid">
          <div className="chart-shell">
            <div className="legend">
              <span className="badge">
                <span className="dot" style={{ background: 'var(--accent)' }} />
                {zendeskPeriod.label}
              </span>
              <span className="badge">
                <span className="dot" style={{ background: 'var(--accent-2)' }} />
                {moveoPeriod.label}
              </span>
            </div>
            <div className="bar-group" style={{ gap: 14, position: 'relative' }} ref={compareRef}>
              {[zendeskPeriod, moveoPeriod].map((period, idx) => {
                const maxVolume = Math.max(zendeskPeriod.totalVolume, moveoPeriod.totalVolume);
                const maxAht = Math.max(zendeskPeriod.aht, moveoPeriod.aht);
                const volumeHeight = (period.totalVolume / maxVolume) * 140;
                const ahtHeight = (period.aht / maxAht) * 140;
                return (
                  <div key={period.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 170 }}>
                      <div
                        className="bar"
                        style={{ height: `${volumeHeight}px`, width: 32 }}
                        onMouseEnter={(e) => {
                          const rect = compareRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          const padding = 140;
                          const x = clamp(e.clientX - rect.left, padding, rect.width - padding);
                          const y = clamp(e.clientY - rect.top, 40, rect.height - 40);
                          setTooltipCompare({ x, y, label: `${period.label} • Volumetria`, value: formatNumber(period.totalVolume) });
                        }}
                        onMouseLeave={() => setTooltipCompare(null)}
                      />
                      <div
                        className="bar secondary"
                        style={{ height: `${ahtHeight}px`, width: 20 }}
                        onMouseEnter={(e) => {
                          const rect = compareRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          const padding = 140;
                          const x = clamp(e.clientX - rect.left, padding, rect.width - padding);
                          const y = clamp(e.clientY - rect.top, 40, rect.height - 40);
                          setTooltipCompare({ x, y, label: `${period.label} • AHT`, value: `${period.aht.toFixed(1)} min` });
                        }}
                        onMouseLeave={() => setTooltipCompare(null)}
                      />
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>{period.label}</div>
                  </div>
                );
              })}
              {tooltipCompare && (
                <div className="tooltip" style={{ left: tooltipCompare.x, top: tooltipCompare.y }}>
                  <strong>{tooltipCompare.label}</strong>
                  <span>{tooltipCompare.value}</span>
                </div>
              )}
            </div>
          </div>
          <div className="chart-shell" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <div className="kpi" style={{ background: 'rgba(125, 208, 255, 0.08)', width: '100%' }}>
              <small>Δ CSAT</small>
              <strong>Preencher</strong>
              <span className="delta">substituir pelo valor da pesquisa</span>
            </div>
            <div className="kpi" style={{ background: 'rgba(158, 240, 201, 0.08)', width: '100%' }}>
              <small>Δ Transferência para humano</small>
              <strong>-{transferDelta.toFixed(0)}%</strong>
              <span className="delta">de 91% (pré) para 38% (atual)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Seção 3 — Eficiência Operacional</h2>
        <p className="label">Headcount despencando, volume sustentado/crescente</p>
        <div className="section-grid">
          <div className="chart-shell">
            <div className="legend">
              <span className="badge">
                <span className="dot" style={{ background: 'var(--accent-2)' }} />
                Headcount humano (Jan-Nov)
              </span>
            </div>
            <LineAreaChart data={headcountByMonth} color="#9ef0c9" />
          </div>
          <div className="chart-shell">
            <VolumeVsHeadcountChart />
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Seção 4 — Eficiência por tipo de agente</h2>
        <p className="label">Cérebros mais acionados (Jul-Nov)</p>
        <div className="badge note">Substituir pelos números da aba "Dados separados por cérebro" assim que disponível.</div>
        <div className="filters-row">
          <div className="filter">
            <span>Ordenar por</span>
            <div className="pill-group">
              {(['conversations', 'messages', 'clients'] as const).map((key) => (
                <button key={key} className={`pill-btn ${brainSort === key ? 'active' : ''}`} onClick={() => setBrainSort(key)}>
                  {key === 'conversations' ? 'Conversas' : key === 'messages' ? 'Mensagens' : 'Clientes'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Cérebro</th>
              <th>Conversas</th>
              <th>Mensagens</th>
              <th>Clientes</th>
            </tr>
          </thead>
          <tbody>
            {sortedBrains.map((brain) => (
              <tr key={brain.name}>
                <td>{brain.name}</td>
                <td>{formatNumber(brain.conversations)}</td>
                <td>{formatNumber(brain.messages)}</td>
                <td>{brain.clients ? formatNumber(brain.clients) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer-note">Dados baseados em dados.csv (linhas 3-31). Ajuste CSAT e cérebros quando os valores reais estiverem disponíveis.</div>
    </main>
  );
}
