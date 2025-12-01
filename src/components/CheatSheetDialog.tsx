import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AICheatSheet } from "./AICheatSheet";
import { Loader2 } from "lucide-react";

interface CheatSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheatSheetDialog({ open, onOpenChange }: CheatSheetDialogProps) {
  const { data: cheatSheets, isLoading } = useQuery({
    queryKey: ["ai-cheat-sheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_cheat_sheets")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">AI Tools Cheat Sheet</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {cheatSheets?.map((sheet) => (
              <AICheatSheet
                key={sheet.id}
                name={sheet.name}
                icon={sheet.icon}
                headerColor={sheet.header_color}
                whatIs={sheet.what_is}
                prerequisites={sheet.prerequisites}
                exampleUseCases={sheet.example_use_cases}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
