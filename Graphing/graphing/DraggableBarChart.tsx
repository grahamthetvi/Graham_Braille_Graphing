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
  title = "柱状图"
}: DraggableBarChartProps) {
  const chartRef = useRef<any>(null);
  const elementsRef = useRef<any[]>([]);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<any>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!board || !data.length) return;

    // 清理之前的元素
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

    // 创建图表元素
    const createChart = (baseX: number, baseY: number) => {
      const elements: any[] = [];

      // 创建卡片背景
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

      // 创建标题
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

      // 创建柱状图元素
      const bars: any[] = [];
      const labels: any[] = [];
      const values: any[] = [];

      data.forEach((d, i) => {
        const barX = barCenterX(baseX, i, data.length, barSpacing);
        const barHeight = barHeightForValue(d.value, maxValue, DEFAULT_BAR_SCALE_HEIGHT);

        // 创建柱子
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

        // 创建标签
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

        // 创建数值
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

      // 创建拖动手柄
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
        fixed: true, // 重要：设为fixed，禁用JSXGraph的内置拖动
        snapToGrid: false,
        name: '📌拖动',
        showInfobox: false,
        highlight: true,
        highlightFillColor: '#34d399',
        highlightStrokeColor: '#047857'
      });
      elements.push(dragHandle);

      // 创建控制按钮
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

    // 初始创建图表
    const chart = createChart(position.x, position.y);
    elementsRef.current = chart.elements;

    // 保存当前图表的引用
    let currentChart = chart;

    // 动画功能
    const animateBars = () => {
      if (isAnimatingRef.current) return; // 防止重复动画
      
      isAnimatingRef.current = true;
      const animationDuration = 3000; // 3秒动画
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
            
            // 更新柱子顶部两个顶点
            const barVertices = bar.vertices;
            if (barVertices && barVertices.length >= 4) {
              barVertices[2].moveTo([barX + barWidth/2, position.y + currentHeight], 0);
              barVertices[3].moveTo([barX - barWidth/2, position.y + currentHeight], 0);
            }
            
            // 更新数值文本位置
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

    // 更新图表位置的函数 - 直接移动元素而不是重建
    const updateChartPosition = (newX: number, newY: number) => {
      const deltaX = newX - position.x;
      const deltaY = newY - position.y;

      // 暂停画板更新
      board.suspendUpdate();
      
      try {
        // 移动背景
        const bgVertices = currentChart.cardBackground.vertices;
        if (bgVertices && bgVertices.length >= 4) {
          bgVertices[0].moveTo([bgVertices[0].X() + deltaX, bgVertices[0].Y() + deltaY], 0);
          bgVertices[1].moveTo([bgVertices[1].X() + deltaX, bgVertices[1].Y() + deltaY], 0);
          bgVertices[2].moveTo([bgVertices[2].X() + deltaX, bgVertices[2].Y() + deltaY], 0);
          bgVertices[3].moveTo([bgVertices[3].X() + deltaX, bgVertices[3].Y() + deltaY], 0);
        }

        // 移动标题
        currentChart.titleText.moveTo([currentChart.titleText.X() + deltaX, currentChart.titleText.Y() + deltaY], 0);

        // 移动拖动手柄
        currentChart.dragHandle.moveTo([currentChart.dragHandle.X() + deltaX, currentChart.dragHandle.Y() + deltaY], 0);

        // 移动按钮
        currentChart.editButton.moveTo([currentChart.editButton.X() + deltaX, currentChart.editButton.Y() + deltaY], 0);
        currentChart.animateButton.moveTo([currentChart.animateButton.X() + deltaX, currentChart.animateButton.Y() + deltaY], 0);
        currentChart.removeButton.moveTo([currentChart.removeButton.X() + deltaX, currentChart.removeButton.Y() + deltaY], 0);

        // 移动柱状图元素
        currentChart.bars.forEach(bar => {
          const barVertices = bar.vertices;
          if (barVertices && barVertices.length >= 4) {
            barVertices[0].moveTo([barVertices[0].X() + deltaX, barVertices[0].Y() + deltaY], 0);
            barVertices[1].moveTo([barVertices[1].X() + deltaX, barVertices[1].Y() + deltaY], 0);
            barVertices[2].moveTo([barVertices[2].X() + deltaX, barVertices[2].Y() + deltaY], 0);
            barVertices[3].moveTo([barVertices[3].X() + deltaX, barVertices[3].Y() + deltaY], 0);
          }
        });

        // 移动标签和数值
        currentChart.labels.forEach(label => {
          label.moveTo([label.X() + deltaX, label.Y() + deltaY], 0);
        });

        currentChart.values.forEach(value => {
          value.moveTo([value.X() + deltaX, value.Y() + deltaY], 0);
        });

        // 更新位置引用
        position.x = newX;
        position.y = newY;

      } catch (error) {
        console.warn('Error moving elements:', error);
      }

      // 恢复画板更新
      board.unsuspendUpdate();
    };

    // 设置事件监听
    const setupEvents = (chartElements: any) => {
      // 按钮点击事件
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

      // 拖动手柄的鼠标事件
      chartElements.dragHandle.on('down', function(e: any) {
        isDraggingRef.current = true;
        const coords = board.getUsrCoordsOfMouse(e);
        lastMousePosRef.current = { x: coords[0], y: coords[1] };
        e.preventDefault();
      });
    };

    // 全局鼠标事件监听
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      try {
        const coords = board.getUsrCoordsOfMouse(e);
        const deltaX = coords[0] - lastMousePosRef.current.x;
        const deltaY = coords[1] - lastMousePosRef.current.y;

        // 只有当移动距离足够大时才更新，增加阈值减少重建频率
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

    // 绑定初始事件
    setupEvents(chart);

    // 添加全局事件监听器
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
      // 停止动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      isAnimatingRef.current = false;
      
      // 清理事件监听器
      if (boardElement) {
        boardElement.removeEventListener('mousemove', handleMouseMove);
        boardElement.removeEventListener('mouseup', handleMouseUp);
        boardElement.removeEventListener('mouseleave', handleMouseUp);
      }
      
      // 清理图表元素
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [board, data, position.x, position.y]);

  return null; // 这个组件不渲染DOM，只操作JSXGraph
} 