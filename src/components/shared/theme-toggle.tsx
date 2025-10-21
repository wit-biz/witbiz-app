
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { name: "Claro", value: "light", icon: Sun },
    { name: "Oscuro", value: "dark", icon: Moon },
    { name: "Sistema", value: "system", icon: Laptop },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {themes.map((item) => (
        <div key={item.value}>
          <Button
            variant="outline"
            className={`w-full h-24 flex-col gap-2 ${
              theme === item.value ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => setTheme(item.value)}
          >
            <item.icon className="w-6 h-6" />
            <span>{item.name}</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
