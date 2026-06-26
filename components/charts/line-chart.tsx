"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export function LineChart() {
  return (
    <Line
      data={{
        labels: ["月", "火", "水", "木", "金", "土", "日"],
        datasets: [
          {
            label: "契約率",
            data: [54, 58, 62, 61, 67, 72, 75],
            borderColor: "#0071e3",
            backgroundColor: "rgba(0, 113, 227, 0.12)",
            tension: 0.4,
            fill: true
          },
          {
            label: "平均点",
            data: [68, 70, 71, 73, 76, 78, 81],
            borderColor: "#0a7f4f",
            backgroundColor: "rgba(10, 127, 79, 0.08)",
            tension: 0.4,
            fill: true
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: { suggestedMin: 0, suggestedMax: 100, grid: { color: "#eef0f3" } },
          x: { grid: { display: false } }
        }
      }}
    />
  );
}
