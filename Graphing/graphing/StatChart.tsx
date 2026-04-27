"use client";

import { useEffect, useRef } from "react";
import {
  renderBarChart,
  renderPieChart,
  renderScatterPlot,
  type StatDatum,
} from "@/graphing/statChartRender";

type ChartKind = "bar" | "pie" | "scatter";

type StatChartProps = {
  data: StatDatum[];
  type: ChartKind;
  width?: number;
  height?: number;
  title?: string;
  onClose?: () => void;
};

export default function StatChart({
  data,
  type,
  width = 400,
  height = 300,
  title = "Chart",
  onClose,
}: StatChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (type === "bar") renderBarChart(ctx, data, width, height);
    else if (type === "pie") renderPieChart(ctx, data, width, height);
    else renderScatterPlot(ctx, data, width, height);
  }, [data, type, width, height]);

  return (
    <div className="relative rounded-lg bg-white p-4 shadow-lg">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 text-xl font-bold text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      ) : null}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-gray-200"
      />
    </div>
  );
}
