"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = {
  value: string;
  label: string;
  content: React.ReactNode;
};

export function Tabs({ tabs, defaultValue }: { tabs: Tab[]; defaultValue?: string }) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value);
  const activeTab = tabs.find((tab) => tab.value === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:flex">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition",
              active === tab.value ? "bg-white shadow-sm" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab?.content}
    </div>
  );
}
