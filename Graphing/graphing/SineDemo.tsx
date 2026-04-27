/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import JXG from "jsxgraph";
import { Slider } from "@/graphing/ui/slider";
import { Button } from "@/graphing/ui/button";

export default function SineDemo() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [amp, setAmp] = useState(1);
  const [freq, setFreq] = useState(1);
  const boardRef = useRef<any>(null);
  const curveRef = useRef<any>(null);

  // initialize board once
  useEffect(() => {
    if (!boxRef.current) return;
    if (boardRef.current) return; // already init

    if (!boxRef.current.id) {
      boxRef.current.id = "sine-box-" + Math.random().toString(36).slice(2);
    }

    boardRef.current = JXG.JSXGraph.initBoard(boxRef.current.id, {
      boundingbox: [-Math.PI * 2, 5, Math.PI * 2, -5],
      axis: true,
    });

    curveRef.current = boardRef.current.create(
      "functiongraph",
      [function (x: number) {
        return amp * Math.sin(freq * x);
      }],
      { strokeColor: "#4f46e5", strokeWidth: 2 }
    );
  }, []);

  // update curve when parameters change
  useEffect(() => {
    if (!curveRef.current) return;
    curveRef.current.Y = function (x: number) {
      return amp * Math.sin(freq * x);
    };
    curveRef.current.updateCurve();
    if (boardRef.current) boardRef.current.update();
  }, [amp, freq]);

  const reset = () => {
    setAmp(1);
    setFreq(1);
  };

  return (
    <div className="space-y-6">
      <div ref={boxRef} className="w-full h-[400px] rounded-lg border" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amplitude: {amp.toFixed(1)}</label>
          <Slider
            defaultValue={[amp]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={(v) => setAmp(v[0])}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency: {freq.toFixed(1)}</label>
          <Slider
            defaultValue={[freq]}
            min={0.5}
            max={5}
            step={0.1}
            onValueChange={(v) => setFreq(v[0])}
          />
        </div>
      </div>
      <Button onClick={reset}>Reset</Button>
    </div>
  );
} 