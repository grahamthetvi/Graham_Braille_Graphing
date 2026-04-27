"use client";

import { useEffect, useRef } from "react";
import type { ChartDatum } from "@/graphing/charts/chartTypes";
import { DEFAULT_PIE_COLORS, pieSlicesFromData } from "@/graphing/charts/pieChartLayout";

interface DraggablePieChartProps {
  board: any;
  data: ChartDatum[];
  position: { x: number; y: number };
  onEdit?: () => void;
  onRemove?: () => void;
  onAnimate?: () => void;
  title?: string;
}

export default function DraggablePieChart({
  board,
  data,
  position,
  onEdit,
  onRemove,
  onAnimate,
  title = "Pie chart"
}: DraggablePieChartProps) {
  const chartRef = useRef<any>(null);
  const elementsRef = useRef<any[]>([]);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<any>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!board || !data.length) return;

    // Remove previous elements
    elementsRef.current.forEach(element => {
      if (element && typeof element.remove === 'function') {
        try {
          board.removeObject(element);
        } catch (e) {
          console.warn('Failed to remove element:', e);
        }
      }
    });
    elementsRef.current = [];

    const slices = pieSlicesFromData(data);
    const totalValue = Math.max(data.reduce((s, d) => s + d.value, 0), Number.EPSILON);
    const pieColors = [...DEFAULT_PIE_COLORS];
    const radius = 2;
    const chartSize = 5;

    // Build chart
    const createChart = (baseX: number, baseY: number) => {
      const elements: any[] = [];

      // Card background
      const cardBackground = board.create('polygon', [
        [baseX - chartSize/2 - 0.5, baseY - chartSize/2 - 0.5],
        [baseX + chartSize/2 + 0.5, baseY - chartSize/2 - 0.5], 
        [baseX + chartSize/2 + 0.5, baseY + chartSize/2 + 1.5],
        [baseX - chartSize/2 - 0.5, baseY + chartSize/2 + 1.5]
      ], {
        fillColor: '#ffffff',
        fillOpacity: 0.3,
        strokeColor: 'transparent',
        vertices: { visible: false },
        borders: { visible: false },
        fixed: true
      });
      elements.push(cardBackground);

      // Title
      const titleText = board.create('text', [baseX, baseY + chartSize/2 + 1, title], {
        fontSize: 14,
        fontWeight: 'bold',
        anchorX: 'middle',
        anchorY: 'bottom',
        color: '#1f2937',
        fixed: true
      });
      elements.push(titleText);

      // Pie sectors
      const sectors: any[] = [];
      const labels: any[] = [];
      const values: any[] = [];

      slices.forEach((s) => {
        const { startAngle, endAngle, midAngle, color, label: sliceLabel, percentage } = s;

        const sector = board.create(
          "sector",
          [
            [baseX, baseY],
            [baseX + radius * Math.cos(startAngle), baseY + radius * Math.sin(startAngle)],
            [baseX + radius * Math.cos(endAngle), baseY + radius * Math.sin(endAngle)],
          ],
          {
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWidth: 2,
            fixed: true,
          },
        );

        const labelRadius = radius + 0.8;
        const labelX = baseX + labelRadius * Math.cos(midAngle);
        const labelY = baseY + labelRadius * Math.sin(midAngle);

        const label = board.create("text", [labelX, labelY, sliceLabel], {
          fontSize: 10,
          anchorX: "middle",
          anchorY: "middle",
          color: "#374151",
          fixed: true,
        });

        const percentRadius = radius * 0.7;
        const percentX = baseX + percentRadius * Math.cos(midAngle);
        const percentY = baseY + percentRadius * Math.sin(midAngle);

        const valueText = board.create("text", [percentX, percentY, `${percentage.toFixed(1)}%`], {
          fontSize: 9,
          anchorX: "middle",
          anchorY: "middle",
          color: "#ffffff",
          fontWeight: "bold",
          fixed: true,
        });

        sectors.push(sector);
        labels.push(label);
        values.push(valueText);
        elements.push(sector, label, valueText);
      });

      // Drag handle
      const dragHandle = board.create('point', [baseX, baseY + chartSize/2 + 0.8], {
        size: 6,
        face: 'diamond',
        fillColor: '#10b981',
        strokeColor: '#059669',
        fixed: true,
        name: "📌 Drag",
        highlight: true
      });
      elements.push(dragHandle);

      // Control buttons
      const editButton = board.create('point', [baseX + chartSize/2 + 0.2, baseY + chartSize/2 + 0.5], {
        size: 3,
        face: 'circle',
        fillColor: '#10b981',
        strokeColor: '#059669',
        name: '⚙',
        fixed: true,
        highlight: true
      });

      const animateButton = board.create('point', [baseX + chartSize/2 + 0.2, baseY + chartSize/2 + 0.2], {
        size: 3,
        face: 'circle',
        fillColor: '#6366f1',
        strokeColor: '#4f46e5',
        name: '▶',
        fixed: true,
        highlight: true
      });

      const removeButton = board.create('point', [baseX + chartSize/2 + 0.2, baseY + chartSize/2 - 0.1], {
        size: 3,
        face: 'circle',
        fillColor: '#ef4444',
        strokeColor: '#dc2626',
        name: '×',
        fixed: true,
        highlight: true
      });

      elements.push(editButton, animateButton, removeButton);

      return { elements, dragHandle, editButton, animateButton, removeButton, 
               cardBackground, titleText, sectors, labels, values };
    };

    const chart = createChart(position.x, position.y);
    elementsRef.current = chart.elements;
    let currentChart = chart;

    // Grow sectors from 0° animation
    const animatePieChart = () => {
      if (isAnimatingRef.current) return;
      
      isAnimatingRef.current = true;
      const animationDuration = 2500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        board.suspendUpdate();
        
        try {
          // Remove current sectors, labels, percent text
          [...currentChart.sectors, ...currentChart.labels, ...currentChart.values].forEach(element => {
            try {
              board.removeObject(element);
            } catch (e) {
              // Ignore already-removed objects
            }
          });
          
          // Recreate sectors at current animation progress
          const newSectors: any[] = [];
          const newLabels: any[] = [];
          const newValues: any[] = [];
          let currentAngle = 0;

          data.forEach((d, i) => {
            const percentage = (d.value / totalValue) * 100;
            const finalAngle = (d.value / totalValue) * 2 * Math.PI;
            const animatedAngle = finalAngle * easeOut; // this slice's animated span
            const startAngle = currentAngle;
            const endAngle = currentAngle + animatedAngle;
            
            // Only create sector once span is positive
            if (animatedAngle > 0.01) {
              const sector = board.create('sector', [
                [position.x, position.y],
                [position.x + radius * Math.cos(startAngle), position.y + radius * Math.sin(startAngle)],
                [position.x + radius * Math.cos(endAngle), position.y + radius * Math.sin(endAngle)]
              ], {
                fillColor: pieColors[i % pieColors.length],
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWidth: 2,
                fixed: true
              });
              newSectors.push(sector);

              // Labels when slice is large enough
              if (animatedAngle > finalAngle * 0.3) {
                const midAngle = (startAngle + endAngle) / 2;
                const labelRadius = radius + 0.8;
                const labelX = position.x + labelRadius * Math.cos(midAngle);
                const labelY = position.y + labelRadius * Math.sin(midAngle);

                const label = board.create('text', [labelX, labelY, d.label], {
                  fontSize: 10,
                  anchorX: 'middle',
                  anchorY: 'middle',
                  color: '#374151',
                  fixed: true
                });
                newLabels.push(label);

                // Percent label
                const percentRadius = radius * 0.7;
                const percentX = position.x + percentRadius * Math.cos(midAngle);
                const percentY = position.y + percentRadius * Math.sin(midAngle);
                
                const valueText = board.create('text', [percentX, percentY, `${percentage.toFixed(1)}%`], {
                  fontSize: 9,
                  anchorX: 'middle',
                  anchorY: 'middle',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fixed: true
                });
                newValues.push(valueText);
              }
            }

            // Advance start angle for next slice (full angle)
            currentAngle += finalAngle;
          });
          
          // Refresh chart refs
          currentChart.sectors = newSectors;
          currentChart.labels = newLabels;
          currentChart.values = newValues;
          
          // Refresh element list
          const keptElements = currentChart.elements.filter(el => 
            ![...currentChart.sectors, ...currentChart.labels, ...currentChart.values].includes(el)
          );
          currentChart.elements = [...keptElements, ...newSectors, ...newLabels, ...newValues];
          elementsRef.current = currentChart.elements;
          
        } catch (error) {
          console.warn('Animation error:', error);
        }
        
        board.unsuspendUpdate();
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isAnimatingRef.current = false;
        }
      };
      
      animate();
    };

    // Reposition by rebuilding chart (avoids skew)
    const updateChartPosition = (newX: number, newY: number) => {
      // Tear down current chart
      currentChart.elements.forEach(element => {
        try {
          board.removeObject(element);
        } catch (e) {
          console.warn('Failed to remove element during move:', e);
        }
      });

      // Apply new origin
      position.x = newX;
      position.y = newY;

      // Rebuild chart at new position
      const newChart = createChart(newX, newY);
      currentChart = newChart;
      elementsRef.current = newChart.elements;

      // Re-wire events
      setupEvents(newChart);

      board.update();
    };

    // Event wiring
    const setupEvents = (chartElements: any) => {
      chartElements.editButton.on('up', () => onEdit && onEdit());
      chartElements.animateButton.on('up', () => {
        animatePieChart();
        onAnimate && onAnimate();
      });
      chartElements.removeButton.on('up', () => onRemove && onRemove());

      chartElements.dragHandle.on('down', (e: any) => {
        isDraggingRef.current = true;
        const coords = board.getUsrCoordsOfMouse(e);
        lastMousePosRef.current = { x: coords[0], y: coords[1] };
        e.preventDefault();
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      try {
        const coords = board.getUsrCoordsOfMouse(e);
        const deltaX = coords[0] - lastMousePosRef.current.x;
        const deltaY = coords[1] - lastMousePosRef.current.y;

        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
          updateChartPosition(position.x + deltaX, position.y + deltaY);
          lastMousePosRef.current = { x: coords[0], y: coords[1] };
        }
      } catch (error) {
        console.warn('Error during drag:', error);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    setupEvents(chart);

    const boardElement = board.containerObj;
    if (boardElement) {
      boardElement.addEventListener('mousemove', handleMouseMove);
      boardElement.addEventListener('mouseup', handleMouseUp);
      boardElement.addEventListener('mouseleave', handleMouseUp);
    }

    board.update();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      const boardElement = board.containerObj;
      if (boardElement) {
        boardElement.removeEventListener('mousemove', handleMouseMove);
        boardElement.removeEventListener('mouseup', handleMouseUp);
        boardElement.removeEventListener('mouseleave', handleMouseUp);
      }

      elementsRef.current.forEach(element => {
        try {
          board.removeObject(element);
        } catch (e) {
          console.warn('Failed to remove element:', e);
        }
      });
    };

  }, [board, data, position]);

  return null;
} 