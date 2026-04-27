"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Eye, EyeOff, Menu, Plus } from "lucide-react";
import { DepthToggleButton } from "./Button3D";
import type { SheetDescriptor } from "./types";

type WorkbenchSheetMenuProps = {
  sheetList: SheetDescriptor[];
  focusedSheetId: string;
  onCreateBoard: () => void;
  onSwitchBoard: (id: string) => void;
  axisGuidesVisible: boolean;
  onToggleAxes: () => void;
  bgChoices: string[];
  boardFill: string;
  onBoardFillChange: (color: string) => void;
};

export function WorkbenchSheetMenu({
  sheetList,
  focusedSheetId,
  onCreateBoard,
  onSwitchBoard,
  axisGuidesVisible,
  onToggleAxes,
  bgChoices,
  boardFill,
  onBoardFillChange,
}: WorkbenchSheetMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <div className="fixed left-2 top-2 z-50">
          <DepthToggleButton title="菜单" data-testid="workbench-sheet-menu" onClick={() => {}}>
            <Menu className="w-5 h-5" />
          </DepthToggleButton>
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="top"
        align="end"
        sideOffset={4}
        className="rounded-md border bg-popover p-1 shadow-md z-50"
      >
        <DropdownMenu.Item
          onSelect={onCreateBoard}
          className="flex items-center gap-2 rounded px-2 py-1.5 focus:bg-accent cursor-pointer"
        >
          <Plus className="w-4 h-4 text-primary" /> 新建图纸
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="my-1 h-px bg-muted" />
        {sheetList.map((b) => (
          <DropdownMenu.Item
            key={b.id}
            onSelect={() => onSwitchBoard(b.id)}
            className="flex items-center gap-2 rounded px-2 py-1.5 focus:bg-accent cursor-pointer"
          >
            {focusedSheetId === b.id ? <Check className="w-4 h-4 text-primary" /> : <span className="w-4 h-4" />}
            {b.title}
          </DropdownMenu.Item>
        ))}
        <DropdownMenu.Separator className="my-1 h-px bg-muted" />
        <DropdownMenu.Item
          onSelect={onToggleAxes}
          className="flex items-center gap-2 rounded px-2 py-1.5 focus:bg-accent cursor-pointer"
        >
          {axisGuidesVisible ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-primary" />}
          {axisGuidesVisible ? "隐藏坐标轴/网格" : "显示坐标轴/网格"}
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="my-1 h-px bg-muted" />
        <div className="px-3 py-2">
          <p className="text-xs mb-1 text-muted-foreground">Canvas background</p>
          <div className="flex gap-2">
            {bgChoices.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onBoardFillChange(col)}
                className={`h-6 w-6 rounded border ${boardFill === col ? "ring-2 ring-primary" : "ring-1 ring-muted"}`}
                style={{ backgroundColor: col }}
                title="背景色"
              />
            ))}
          </div>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
