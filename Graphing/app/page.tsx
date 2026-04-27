"use client";

import dynamic from "next/dynamic";

const PlotWorkbench = dynamic(() => import("@/graphing/PlotWorkbench"), {
  ssr: false,
});

export default function Home() {
  return <PlotWorkbench />;
}
