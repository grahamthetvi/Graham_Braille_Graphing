"use client";

import { useEffect, useRef } from "react";

const MATHLIVE_FONTS_URL = "https://unpkg.com/mathlive/dist/fonts";

const MATHFIELD_ROOT_CLASSES = [
  "w-full",
  "border",
  "rounded-md",
  "px-2",
  "py-1.5",
  "text-sm",
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-ring",
] as const;

type MathLiveEditorProps = {
  onSubmit: (latex: string) => void;
  value?: string;
};

export default function MathLiveEditor({ onSubmit, value }: MathLiveEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // MathfieldElement from mathlive; typed loosely for cross-browser custom element interop
  const mathFieldRef = useRef<{
    getValue: (format: "latex" | string) => string;
    setValue: (s: string) => void;
    focus: () => void;
  } | null>(null);

  useEffect(() => {
    const load = import("mathlive");
    void load.then(({ MathfieldElement }) => {
      if (!containerRef.current) return;
      if (mathFieldRef.current) return;

      const mf = new MathfieldElement({
        virtualKeyboardMode: "onfocus",
        smartMode: true,
        virtualKeyboardTheme: "material",
        fontsDirectory: MATHLIVE_FONTS_URL,
      });

      for (const cls of MATHFIELD_ROOT_CLASSES) {
        mf.classList.add(cls);
      }

      const root = containerRef.current;
      root.appendChild(mf);
      mathFieldRef.current = mf as {
        getValue: (format: "latex" | string) => string;
        setValue: (s: string) => void;
        focus: () => void;
        addEventListener: typeof HTMLElement.prototype.addEventListener;
      };

      const pushLatex = () => {
        if (!mathFieldRef.current) return;
        const latex = mathFieldRef.current.getValue("latex").trim();
        if (latex) {
          onSubmit(latex);
          mathFieldRef.current.setValue("");
        }
      };

      mf.addEventListener("keydown", (e: Event) => {
        const k = e as KeyboardEvent;
        if (k.key === "Enter" && !k.shiftKey) {
          k.preventDefault();
          pushLatex();
        }
      });
    });
  }, []);

  useEffect(() => {
    if (value === undefined || !mathFieldRef.current) return;
    mathFieldRef.current.setValue(value);
    mathFieldRef.current.focus();
  }, [value]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      <button
        type="button"
        onClick={() => {
          if (!mathFieldRef.current) return;
          const latex = mathFieldRef.current.getValue("latex").trim();
          if (latex) {
            onSubmit(latex);
            mathFieldRef.current.setValue("");
          }
        }}
        className="w-full text-sm rounded-md bg-primary text-primary-foreground py-1.5 hover:bg-primary/90"
      >
        Plot formula curve
      </button>
    </div>
  );
}
