"use client";

import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function RadarChart({ current = [0, 0, 0, 0, 0, 0] }: { current?: number[] }) {
  return (
    <Radar
      data={{
        labels: ["共感", "問診", "検査", "原因説明", "料金", "クロージング"],
        datasets: [
          {
            label: "現在",
            data: current,
            borderColor: "#0071e3",
            backgroundColor: "rgba(0, 113, 227, 0.14)"
          },
          {
            label: "トップスタッフ",
            data: [90, 90, 90, 90, 90, 90],
            borderColor: "#0a7f4f",
            backgroundColor: "rgba(10, 127, 79, 0.08)"
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: { min: 0, max: 100, ticks: { stepSize: 20 } }
        },
        plugins: { legend: { position: "bottom" } }
      }}
    />
  );
}
