"use client";

import { useCallback, useState } from "react";
import type { StatDatum } from "@/graphing/statChartRender";
import { sampleGradePieSlices, sampleScatterCloud } from "../sampleDatasets";

export function useStatsOverlay() {
  const [statsOverlayOpen, setStatsOverlayOpen] = useState(false);
  const [statsViewKind, setStatsViewKind] = useState<"bar" | "pie" | "scatter">("bar");
  const [statsPayload, setStatsPayload] = useState<StatDatum[]>([]);

  const showPieChart = useCallback(() => {
    setStatsViewKind("pie");
    setStatsPayload(sampleGradePieSlices());
    setStatsOverlayOpen(true);
  }, []);

  const showScatterChart = useCallback(() => {
    setStatsViewKind("scatter");
    setStatsPayload(sampleScatterCloud());
    setStatsOverlayOpen(true);
  }, []);

  return {
    statsOverlayOpen,
    setStatsOverlayOpen,
    statsViewKind,
    setStatsViewKind,
    statsPayload,
    setStatsPayload,
    showPieChart,
    showScatterChart,
  };
}
