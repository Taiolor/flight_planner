import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AIRLINE_COLORS: Record<string, string> = {
  latam: "#E31837",
  gol: "#FF6600",
  azul: "#003DA5",
  onhappy: "#22C55E",
  desconhecida: "#94A3B8",
};

export type MonthlyFinancialChartPoint = {
  month: string;
  cashBRL: number;
  miles: number;
  avgPrice: number;
};

export type AirlineFinancialChartPoint = {
  name: string;
  airline: string;
  cashBRL: number;
};

export type ProjectionFinancialChartPoint = {
  month: string;
  projetado: number;
  historico: number;
};

export type FinancialChartProps =
  | {
      kind: "monthlyCash" | "cashTrend" | "monthlyMiles";
      data: MonthlyFinancialChartPoint[];
      hideValues: boolean;
      selectedYear?: never;
    }
  | {
      kind: "airlineDistribution" | "airlineComparison";
      data: AirlineFinancialChartPoint[];
      hideValues: boolean;
      selectedYear?: never;
    }
  | {
      kind: "projection";
      data: ProjectionFinancialChartPoint[];
      hideValues: boolean;
      selectedYear: number;
    };

function formatBRL(value: number, hidden: boolean) {
  if (hidden) return "R$ ••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0" };

export default function FinancialChart(props: FinancialChartProps) {
  const { kind, data, hideValues } = props;

  if (kind === "monthlyCash") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" interval="preserveStartEnd" minTickGap={10} tick={{ fontSize: 10 }} />
          <YAxis width={42} tickFormatter={(value: number) => (hideValues ? "R$ ••" : `R$${(value / 1000).toFixed(0)}k`)} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value: number) => [formatBRL(value, hideValues), "Total"]} labelFormatter={(label: string) => `Mês: ${label}`} contentStyle={tooltipStyle} />
          <Bar dataKey="cashBRL" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Gasto (R$)" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "cashTrend") {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" interval="preserveStartEnd" minTickGap={10} tick={{ fontSize: 10 }} />
          <YAxis width={42} tickFormatter={(value: number) => (hideValues ? "R$ ••" : `R$${(value / 1000).toFixed(0)}k`)} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value: number, name: string) => [formatBRL(value, hideValues), name === "cashBRL" ? "Gasto" : "Média/viagem"]} contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="cashBRL" stroke="#3B82F6" strokeWidth={2} fill="url(#cashGrad)" name="cashBRL" />
          <Line type="monotone" dataKey="avgPrice" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="avgPrice" />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={value => (value === "cashBRL" ? "Total mensal" : "Média por viagem")} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "monthlyMiles") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" interval="preserveStartEnd" minTickGap={10} tick={{ fontSize: 10 }} />
          <YAxis width={38} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value: number) => [new Intl.NumberFormat("pt-BR").format(value) + " pts", "Milhas"]} contentStyle={tooltipStyle} />
          <Bar dataKey="miles" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Milhas (pts)" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "airlineDistribution") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="cashBRL" nameKey="name" cx="50%" cy="45%" outerRadius={78} label={false}>
            {data.map(entry => <Cell key={entry.airline} fill={AIRLINE_COLORS[entry.airline] ?? "#94A3B8"} />)}
          </Pie>
          <Tooltip formatter={(value: number) => [formatBRL(value, hideValues), "Total"]} contentStyle={tooltipStyle} />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, lineHeight: "20px" }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "airlineComparison") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 8, left: 38, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tickFormatter={(value: number) => (hideValues ? "R$ ••" : `R$${(value / 1000).toFixed(0)}k`)} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={38} />
          <Tooltip formatter={(value: number) => [formatBRL(value, hideValues), "Total"]} contentStyle={{ borderRadius: 12 }} />
          <Bar dataKey="cashBRL" radius={[0, 6, 6, 0]} name="Total (R$)">
            {data.map(entry => <Cell key={entry.airline} fill={AIRLINE_COLORS[entry.airline] ?? "#94A3B8"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const selectedYear = props.selectedYear ?? new Date().getFullYear();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" interval="preserveStartEnd" minTickGap={10} tick={{ fontSize: 10 }} />
        <YAxis width={42} tickFormatter={(value: number) => (hideValues ? "R$ ••" : `R$${(value / 1000).toFixed(0)}k`)} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value: number, name: string) => [formatBRL(value, hideValues), name === "projetado" ? `Projetado ${selectedYear + 1}` : `Histórico ${selectedYear}`]} contentStyle={{ borderRadius: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={value => (value === "projetado" ? `Projetado ${selectedYear + 1}` : `Histórico ${selectedYear}`)} />
        <Bar dataKey="historico" fill="#94A3B8" radius={[4, 4, 0, 0]} name="historico" />
        <Bar dataKey="projetado" fill="#A855F7" radius={[4, 4, 0, 0]} name="projetado" />
      </BarChart>
    </ResponsiveContainer>
  );
}
