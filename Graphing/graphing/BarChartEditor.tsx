"use client";

import { useState, useEffect } from "react";
import { Button } from "@/graphing/ui/button";
import { Plus, Trash2, BarChart3, X } from "lucide-react";
import type { ChartDatum } from "@/graphing/charts/chartTypes";
import {
  addBarRow,
  DEFAULT_BAR_CHART_ROWS,
  removeBarRow,
  updateBarRow,
  clampPercent,
} from "@/graphing/charts/barChartEditorModel";

interface BarChartEditorProps {
  open: boolean;
  initialData?: ChartDatum[];
  onClose: () => void;
  onApply: (data: ChartDatum[]) => void;
}

export default function BarChartEditor({
  open,
  initialData = DEFAULT_BAR_CHART_ROWS,
  onClose,
  onApply,
}: BarChartEditorProps) {
  const [data, setData] = useState<ChartDatum[]>(initialData);

  useEffect(() => {
    if (open) {
      setData(initialData);
    }
  }, [open, initialData]);

  const updateItem = (index: number, field: keyof ChartDatum, value: string | number) => {
    setData((prev) => updateBarRow(prev, index, field, value));
  };

  const addItem = () => {
    setData((prev) => addBarRow(prev));
  };

  const removeItem = (index: number) => {
    setData((prev) => removeBarRow(prev, index));
  };

  const handleApply = () => {
    onApply(data);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-[500px] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">柱状图数据编辑器</h3>
              <p className="text-blue-100 text-sm">编辑图表数据和标签</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="group relative bg-gray-50 rounded-xl p-4 border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200">
                <div className="flex items-start gap-4">
                  {/* Item Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-semibold mt-1">
                    {index + 1}
                  </div>
                  
                  {/* Form Fields */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        标签名称
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="输入标签名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数值 (0-100)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => updateItem(index, 'value', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="输入数值"
                          min="0"
                          max="100"
                        />
                        <div className="absolute right-3 top-2 text-xs text-gray-400">
                          {item.value}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeItem(index)}
                    disabled={data.length <= 1}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    title="删除项目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Value Bar Preview */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${clampPercent(item.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Item Button */}
          <button
            onClick={addItem}
            className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">添加新项目</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            共 {data.length} 个数据项
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              取消
            </Button>
            <Button 
              onClick={handleApply}
              className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              应用更改
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 