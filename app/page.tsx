/**
 * Dashboard interativo (client component) com filtros e modos de visualização.
 */
'use client';

import { useMemo, useState } from 'react';
import {
  brains,
  headcountByMonth,
  monthlyMetrics,
  moveoPeriod,
  totalVolumes,
  volumeIaVsHuman,
  zendeskPeriod,
  type MetricKey
} from '../lib/dashboardData';

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function LineAreaChart({
  data,
  color = '#7dd0ff',
  secondary,
  height = 210,
  valueFormatter
}: {
  data: { month: string; value: number }[];
  color?: string;
  secondary?: { month: string; value: number }[];
  height?: number;
  valueFormatter?: (value: number) => string;
}) {
  const padding = 28;
  const width = 700;
  const formatValue = valueFormatter ?? ((value: number) => `${value}`);
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
          <circle key={idx} cx={x} cy={y} r={5} fill={color} stroke="var(--panel)" strokeWidth="2" />
        ))}
        {data.map((d, idx) => (
          <text
            key={`${d.month}-value`}
            x={padding + idx * stepX}
            y={Math.max(mainPoints[idx][1] - 12, 16)}
            fill={color}
            fontSize="11"
            textAnchor="middle"
            className="chart-value"
          >
            {formatValue(d.value)}
          </text>
        ))}
        {data.map((d, idx) => (
          <text key={d.month} x={padding + idx * stepX} y={height - padding + 16} fill="#93a7c0" fontSize="11" textAnchor="middle">
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DualBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  valueFormatter
}: {
  data: { month: string; ia: number; human: number }[];
  primaryLabel: string;
  secondaryLabel: string;
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.flatMap((d) => [d.ia, d.human]));
  const formatValue = valueFormatter ?? formatNumber;
  return (
    <div style={{ position: 'relative' }}>
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
                <div className="bar" style={{ height: `${iaHeight}px` }}>
                  <span className="bar-value">{formatValue(d.ia)}</span>
                </div>
                <div className="bar secondary" style={{ height: `${humanHeight}px` }}>
                  <span className="bar-value">{formatValue(d.human)}</span>
                </div>
              </div>
              <div className="bar-labels">{d.month}</div>
            </div>
          );
        })}
      </div>
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
    <div style={{ position: 'relative' }}>
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
          <circle key={`vol-${idx}`} cx={x} cy={y} r={5} fill="#f4c076" stroke="var(--panel)" strokeWidth="2" />
        ))}
        {headcountPoints.map(([x, y], idx) => (
          <circle key={`hc-${idx}`} cx={x} cy={y} r={5} fill="#9ef0c9" stroke="var(--panel)" strokeWidth="2" />
        ))}
        {totalVolumes.map((d, idx) => (
          <text
            key={`${d.month}-volume`}
            x={padding + idx * volumeStep}
            y={Math.max(volumePoints[idx][1] - 12, 16)}
            fill="#f4c076"
            fontSize="11"
            textAnchor="middle"
            className="chart-value"
          >
            {formatNumber(d.total)}
          </text>
        ))}
        {headcountByMonth.map((d, idx) => (
          <text
            key={`${d.month}-headcount`}
            x={padding + idx * headcountStep}
            y={Math.max(headcountPoints[idx][1] - 12, 16)}
            fill="#9ef0c9"
            fontSize="11"
            textAnchor="middle"
            className="chart-value"
          >
            {d.value}
          </text>
        ))}
        {totalVolumes.map((d, idx) => (
          <text key={d.month} x={padding + idx * volumeStep} y={height - padding + 16} fill="#93a7c0" fontSize="11" textAnchor="middle">
            {d.month}
          </text>
        ))}
      </svg>
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

  const metricData = monthlyMetrics[metricFilter];

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

  const roiOldCost = 68000;
  const roiCurrentCost = 50250.5;
  const roiSavings = 17749.5;
  const roiPercent = 59.4;
  const roiBarHeight = 180;
  const roiCurrentHeight = (roiCurrentCost / roiOldCost) * roiBarHeight;

  return (
    <main>
      <header className="header">
        <div className="headline">
          <div className="pill">Relatório Executivo</div>
          <div className="pill">Dados estimados Nov/25</div>
        </div>
        <h1 className="page-title">Relatório de Eficiência Operacional: Escalabilidade e ROI com a Moveo.AI</h1>
        <div className="meta-grid">
          <div className="meta-item">
            <span>Cliente</span>
            <strong>Aposta Ganha</strong>
          </div>
          <div className="meta-item">
            <span>Segmento</span>
            <strong>iGaming</strong>
          </div>
          <div className="meta-item">
            <span>Caso de uso</span>
            <strong>Suporte ao Cliente</strong>
          </div>
        </div>
        <p className="subtitle">
          Maturidade do agente de IA, ganho de eficiência operacional e performance comparada ao período anterior, evidenciando que a
          operação manteve/expandiu volume mesmo com redução drástica de headcount.
        </p>
      </header>

      <div className="section-card highlight">
        <h2>Principal insight: Resumo de Eficiência Operacional (dados estimados referente ao mês de Nov/25)</h2>
        <div className="section-grid">
          <div className="insight-list">
            <div className="insight-item">
              <strong>ROI do Investimento em IA</strong>
              <span>59,4% — Para cada R$ 1,00 investido na Moveo, o cliente economizou R$ 1,59 em folha de pagamento.</span>
            </div>
            <div className="insight-item">
              <strong>Economia Líquida Mensal</strong>
              <span>R$ 17.749,50 — já descontando o valor total investido com a contratação da plataforma Moveo.ai.</span>
            </div>
            <div className="insight-item">
              <strong>Eficiência de Escala</strong>
              <span>+28 PAs reduzidos — capacidade de processar 29k sessões com 70% menos equipe humana.</span>
            </div>
          </div>
          <div className="chart-shell roi-shell">
            <div className="roi-header">
              <div>
                <h3 className="mini-title">Gráfico de ROI (Projeção)</h3>
                <p className="label">Valores em Reais (R$)</p>
              </div>
              <div className="roi-badge">ROI {roiPercent.toFixed(1)}%</div>
            </div>
            <div className="roi-impact">
              <div className="roi-hero">
                <span className="roi-hero-label">Economia líquida mensal</span>
                <strong>{formatCurrency(roiSavings)}</strong>
                <span className="roi-hero-note">Ganho de {formatCurrency(roiOldCost - roiCurrentCost)} frente ao custo fixo.</span>
              </div>
              <div className="roi-chart">
                <div className="roi-bars">
                  <div className="roi-bar-column">
                    <div className="roi-bar-stack" style={{ height: roiBarHeight }}>
                      <div className="roi-bar-bg" style={{ height: roiBarHeight }} />
                      <div className="roi-bar-fill roi-bar-old" style={{ height: roiBarHeight }} />
                      <span className="roi-bar-tag">Custo fixo 40 PAs</span>
                      <span className="roi-bar-value">{formatCurrency(roiOldCost)}</span>
                    </div>
                  </div>
                  <div className="roi-bar-column">
                    <div className="roi-bar-stack" style={{ height: roiBarHeight }}>
                      <div className="roi-bar-bg" style={{ height: roiBarHeight }} />
                      <div className="roi-bar-fill roi-bar-actual" style={{ height: roiCurrentHeight }} />
                      <div className="roi-gap">
                        <span>Ganho de ROI</span>
                        <strong>{formatCurrency(roiSavings)}</strong>
                      </div>
                      <span className="roi-bar-tag">Custo real atual</span>
                      <span className="roi-bar-value">{formatCurrency(roiCurrentCost)}</span>
                    </div>
                  </div>
                </div>
                <svg className="roi-line" viewBox="0 0 320 220" role="img" aria-label="Linha de tendência do ROI">
                  <defs>
                    <linearGradient id="roi-line" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f4c076" />
                      <stop offset="100%" stopColor="#9ef0c9" />
                    </linearGradient>
                  </defs>
                  <line x1="60" y1="30" x2="260" y2={30 + (roiBarHeight - roiCurrentHeight)} stroke="url(#roi-line)" strokeWidth="4" />
                  <circle cx="60" cy="30" r="6" fill="#f4c076" />
                  <circle cx="260" cy={30 + (roiBarHeight - roiCurrentHeight)} r="6" fill="#9ef0c9" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="kpi-cards">
        <div className="kpi">
          <small>Taxa de contenção atual</small>
          <strong>{containmentEnd}%</strong>
          <span className="delta">+{containmentDelta.toFixed(0)} p.p. desde Jul</span>
          <span className="kpi-definition">A porcentagem de conversas que foram respondidas sem intervenção humana.</span>
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
      </section>

      <div className="section-card">
        <h2>Seção 1 — Maturidade do Agente de IA (Autonomia)</h2>
        <p className="label">Evolução mensal de Jul a Nov</p>
        <div className="definitions">
          <span><strong>Contenção:</strong> A porcentagem de conversas que foram respondidas sem intervenção humana.</span>
          <span><strong>Cobertura:</strong> A porcentagem de conversas que foram respondidas sem acionar o gatilho desconhecido.</span>
          <span><strong>% Significativa:</strong> Conversas que obtiveram 2 ou mais interações do agente de IA com o cliente.</span>
        </div>
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
                  {key === 'coverage' && 'Cobertura'}
                  {key === 'meaningful' && '% Significativa'}
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
                {metricFilter === 'coverage' && 'Cobertura'}
                {metricFilter === 'meaningful' && '% Significativa'}
              </span>
            </div>
            {chartMode === 'line' ? (
              <LineAreaChart data={metricData} color="#7dd0ff" valueFormatter={(value) => `${value}%`} />
            ) : (
              <div>
                <div className="bar-group" style={{ position: 'relative' }}>
                  {barsForMetric.map((d) => (
                    <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="bar" style={{ height: `${d.height}px` }}>
                        <span className="bar-value">{d.value}%</span>
                      </div>
                      <div className="bar-labels">{d.month}</div>
                    </div>
                  ))}
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
                <div className="bar-group" style={{ position: 'relative' }}>
                  {volumeIaVsHuman.map((d) => {
                    const maxValue = Math.max(...volumeIaVsHuman.map((v) => v.ia + v.human));
                    const iaHeight = (d.ia / maxValue) * 170;
                    const humanHeight = (d.human / maxValue) * 170;
                    return (
                      <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 180 }}>
                          <div className="bar secondary" style={{ height: `${humanHeight}px`, width: 32 }}>
                            <span className="bar-value inside">{formatNumber(d.human)}</span>
                          </div>
                          <div className="bar" style={{ height: `${iaHeight}px`, width: 32 }}>
                            <span className="bar-value inside">{formatNumber(d.ia)}</span>
                          </div>
                        </div>
                        <div className="bar-labels">{d.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <DualBarChart data={volumeIaVsHuman} primaryLabel="IA" secondaryLabel="Humano" valueFormatter={formatNumber} />
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
            <div className="bar-group" style={{ gap: 14, position: 'relative' }}>
              {[zendeskPeriod, moveoPeriod].map((period, idx) => {
                const maxVolume = Math.max(zendeskPeriod.totalVolume, moveoPeriod.totalVolume);
                const maxAht = Math.max(zendeskPeriod.aht, moveoPeriod.aht);
                const volumeHeight = (period.totalVolume / maxVolume) * 140;
                const ahtHeight = (period.aht / maxAht) * 140;
                return (
                  <div key={period.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 170 }}>
                      <div className="bar" style={{ height: `${volumeHeight}px`, width: 32 }}>
                        <span className="bar-value">{formatNumber(period.totalVolume)}</span>
                      </div>
                      <div className="bar secondary" style={{ height: `${ahtHeight}px`, width: 20 }}>
                        <span className="bar-value">{period.aht.toFixed(1)}m</span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>{period.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-shell" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <div className="kpi" style={{ background: 'rgba(158, 240, 201, 0.08)', width: '100%' }}>
              <small>Δ Transferência para humano</small>
              <strong>-{transferDelta.toFixed(0)}%</strong>
              <span className="delta">de 91% (pré) para 38% (atual)</span>
              <span className="kpi-definition">
                Nosso potencial foi sendo desenvolvido de forma escalada para que o agente de inteligência artificial fosse treinado e
                recebesse conteúdo suficiente para auxiliar o cliente mantendo qualidade no atendimento, reduzindo significativamente a
                transferência para o time de atendimento humano em tarefas repetitivas. Este processo é contínuo para que tenhamos sempre
                melhoria de qualidade do atendimento.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Seção 3 — Eficiência Operacional</h2>
        <p className="label">Headcount despencando, volume sustentado/crescente</p>
        <p className="description">
          Os dados evidenciam o sucesso da nossa estratégia de automação e otimização de processos. A curva divergente — onde o volume
          sobe e o headcount desce — é o principal indicador de ROI tecnológico. Essa eficiência não comprometeu a entrega; pelo
          contrário, indica que nossas ferramentas de autoatendimento e processos internos estão filtrando a demanda de forma inteligente,
          garantindo que o time humano foque apenas em casos de alta complexidade.
        </p>
        <div className="section-grid">
          <div className="chart-shell">
            <div className="legend">
              <span className="badge">
                <span className="dot" style={{ background: 'var(--accent-2)' }} />
                Headcount humano (Jan-Nov)
              </span>
            </div>
            <LineAreaChart data={headcountByMonth} color="#9ef0c9" valueFormatter={(value) => `${value} ag`} />
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

      <div className="section-card">
        <h2>Inteligência Integrada — Transformando Diálogos em Transações Automáticas</h2>
        <p className="label">Próxima evolução da jornada com a IA Moveo</p>
        <p className="description">
          Até este momento, nossa jornada com a IA Moveo foi marcada por um salto em escalabilidade. Conseguimos reduzir o time de
          atendimento humano em 70% (de 40 para 12 agentes) enquanto absorvemos volumes crescentes de demanda, mantendo uma operação 24/7
          de alta qualidade. No entanto, os dados de &quot;Eficiência por tipo de agente&quot; revelam que estamos em uma fase na qual
          podemos ultrapassar o limite no qual um agente de IA informativo pode realizar. Temas como Transações e Bônus já somam mais de
          220 mil mensagens. O volume de &quot;Handover&quot; (29 mil conversas) não é um reflexo de falha na IA, mas sim da ausência de
          autonomia sistêmica: a IA entende o que o cliente quer, mas hoje não possui permissão técnica para executar a solução sozinha.
        </p>
        <h3 className="mini-title">O Próximo Passo: da conversa à resolução (Agente Resolutivo)</h3>
        <p className="description">
          Para quebrar a barreira atual de contenção (62%) e reduzir ainda mais o transbordo para o time humano, o foco estratégico deve
          migrar para Inteligência Aplicada a Integrações. Nossos objetivos são:
        </p>
        <ul className="goals">
          <li>Integração de APIs de Transações: Permitir que a IA verifique status de depósitos, saques e falhas de pagamento em tempo real, eliminando consultas manuais.</li>
          <li>Automação de KYC e Conta: Integrar sistemas de verificação de documentos para que a IA valide e informe pendências de cadastro instantaneamente.</li>
          <li>Gestão Ativa de Bônus: Conectar o &quot;Cérebro de Bônus&quot; ao banco de dados promocional para personalização de ofertas e resolução de dúvidas sobre requisitos de aposta (rollover).</li>
          <li>Redução de Fricção no &quot;Router&quot;: Refinar o roteamento inicial para entender cada vez melhor o problema antes que o cliente seja direcionado imediatamente para um fluxo, reduzindo o número de ruídos neste processo.</li>
        </ul>
        <p className="closing">
          A fase de prova de conceito e ganho de escala está sendo um sucesso. Agora, o futuro da Aposta Ganha reside na Simbiose
          Sistêmica: onde a IA não é apenas uma interface, mas o motor que executa a operação.
        </p>
      </div>

      <div className="footer-note">Dados baseados em dados.csv (linhas 3-31). Ajuste cérebros quando os valores reais estiverem disponíveis.</div>
    </main>
  );
}
