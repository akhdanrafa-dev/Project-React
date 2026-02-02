"use client"

import { createContext, useContext, ReactNode } from "react"

import { useAppearance } from "@/hooks/use-appearance"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appearance, resolvedAppearance, updateAppearance } = useAppearance()

  const theme = resolvedAppearance as Theme

  function toggleTheme() {
    updateAppearance(appearance === "light" ? "dark" : "light")
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside ThemeProvider")
  return context
}
