"use client"

import { ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Team = {
  name: string
  logo: React.ElementType
  plan: string
}

export function TeamSwitcher({ teams }: { teams: Team[] }) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <activeTeam.logo className="h-4 w-4" />
            <span>{activeTeam.name}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-full">
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.name}
            onClick={() => setActiveTeam(team)}
          >
            <team.logo className="mr-2 h-4 w-4" />
            {team.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
