"use client";

import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import type { SheetDescriptor } from "../types";

export function useWorkbenchSheets() {
  const initialId = nanoid();
  const [sheetList, setSheetList] = useState<SheetDescriptor[]>([
    { id: initialId, title: "Sheet 1", items: [] },
  ]);
  const [focusedSheetId, setFocusedSheetId] = useState(initialId);

  const createBoard = useCallback(() => {
    const next: SheetDescriptor = { id: nanoid(), title: "", items: [] };
    setSheetList((prev) => {
      next.title = `Sheet ${prev.length + 1}`;
      return [...prev, next];
    });
    setFocusedSheetId(next.id);
  }, []);

  const switchBoard = useCallback((id: string) => {
    setFocusedSheetId((cur) => (cur === id ? cur : id));
  }, []);

  return {
    sheetList,
    setSheetList,
    focusedSheetId,
    setFocusedSheetId,
    createBoard,
    switchBoard,
  };
}
