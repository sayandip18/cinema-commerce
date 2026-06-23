import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  fetchDemographics,
  type DemographicsData,
  type DemographicRow,
} from "../api";

const AGE_GROUP_LABELS: Record<string, string> = {
  under_18: "Under 18",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_54": "45–54",
  "55_plus": "55+",
};

const CATEGORY_COLORS: Record<string, string> = {
  Snacks: "#f59e0b",
  Beverages: "#3b82f6",
  Combos: "#10b981",
  Desserts: "#ec4899",
  "Hot Foods": "#ef4444",
  Popcorn: "#8b5cf6",
};

const DEFAULT_COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
];

function buildChartData(breakdown: DemographicRow[]) {
  const grouped = new Map<string, Record<string, number>>();

  for (const row of breakdown) {
    const existing = grouped.get(row.ageGroup) ?? {};
    existing[row.category] = row.totalQuantity;
    grouped.set(row.ageGroup, existing);
  }

  const ageOrder = [
    "under_18",
    "18_24",
    "25_34",
    "35_44",
    "45_54",
    "55_plus",
  ];

  return ageOrder
    .filter((age) => grouped.has(age))
    .map((age) => ({
      ageGroup: AGE_GROUP_LABELS[age] ?? age,
      ...grouped.get(age),
    }));
}

function getCategories(breakdown: DemographicRow[]): string[] {
  return [...new Set(breakdown.map((r) => r.category))];
}

function getCategoryColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export default function Dashboard() {
  const [data, setData] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDemographics()
      .then(setData)
      .catch(() => setError("Failed to load analytics data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-gray-500 text-center py-12">Loading analytics...</p>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (!data || data.breakdown.length === 0) {
    return (
      <p className="text-gray-500 text-center py-12">
        No analytics data available yet.
      </p>
    );
  }

  const chartData = buildChartData(data.breakdown);
  const categories = getCategories(data.breakdown);
  const { summary } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Orders" value={summary.totalOrders.toLocaleString()} />
        <SummaryCard
          label="Total Revenue"
          value={`Rs ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <SummaryCard label="Top Category" value={summary.topCategory} />
        <SummaryCard
          label="Top Age Group"
          value={AGE_GROUP_LABELS[summary.topAgeGroup] ?? summary.topAgeGroup}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Food Orders by Age Group
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {categories.map((category, i) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="a"
                fill={getCategoryColor(category, i)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
