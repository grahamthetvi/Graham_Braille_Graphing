import React, { useState, useEffect } from "react";
import { EditorModalFrame } from "@/graphing/ui/EditorModalFrame";
import { LabelInput } from "@/graphing/ui/LabelInput";

export default function SineEditor({
  open,
  initialA,
  initialK,
  onApply,
  onClose,
}: {
  open: boolean;
  initialA: number;
  initialK: number;
  onApply: (A: number, k: number) => void;
  onClose: () => void;
}) {
  const [amp, setAmp] = useState<string>("" + initialA);
  const [freq, setFreq] = useState<string>("" + initialK);

  useEffect(() => {
    setAmp("" + initialA);
    setFreq("" + initialK);
  }, [initialA, initialK, open]);

  return (
    <EditorModalFrame
      open={open}
      title="Edit sine curve y = A·sin(kx)"
      onClose={onClose}
      onApply={() => {
        const A = parseFloat(amp);
        const k = parseFloat(freq);
        if (isNaN(A) || isNaN(k) || k === 0) return;
        onApply(A, k);
      }}
    >
      <LabelInput label="A (amplitude)" value={amp} onChange={setAmp} />
      <LabelInput label="k (angular frequency)" value={freq} onChange={setFreq} />
    </EditorModalFrame>
  );
}
