"use client";

import { ArrowRight, Plus, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ButtonIconsDemo() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-background border rounded-lg m-4 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Button System Demo</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Button leadingIcon={Plus}>Add item</Button>
        <Button trailingIcon={ArrowRight} variant="secondary">Continue</Button>
        <Button leadingIcon={Search} variant="tertiary">Search</Button>
        <Button size="icon" variant="ghost"><Settings /></Button>
        <Button size="icon-sm" variant="secondary"><Plus /></Button>
        <Button size="icon-lg"><ArrowRight /></Button>
      </div>
      
      <h3 className="text-lg font-bold mt-8 mb-4">Loading States</h3>
      <div className="flex flex-wrap items-center gap-3">
        <Button loading>Save Changes</Button>
        <Button loading variant="secondary" size="lg">Processing</Button>
        <Button loading size="icon" variant="tertiary"><Settings /></Button>
      </div>
    </div>
  );
}

export default ButtonIconsDemo;
