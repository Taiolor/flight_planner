import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyChartData = Record<string, string | number>;

interface ChartProps {
  data: MonthlyChartData[];
  theme: string;
  hideValues: boolean;
}

interface PriceVariationChartsProps extends ChartProps {
  selectedAirlines: Set<string>;
}

export function AnnualSpendChart({ data, theme, hideValues }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160} className="chart-container">
      <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme === "dark" ? "rgba(100,116,139,0.2)" : "rgba(255,255,255,0.1)"}
        />
        <XAxis
          dataKey="mes"
          tick={{ fill: theme === "dark" ? "#94a3b8" : "#e0f2fe", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: theme === "dark" ? "#94a3b8" : "#e0f2fe", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={value => (value > 0 ? `R$${(value / 1000).toFixed(0)}k` : "")}
        />
        <Tooltip
          contentStyle={{
            background: theme === "dark" ? "#1e293b" : "#1e3a5f",
            border: theme === "dark" ? "1px solid #475569" : "none",
            borderRadius: 8,
            color: "#fff",
          }}
          formatter={(value: number) => [
            hideValues
              ? "••••"
              : `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Total Emitido",
          ]}
          labelStyle={{
            color: theme === "dark" ? "#cbd5e1" : "#e0f2fe",
            fontWeight: 600,
          }}
        />
        <Bar
          dataKey="total"
          fill={theme === "dark" ? "#10b981" : "#34d399"}
          radius={[4, 4, 0, 0]}
          label={{
            position: "top",
            fill: theme === "dark" ? "#22d3ee" : "#06b6d4",
            fontSize: 10,
            formatter: (value: number) =>
              value > 0 ? (hideValues ? "•••" : `R$${(value / 1000).toFixed(1)}k`) : "",
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceVariationCharts({
  data,
  theme,
  hideValues,
  selectedAirlines,
}: PriceVariationChartsProps) {
  const axisFill = theme === "dark" ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    background: theme === "dark" ? "#1e293b" : "#ffffff",
    border: theme === "dark" ? "2px solid #7c3aed" : "2px solid #06b6d4",
    borderRadius: 12,
    color: theme === "dark" ? "#f1f5f9" : "#1e293b",
    boxShadow:
      theme === "dark"
        ? "0 8px 16px rgba(124, 58, 237, 0.2)"
        : "0 8px 16px rgba(6, 182, 212, 0.1)",
    padding: "12px 16px",
  };
  const airlineBars = [
    ["kayak", "Kayak", "#ef4444"],
    ["latam", "LATAM", "#2563eb"],
    ["gol", "Gol", "#eab308"],
    ["azul", "Azul", "#38bdf8"],
    ["onhappy", "Onhappy", "#16a34a"],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
          Preço Médio por Companhia (R$)
        </h3>
        <ResponsiveContainer width="100%" height={320} className="chart-container">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: axisFill }} />
            <YAxis tick={{ fontSize: 12, fill: axisFill }} tickFormatter={value => (hideValues ? "•••" : `R$${value}`)} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [hideValues ? "••••" : `R$ ${value.toFixed(2)}`, ""]}
              labelStyle={{ color: axisFill, fontWeight: 700, fontSize: 14 }}
              cursor={{ fill: theme === "dark" ? "rgba(124, 58, 237, 0.1)" : "rgba(6, 182, 212, 0.1)" }}
            />
            <Legend wrapperStyle={{ color: axisFill }} />
            {airlineBars.map(([id, name, fill]) =>
              selectedAirlines.has(id) ? (
                <Bar key={id} dataKey={id} name={name} fill={fill} radius={[8, 8, 0, 0]} isAnimationActive />
              ) : null
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
          Menor Preço vs. Preço Médio por Mês (R$)
        </h3>
        <ResponsiveContainer width="100%" height={260} className="chart-container">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: axisFill }} />
            <YAxis tick={{ fontSize: 12, fill: axisFill }} tickFormatter={value => (hideValues ? "•••" : `R$${value}`)} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [hideValues ? "••••" : `R$ ${value.toFixed(2)}`, ""]}
              labelStyle={{ color: axisFill, fontWeight: 700, fontSize: 14 }}
              cursor={{ fill: theme === "dark" ? "rgba(124, 58, 237, 0.1)" : "rgba(6, 182, 212, 0.1)" }}
            />
            <Legend wrapperStyle={{ color: axisFill }} />
            <Line type="monotone" dataKey="menor" name="Menor Preço" stroke="#16a34a" strokeWidth={3} dot={{ r: 6, fill: "#16a34a", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 8, fill: "#16a34a", strokeWidth: 2, stroke: "#ffffff" }} connectNulls isAnimationActive />
            <Line type="monotone" dataKey="media" name="Preço Médio" stroke="#f97316" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 7, fill: "#f97316", strokeWidth: 2, stroke: "#ffffff" }} connectNulls isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
