"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeGlobalBackground } from "@/components/ThemeBackground";
import type { PropsWithChildren } from "react";

/**
 * Client-side wrapper that:
 * 1. Provides ThemeContext to all pages (sets data-theme on <html>)
 * 2. Renders the immersive animated background as a fixed viewport layer (z-index: 0)
 *    behind all app content — making it global across every route.
 *
 * All page content from AppShell sits at position relative / z-index auto,
 * which naturally stacks above z-0.
 */
export function AppClientWrapper({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      {/* Fixed full-viewport animated background */}
      <ThemeGlobalBackground />
      {/* App content — naturally above z-0 */}
      {children}
    </ThemeProvider>
  );
}
