import { useState } from "react";
import { Rocket, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { CheatSheetDialog } from "./CheatSheetDialog";

interface HeaderProps {
  groupName?: string;
  onSwitchGroup?: () => void;
}

export const Header = ({ groupName, onSwitchGroup }: HeaderProps) => {
  const navigate = useNavigate();
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate("/home")}
          >
            <Rocket className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Space Travel Control Centre</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setCheatSheetOpen(true)}
            >
              <BookOpen className="w-4 h-4" />
              <span>AI tools cheatsheet</span>
            </Button>

            {groupName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <span className="font-semibold">{groupName}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onSwitchGroup && (
                    <DropdownMenuItem onClick={onSwitchGroup}>
                      Switch group
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/")}>
                    Home
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <CheatSheetDialog open={cheatSheetOpen} onOpenChange={setCheatSheetOpen} />
    </>
  );
};
