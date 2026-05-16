import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <p className="text-gray-300 mb-1">{label}</p>
        <p className="font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

export default function SpendingChart({ expenses }) {
  // Build last-20-days cumulative data
  const days = 20;
  const now = Date.now();
  const dayMs = 86400000;

  const data = Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * dayMs;
    const dayEnd = dayStart + dayMs;
    const dayTotal = expenses
      .filter((e) => {
        const t = new Date(e.date || e.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      })
      .reduce((s, e) => s + e.amount, 0);

    const label = new Date(dayStart).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return { label, daily: dayTotal };
  });

  // Convert to cumulative
  let running = 0;
  const chartData = data.map((d) => {
    running += d.daily;
    return { label: d.label, amount: running };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6b7280", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#spendGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#ef4444" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
