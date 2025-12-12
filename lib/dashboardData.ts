export type MonthPoint = { month: string; value: number };

export type PeriodTag = 'zendesk' | 'moveo';

export type MetricKey = 'containment' | 'coverage' | 'meaningful';

export const monthsOrder = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'] as const;

export const monthlyMetrics: Record<MetricKey, { month: string; value: number; period: PeriodTag }[]> = {
  containment: [
    { month: 'Jul', value: 9, period: 'moveo' },
    { month: 'Ago', value: 26, period: 'moveo' },
    { month: 'Set', value: 49, period: 'moveo' },
    { month: 'Out', value: 60, period: 'moveo' },
    { month: 'Nov', value: 62, period: 'moveo' }
  ],
  coverage: [
    { month: 'Jul', value: 51, period: 'moveo' },
    { month: 'Ago', value: 51, period: 'moveo' },
    { month: 'Set', value: 57, period: 'moveo' },
    { month: 'Out', value: 49, period: 'moveo' },
    { month: 'Nov', value: 38, period: 'moveo' }
  ],
  meaningful: [
    { month: 'Jul', value: 11, period: 'moveo' },
    { month: 'Ago', value: 37, period: 'moveo' },
    { month: 'Set', value: 63, period: 'moveo' },
    { month: 'Out', value: 78, period: 'moveo' },
    { month: 'Nov', value: 86, period: 'moveo' }
  ]
};

export const volumeIaVsHuman = [
  { month: 'Jul', ia: 9976, human: 10763 },
  { month: 'Ago', ia: 13331, human: 16617 },
  { month: 'Set', ia: 23411, human: 15267 },
  { month: 'Out', ia: 19919, human: 10955 }
];

export const totalVolumes = [
  { month: 'Jul', total: 11692 },
  { month: 'Ago', total: 20847 },
  { month: 'Set', total: 26523 },
  { month: 'Out', total: 22736 },
  { month: 'Nov', total: 29918 }
];

export const headcountByMonth: MonthPoint[] = [
  { month: 'Jan', value: 40 },
  { month: 'Fev', value: 40 },
  { month: 'Mar', value: 40 },
  { month: 'Abr', value: 32 },
  { month: 'Mai', value: 25 },
  { month: 'Jun', value: 20 },
  { month: 'Jul', value: 16 },
  { month: 'Ago', value: 14 },
  { month: 'Set', value: 13 },
  { month: 'Out', value: 12 },
  { month: 'Nov', value: 12 }
];

export const zendeskPeriod = {
  label: 'Mar-Jul (Zendesk)',
  totalVolume: 98936,
  aht: 16.4
};

export const moveoPeriod = {
  label: 'Jul-Nov (Moveo)',
  totalVolume: 47743,
  aht: 14.8
};

export type BrainRow = { name: string; conversations: number; messages: number; clients?: number };

export const brains: BrainRow[] = [
  { name: 'Transações', conversations: 21700, messages: 129400, clients: 21700 },
  { name: 'Conta', conversations: 2700, messages: 7600, clients: 2700 },
  { name: 'Router Prod Sem Guidelines', conversations: 93600, messages: 195700, clients: 93600 },
  { name: 'Bônus e Promoções', conversations: 20000, messages: 99500, clients: 20000 },
  { name: 'Handover', conversations: 29000, messages: 69600, clients: 29000 },
  { name: 'Fluxo desligado', conversations: 4000, messages: 14100, clients: 4000 },
  { name: 'KYC', conversations: 8300, messages: 23700, clients: 8300 },
  { name: 'Bet', conversations: 5800, messages: 23500, clients: 5800 },
  { name: 'Jogo Responsável', conversations: 3600, messages: 9200, clients: 3600 }
];
