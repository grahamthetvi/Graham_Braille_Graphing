"use client";

import { useEffect, useRef } from "react";
import type { ChartDatum } from "@/graphing/charts/chartTypes";
import {
  barCenterX,
  barHeightForValue,
  chartMaxValue,
  DEFAULT_BAR_SCALE_HEIGHT,
  easeOutCubic,
} from "@/graphing/charts/barChartLayout";

interface DraggableBarChartProps {
  board: any;
  data: ChartDatum[];
  position: { x: number; y: number };
  onEdit?: () => void;
  onRemove?: () => void;
  onAnimate?: () => void;
  title?: string;
}

export default function DraggableBarChart({
  board,
  data,
  position,
  onEdit,
  onRemove,
  onAnimate,
  title = "Bar chart"
}: DraggableBarChartProps) {
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

    const maxValue = chartMaxValue(data);
    const barWidth = 0.6;
    const barSpacing = 1.0;
    const chartWidth = data.length * barSpacing;
    const chartHeight = 4;

    // Build chart elements
    const createChart = (baseX: number, baseY: number) => {
      const elements: any[] = [];

      // Card background
      const cardBackground = board.create('polygon', [
        [baseX - chartWidth/2 - 0.5, baseY - 1],
        [baseX + chartWidth/2 + 0.5, baseY - 1], 
        [baseX + chartWidth/2 + 0.5, baseY + chartHeight + 1],
        [baseX - chartWidth/2 - 0.5, baseY + chartHeight + 1]
      ], {
        fillColor: '#ffffff',
        fillOpacity: 0.3,
        strokeColor: 'transparent',
        strokeWidth: 0,
        vertices: { visible: false },
        borders: { visible: false },
        fixed: true,
        shadow: false,
        highlight: false
      });
      elements.push(cardBackground);

      // Title
      const titleText = board.create('text', [
        baseX, 
        baseY + chartHeight + 0.5, 
        title
      ], {
        fontSize: 14,
        fontWeight: 'bold',
        anchorX: 'middle',
        anchorY: 'bottom',
        color: '#1f2937',
        fixed: true
      });
      elements.push(titleText);

      // Bar chart geometry
      const bars: any[] = [];
      const labels: any[] = [];
      const values: any[] = [];

      data.forEach((d, i) => {
        const barX = barCenterX(baseX, i, data.length, barSpacing);
        const barHeight = barHeightForValue(d.value, maxValue, DEFAULT_BAR_SCALE_HEIGHT);

        // Bar polygon
        const bar = board.create('polygon', [
          [barX - barWidth/2, baseY],
          [barX + barWidth/2, baseY],
          [barX + barWidth/2, baseY + barHeight],
          [barX - barWidth/2, baseY + barHeight]
        ], {
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
          strokeColor: '#1d4ed8',
          strokeWidth: 1,
          vertices: { visible: false },
          borders: { visible: false },
          fixed: true
        });

        // Category label
        const label = board.create('text', [
          barX, 
          baseY - 0.3, 
          d.label
        ], {
          fontSize: 10,
          anchorX: 'middle',
          anchorY: 'top',
          color: '#374151',
          fixed: true
        });

        // Value label
        const valueText = board.create('text', [
          barX, 
          baseY + barHeight + 0.1, 
          d.value.toString()
        ], {
          fontSize: 10,
          anchorX: 'middle',
          anchorY: 'bottom',
          color: '#374151',
          fixed: true
        });

        bars.push(bar);
        labels.push(label);
        values.push(valueText);
        elements.push(bar, label, valueText);
      });

      // Drag handle
      const dragHandle = board.create('point', [
        baseX, 
        baseY + chartHeight + 0.8
      ], {
        size: 6,
        face: 'diamond',
        fillColor: '#10b981',
        strokeColor: '#059669',
        fillOpacity: 0.8,
        strokeWidth: 2,
        fixed: true, // fixed: use custom drag, not JSXGraph point drag
        snapToGrid: false,
        name: "📌 Drag",
        showInfobox: false,
        highlight: true,
        highlightFillColor: '#34d399',
        highlightStrokeColor: '#047857'
      });
      elements.push(dragHandle);

      // Control buttons
      const editButton = board.create('point', [
        baseX + chartWidth/2 + 0.2, 
        baseY + chartHeight + 0.5
      ], {
        size: 3,
        face: 'circle',
        fillColor: '#10b981',
        strokeColor: '#059669',
        strokeWidth: 1,
        name: '⚙',
        fixed: true,
        highlight: true,
        highlightFillColor: '#34d399'
      });

      const animateButton = board.create('point', [
        baseX + chartWidth/2 + 0.2, 
        baseY + chartHeight + 0.2
      ], {
        size: 3,
        face: 'circle',
        fillColor: '#6366f1',
        strokeColor: '#4f46e5',
        strokeWidth: 1,
        name: '▶',
        fixed: true,
        highlight: true,
        highlightFillColor: '#818cf8'
      });

      const removeButton = board.create('point', [
        baseX + chartWidth/2 + 0.2, 
        baseY + chartHeight - 0.1
      ], {
        size: 3,
        face: 'circle',
        fillColor: '#ef4444',
        strokeColor: '#dc2626',
        strokeWidth: 1,
        name: '×',
        fixed: true,
        highlight: true,
        highlightFillColor: '#f87171'
      });

      elements.push(editButton, animateButton, removeButton);

      return {
        elements,
        dragHandle,
        editButton,
        animateButton,
        removeButton,
        cardBackground,
        titleText,
        bars,
        labels,
        values
      };
    };

    // Initial chart
    const chart = createChart(position.x, position.y);
    elementsRef.current = chart.elements;

    // Current chart ref (mutated on drag)
    let currentChart = chart;

    // Bar grow animation
    const animateBars = () => {
      if (isAnimatingRef.current) return; // avoid overlapping animations
      
      isAnimatingRef.current = true;
      const animationDuration = 3000; // 3s animation
      const startTime = Date.now();
      
      const originalHeights = data.map((d) => barHeightForValue(d.value, maxValue, DEFAULT_BAR_SCALE_HEIGHT));

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        const easeOut = easeOutCubic(progress);

        board.suspendUpdate();

        try {
          currentChart.bars.forEach((bar, i) => {
            const targetHeight = originalHeights[i];
            const currentHeight = targetHeight * easeOut;
            const barX = barCenterX(position.x, i, data.length, barSpacing);
            
            // Update top two bar vertices
            const barVertices = bar.vertices;
            if (barVertices && barVertices.length >= 4) {
              barVertices[2].moveTo([barX + barWidth/2, position.y + currentHeight], 0);
              barVertices[3].moveTo([barX - barWidth/2, position.y + currentHeight], 0);
            }
            
            // Reposition value label
            currentChart.values[i].moveTo([barX, position.y + currentHeight + 0.1], 0);
          });
        } catch (error) {
          console.warn('Animation error:', error);
        }
        
        board.unsuspendUpdate();
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isAnimatingRef.current = false;
          animationRef.current = null;
        }
      };
      
      animate();
    };

    // Move chart by translating elements (no rebuild)
    const updateChartPosition = (newX: number, newY: number) => {
      const deltaX = newX - position.x;
      const deltaY = newY - position.y;

      // Suspend board updates
      board.suspendUpdate();
      
      try {
        // Move background
        const bgVertices = currentChart.cardBackground.vertices;
        if (bgVertices && bgVertices.length >= 4) {
          bgVertices[0].moveTo([bgVertices[0].X() + deltaX, bgVertices[0].Y() + deltaY], 0);
          bgVertices[1].moveTo([bgVertices[1].X() + deltaX, bgVertices[1].Y() + deltaY], 0);
          bgVertices[2].moveTo([bgVertices[2].X() + deltaX, bgVertices[2].Y() + deltaY], 0);
          bgVertices[3].moveTo([bgVertices[3].X() + deltaX, bgVertices[3].Y() + deltaY], 0);
        }

        // Move title
        currentChart.titleText.moveTo([currentChart.titleText.X() + deltaX, currentChart.titleText.Y() + deltaY], 0);

        // Move drag handle
        currentChart.dragHandle.moveTo([currentChart.dragHandle.X() + deltaX, currentChart.dragHandle.Y() + deltaY], 0);

        // Move toolbar points
        currentChart.editButton.moveTo([currentChart.editButton.X() + deltaX, currentChart.editButton.Y() + deltaY], 0);
        currentChart.animateButton.moveTo([currentChart.animateButton.X() + deltaX, currentChart.animateButton.Y() + deltaY], 0);
        currentChart.removeButton.moveTo([currentChart.removeButton.X() + deltaX, currentChart.removeButton.Y() + deltaY], 0);

        // Move bars
        currentChart.bars.forEach(bar => {
          const barVertices = bar.vertices;
          if (barVertices && barVertices.length >= 4) {
            barVertices[0].moveTo([barVertices[0].X() + deltaX, barVertices[0].Y() + deltaY], 0);
            barVertices[1].moveTo([barVertices[1].X() + deltaX, barVertices[1].Y() + deltaY], 0);
            barVertices[2].moveTo([barVertices[2].X() + deltaX, barVertices[2].Y() + deltaY], 0);
            barVertices[3].moveTo([barVertices[3].X() + deltaX, barVertices[3].Y() + deltaY], 0);
          }
        });

        // Move labels and values
        currentChart.labels.forEach(label => {
          label.moveTo([label.X() + deltaX, label.Y() + deltaY], 0);
        });

        currentChart.values.forEach(value => {
          value.moveTo([value.X() + deltaX, value.Y() + deltaY], 0);
        });

        // Update logical position
        position.x = newX;
        position.y = newY;

      } catch (error) {
        console.warn('Error moving elements:', error);
      }

      // Resume board updates
      board.unsuspendUpdate();
    };

    // Wire events
    const setupEvents = (chartElements: any) => {
      // Button clicks
      chartElements.editButton.on('up', function() {
        if (onEdit) onEdit();
      });

      chartElements.animateButton.on('up', function() {
        animateBars();
        if (onAnimate) onAnimate();
      });

      chartElements.removeButton.on('up', function() {
        if (onRemove) onRemove();
      });

      // Drag handle pointer down
      chartElements.dragHandle.on('down', function(e: any) {
        isDraggingRef.current = true;
        const coords = board.getUsrCoordsOfMouse(e);
        lastMousePosRef.current = { x: coords[0], y: coords[1] };
        e.preventDefault();
      });
    };

    // Global pointer listeners on board container
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      try {
        const coords = board.getUsrCoordsOfMouse(e);
        const deltaX = coords[0] - lastMousePosRef.current.x;
        const deltaY = coords[1] - lastMousePosRef.current.y;

        // Threshold reduces tiny jitter updates
        if (Math.abs(deltaX) > 0.2 || Math.abs(deltaY) > 0.2) {
          const newX = position.x + deltaX;
          const newY = position.y + deltaY;
          
          updateChartPosition(newX, newY);
          lastMousePosRef.current = { x: coords[0], y: coords[1] };
        }
      } catch (error) {
        console.warn('Error during drag:', error);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Initial event binding
    setupEvents(chart);

    // Attach listeners to board DOM
    const boardElement = board.containerObj;
    if (boardElement) {
      boardElement.addEventListener('mousemove', handleMouseMove);
      boardElement.addEventListener('mouseup', handleMouseUp);
      boardElement.addEventListener('mouseleave', handleMouseUp);
    }

    chartRef.current = {
      elements: elementsRef.current,
      updateData: (newData: ChartDatum[]) => {
        console.log('Update data:', newData);
      },
      getPosition: () => ({ x: position.x, y: position.y }),
      remove: () => {
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
      }
    };

    board.update();

    return () => {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      isAnimatingRef.current = false;
      
      // Remove listeners
      if (boardElement) {
        boardElement.removeEventListener('mousemove', handleMouseMove);
        boardElement.removeEventListener('mouseup', handleMouseUp);
        boardElement.removeEventListener('mouseleave', handleMouseUp);
      }
      
      // Remove chart from board
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [board, data, position.x, position.y]);

  return null; // Imperative JSXGraph only; no React DOM
} 