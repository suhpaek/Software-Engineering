import { Building2, Clock, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { minutesToTime } from "@/lib/time"


export function AppHeader({ now }: { now: number }) {
  const { theme, setTheme } = useTheme()
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-base leading-tight font-semibold">Smart Campus</h1>
            <p className="text-xs text-muted-foreground">Room Availability Checker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Now (demo): {minutesToTime(now)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
