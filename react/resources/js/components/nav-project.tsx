"use client"

import { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Project = {
  name: string
  url: string
  icon: LucideIcon
}

export function NavProjects({ projects }: { projects: Project[] }) {
  return (
    <div className="px-2">
      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
        Projects
      </h4>

      <div className="space-y-1">
        {projects.map((project) => (
          <Button
            key={project.name}
            variant="ghost"
            className="w-full justify-start gap-2"
          >
            <project.icon className="h-4 w-4" />
            {project.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
