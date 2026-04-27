"use client";

import type { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { DepthToggleButton } from "./Button3D";

export type WorkbenchTool = {
  id: string;
  title: string;
  icon: ReactNode;
  action: () => void;
};

type WorkbenchToolbarProps = {
  visibleTools: WorkbenchTool[];
  extraTools: WorkbenchTool[];
  activeInstrument: string;
  onSelectTool: (tool: WorkbenchTool) => void;
};

export function WorkbenchToolbar({
  visibleTools,
  extraTools,
  activeInstrument,
  onSelectTool,
}: WorkbenchToolbarProps) {
  return (
    <div
      className="fixed left-1/2 bottom-2 -translate-x-1/2 z-40 bg-background/80 backdrop-blur rounded-[12px] shadow px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap"
      data-testid="workbench-toolbar"
    >
      {visibleTools.map((t) => (
        <DepthToggleButton
          key={t.id}
          title={t.title}
          data-testid={`workbench-tool-${t.id}`}
          selected={activeInstrument === t.id}
          onClick={() => onSelectTool(t)}
          size="pill"
        >
          {t.icon}
        </DepthToggleButton>
      ))}

      {extraTools.length > 0 && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div>
              <DepthToggleButton title="More tools" data-testid="workbench-tool-more" onClick={() => {}}>
                <MoreHorizontal className="w-5 h-5" />
              </DepthToggleButton>
            </div>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="end"
              sideOffset={4}
              className="grid grid-cols-3 gap-2 rounded-md border bg-popover p-3 shadow-md z-50"
            >
              {extraTools.map((tool) => (
                <DepthToggleButton
                  key={tool.id}
                  title={tool.title}
                  data-testid={`workbench-tool-${tool.id}`}
                  selected={activeInstrument === tool.id}
                  onClick={() => onSelectTool(tool)}
                >
                  {tool.icon}
                </DepthToggleButton>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
