"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MATH_PLACEHOLDER =
  "Enter a formula here using LaTeX (e.g. \\frac{a}{b}, \\sqrt{x}).";

type MathEditorProps = {
  onSubmit: (latex: string) => void;
  placeholder?: string;
};

function pickFirstMathBlock(
  blocks: { type: string; data: { text?: string } }[]
) {
  return blocks.find(
    (b) => b.type === "math" && String(b.data?.text ?? "").trim() !== ""
  );
}

export default function MathEditor({ onSubmit, placeholder }: MathEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<
    { destroy?: () => void; save: () => Promise<unknown>; clear: () => Promise<unknown> } | null
  >(null);

  const submitFromEditor = useCallback(async () => {
    if (!editorInstance.current) return;
    try {
      const raw = (await editorInstance.current.save()) as { blocks: { type: string; data: { text?: string } }[] };
      const match = pickFirstMathBlock(raw.blocks);
      if (match?.data.text != null) {
        onSubmit(String(match.data.text).trim());
        await editorInstance.current.clear();
      }
    } catch (e) {
      console.error(e);
    }
  }, [onSubmit]);

  useEffect(() => {
    let live = true;

    (async function bootstrapEditor() {
      const [EditorMod, MathMod] = await Promise.all([
        import("@editorjs/editorjs"),
        import("editorjs-math"),
      ]);
      const EditorCtor = (EditorMod as { default?: unknown }).default ?? EditorMod;
      const MathCtor = (MathMod as { default?: unknown }).default ?? MathMod;
      if (!live || !hostRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- editorjs is dynamically imported
      editorInstance.current = new (EditorCtor as any)({
        holder: hostRef.current,
        placeholder: placeholder || DEFAULT_MATH_PLACEHOLDER,
        tools: {
          math: {
            class: MathCtor,
            inlineToolbar: true,
            config: {
              katexOptions: { displayMode: true },
            },
          },
        },
        data: {
          blocks: [{ type: "math", data: { text: "" } }],
        },
        minHeight: 60,
      }) as { destroy?: () => void; save: () => Promise<unknown>; clear: () => Promise<unknown> };
    })();

    return () => {
      live = false;
      if (editorInstance.current?.destroy) {
        editorInstance.current.destroy();
      }
      editorInstance.current = null;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div ref={hostRef} className="border rounded-md p-2 bg-background" />
      <button
        type="button"
        onClick={submitFromEditor}
        className="w-full text-sm rounded-md bg-primary text-primary-foreground py-1.5 hover:bg-primary/90"
      >
        Plot formula curve
      </button>
    </div>
  );
}
