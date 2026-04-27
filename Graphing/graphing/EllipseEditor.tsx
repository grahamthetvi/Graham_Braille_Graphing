import React, { useEffect, useState } from "react";
import { EditorModalFrame } from "@/graphing/ui/EditorModalFrame";
import { LabelInput } from "@/graphing/ui/LabelInput";

export default function EllipseEditor({
  open,
  initialA,
  initialB,
  onApply,
  onClose,
}: {
  open: boolean;
  initialA: number;
  initialB: number;
  onApply: (a: number, b: number) => void;
  onClose: () => void;
}) {
  const [a, setA] = useState<string>(() => String(initialA));
  const [b, setB] = useState<string>(() => String(initialB));

  useEffect(() => {
    setA(String(initialA));
    setB(String(initialB));
  }, [initialA, initialB, open]);

  return (
    <EditorModalFrame
      open={open}
      title="绘制椭圆 x²/a² + y²/b² = 1"
      onClose={onClose}
      onApply={() => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (isNaN(aNum) || isNaN(bNum) || aNum <= 0 || bNum <= 0) return;
        onApply(aNum, bNum);
      }}
    >
      <LabelInput label="a (长轴)" value={a} onChange={setA} />
      <LabelInput label="b (短轴)" value={b} onChange={setB} />
    </EditorModalFrame>
  );
}
