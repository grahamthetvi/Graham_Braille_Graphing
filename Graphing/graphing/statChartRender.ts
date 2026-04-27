export type StatDatum = {
  label: string;
  value: number;
  x?: number;
  y?: number;
};

export function renderBarChart(
  ctx: CanvasRenderingContext2D,
  data: StatDatum[],
  width: number,
  height: number
): void {
  const margin = { top: 60, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = (chartWidth / data.length) * 0.8;
  const barSpacing = (chartWidth / data.length) * 0.2;

  data.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = margin.left + i * (barWidth + barSpacing) + barSpacing / 2;
    const y = margin.top + chartHeight - barHeight;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(d.label, x + barWidth / 2, height - 20);
    ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);
  });

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.moveTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();
}

export function renderPieChart(
  ctx: CanvasRenderingContext2D,
  data: StatDatum[],
  width: number,
  height: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

  let currentAngle = -Math.PI / 2;

  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(d.label, labelX, labelY);

    currentAngle += sliceAngle;
  });

  data.forEach((d, i) => {
    const legendY = 20 + i * 25;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(width - 120, legendY, 15, 15);
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${d.label}: ${d.value}`, width - 100, legendY + 12);
  });
}

export function renderScatterPlot(
  ctx: CanvasRenderingContext2D,
  data: StatDatum[],
  width: number,
  height: number
): void {
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xValues = data.map((d) => d.x ?? 0);
  const yValues = data.map((d) => d.y ?? 0);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.moveTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();

  data.forEach((d) => {
    const x = margin.left + (((d.x ?? 0) - xMin) / xSpan) * chartWidth;
    const y = margin.top + chartHeight - (((d.y ?? 0) - yMin) / ySpan) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#e11d48";
    ctx.fill();
    ctx.strokeStyle = "#be185d";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.fillStyle = "#333";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("X 轴", width / 2, height - 10);

  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Y 轴", 0, 0);
  ctx.restore();
}
