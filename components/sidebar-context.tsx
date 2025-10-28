'use client';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Ctx = {
  openMobile: boolean;
  setOpenMobile: (v: boolean) => void;
  toggleMobile: () => void;

  collapsed: boolean;            // desktop: ancho colapsado vs expandido
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<Ctx | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleMobile = useCallback(() => setOpenMobile(v => !v), []);
  const toggleCollapsed = useCallback(() => setCollapsed(v => !v), []);

  return (
    <SidebarContext.Provider value={{ openMobile, setOpenMobile, toggleMobile, collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}
