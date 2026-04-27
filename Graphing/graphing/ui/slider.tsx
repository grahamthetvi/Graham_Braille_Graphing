"use client";

import * as React from "react";
import { Root, Track, Range, Thumb } from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider(props: React.ComponentProps<typeof Root>) {
  const { className, defaultValue, value, min = 0, max = 100, ...rootRest } = props;
  const thumbSeeds = React.useMemo((): number[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (Array.isArray(defaultValue)) {
      return defaultValue;
    }
    return [min, max];
  }, [value, defaultValue, min, max]);

  return (
    <Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...rootRest}
    >
      <Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </Track>
      {Array.from({ length: thumbSeeds.length }, (_v, i) => (
        <Thumb
          data-slot="slider-thumb"
          // eslint-disable-next-line react/no-array-index-key -- one thumb per index, stable order
          key={i}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </Root>
  );
}

export { Slider };
