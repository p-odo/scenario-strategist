import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useGroupStore } from "@/hooks/useGroupStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogOut, Shield } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";

export default function GroupSelection() {
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const setGroup = useGroupStore((state) => state.setGroup);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load groups");
      return;
    }

    setGroups(data || []);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: newGroupName }])
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast.error("Failed to create group");
      return;
    }

    setGroup(data.id, data.name);
    navigate("/home");
  };

  const handleSelectGroup = (group: any) => {
    setGroup(group.id, group.name);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Space Mission Control</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
                <Button variant="ghost" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
            {!user && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Admin Login
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <div 
        className="relative py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${spaceHeroBg})` }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl font-bold mb-4">Select Your Team</h1>
          <p className="text-muted-foreground text-lg">
            Choose your group to begin the mission, or create a new team
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
            <div className="flex gap-3">
              <Input
                placeholder="Enter group name (e.g., Group 1)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                className="flex-1"
              />
              <Button 
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </Card>

          {groups.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Existing Groups</h2>
              <div className="grid gap-3">
                {groups.map((group) => (
                  <Card
                    key={group.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors border-muted bg-card/50 backdrop-blur-sm"
                    onClick={() => handleSelectGroup(group)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{group.name}</span>
                      <Button variant="ghost" size="sm" className="text-primary">
                        Select
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
