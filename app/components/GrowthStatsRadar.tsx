"use client";

import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Radar } from "react-chartjs-2";

import type { GrowthStatRow } from "@/lib/growth-stats";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const AXIS_SHORT: Record<string, string> = {
  discipline: "Discipline",
  growth: "Growth",
  mental_health: "Mental",
  physical_health: "Physical",
  sleep: "Sleep",
  finance: "Finance",
  focus: "Focus",
  relationships: "Relations",
  social: "Social",
};

const PHOSPHOR = "#6aed9f";
const PHOSPHOR_BRIGHT = "#b4ffc8";
const PHOSPHOR_DIM = "#3d8f5c";

const VARIANT_DATASET: Record<
  "window" | "today",
  {
    label: string;
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverBorderColor: string;
  }
> = {
  window: {
    label: "14-day score",
    backgroundColor: "rgba(106, 237, 159, 0.22)",
    borderColor: PHOSPHOR,
    pointBackgroundColor: PHOSPHOR_BRIGHT,
    pointBorderColor: PHOSPHOR_DIM,
    pointHoverBorderColor: PHOSPHOR,
  },
  today: {
    label: "Today score",
    backgroundColor: "rgba(180, 255, 200, 0.16)",
    borderColor: PHOSPHOR_BRIGHT,
    pointBackgroundColor: "#d8ffe6",
    pointBorderColor: PHOSPHOR,
    pointHoverBorderColor: PHOSPHOR_BRIGHT,
  },
};

type GrowthStatsRadarProps = {
  stats: GrowthStatRow[];
  title: string;
  /** `today` = brighter outline; `window` = default 14-day styling */
  variant?: "window" | "today";
  /** Shown under the chart (e.g. missing log) */
  caption?: string | null;
};

export default function GrowthStatsRadar({
  stats,
  title,
  variant = "window",
  caption = null,
}: GrowthStatsRadarProps) {
  if (stats.length === 0) {
    return null;
  }

  const ds = VARIANT_DATASET[variant];
  const labels = stats.map((s) => AXIS_SHORT[s.id] ?? s.label);
  const values = stats.map((s) => Math.min(100, Math.max(0, s.value)));

  const data = {
    labels,
    datasets: [
      {
        label: ds.label,
        data: values,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
        borderWidth: 2,
        pointBackgroundColor: ds.pointBackgroundColor,
        pointBorderColor: ds.pointBorderColor,
        pointBorderWidth: 1,
        pointHoverBackgroundColor: ds.pointBackgroundColor,
        pointHoverBorderColor: ds.pointHoverBorderColor,
      },
    ],
  };

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(items) {
            const i = items[0]?.dataIndex ?? 0;
            return stats[i]?.label ?? "";
          },
          label(ctx) {
            return `${ctx.parsed.r ?? 0}%`;
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 25,
          color: PHOSPHOR_DIM,
          backdropColor: "transparent",
          showLabelBackdrop: false,
          font: { size: 9 },
        },
        grid: { color: "rgba(61, 143, 92, 0.35)" },
        angleLines: { color: "rgba(61, 143, 92, 0.35)" },
        pointLabels: {
          color: PHOSPHOR_BRIGHT,
          font: { size: 10, weight: 500 },
        },
      },
    },
  };

  return (
    <div className="px-2 py-4 sm:px-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-crt-phosphor-dim crt-text-plain">
        {title}
      </p>
      <div className="mx-auto w-full max-w-[min(100%,280px)] sm:max-w-[300px]">
        <Radar data={data} options={options} />
      </div>
      {caption ? (
        <p className="mt-2 text-center text-[10px] leading-snug text-crt-muted crt-text-plain">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
