"use client";

import { createContext, useContext, useState, useId } from "react";

interface TabContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
}

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("Tab components must be used within Tab");
  return ctx;
}

interface TabRootProps {
  children: React.ReactNode;
  defaultTab?: string;
}

function TabRoot({ children, defaultTab = "" }: TabRootProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const baseId = useId();
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className="w-full">{children}</div>
    </TabContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex overflow-x-auto border-b border-neutral-200 [scrollbar-width:none]" role="tablist">
      {children}
    </div>
  );
}

interface TabItemProps {
  id: string;
  children: React.ReactNode;
}

function TabItem({ id, children }: TabItemProps) {
  const { activeTab, setActiveTab, baseId } = useTabContext();
  const isSelected = activeTab === id;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${id}`}
      id={`${baseId}-tab-${id}`}
      onClick={() => setActiveTab(id)}
      className={`shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
        isSelected
          ? "border-b-2 border-accent text-neutral-950"
          : "text-neutral-600 hover:text-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function TabPanels({ children }: { children: React.ReactNode }) {
  return <div className="mt-4">{children}</div>;
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

function TabPanel({ id, children }: TabPanelProps) {
  const { activeTab, baseId } = useTabContext();
  if (activeTab !== id) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
    >
      {children}
    </div>
  );
}

export const Tab = Object.assign(TabRoot, {
  List: TabList,
  Item: TabItem,
  Panels: TabPanels,
  Panel: TabPanel,
});
