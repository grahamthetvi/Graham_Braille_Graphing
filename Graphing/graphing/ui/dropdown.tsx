import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;
export const DropdownMenuPortal = M.Portal;
export const DropdownMenuSub = M.Sub;
export const DropdownMenuRadioGroup = M.RadioGroup;

const subTriggerTokens =
  "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground";
const menuSurface =
  "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const itemRow =
  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground";
const groupHeading = "px-2 py-1.5 text-sm font-semibold";

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof M.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof M.SubTrigger> & { inset?: boolean }
>(({ className, inset, ...rest }, ref) => (
  <M.SubTrigger
    ref={ref}
    className={cn(subTriggerTokens, inset && "pl-8", className)}
    {...rest}
  />
));
DropdownMenuSubTrigger.displayName = M.SubTrigger.displayName;

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof M.SubContent>,
  React.ComponentPropsWithoutRef<typeof M.SubContent>
>(({ className, ...rest }, ref) => (
  <M.SubContent ref={ref} className={cn(menuSurface, className)} {...rest} />
));
DropdownMenuSubContent.displayName = M.SubContent.displayName;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof M.Content>,
  React.ComponentPropsWithoutRef<typeof M.Content>
>(({ className, sideOffset = 4, ...rest }, ref) => (
  <M.Portal>
    <M.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(menuSurface, className)}
      {...rest}
    />
  </M.Portal>
));
DropdownMenuContent.displayName = M.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof M.Item>,
  React.ComponentPropsWithoutRef<typeof M.Item> & { inset?: boolean }
>(({ className, inset, ...rest }, ref) => (
  <M.Item
    ref={ref}
    className={cn(itemRow, inset && "pl-8", className)}
    {...rest}
  />
));
DropdownMenuItem.displayName = M.Item.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof M.Separator>,
  React.ComponentPropsWithoutRef<typeof M.Separator>
>(({ className, ...rest }, ref) => (
  <M.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...rest} />
));
DropdownMenuSeparator.displayName = M.Separator.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof M.Label>,
  React.ComponentPropsWithoutRef<typeof M.Label> & { inset?: boolean }
>(({ className, inset, ...rest }, ref) => (
  <M.Label
    ref={ref}
    className={cn(groupHeading, inset && "pl-8", className)}
    {...rest}
  />
));
DropdownMenuLabel.displayName = M.Label.displayName;
