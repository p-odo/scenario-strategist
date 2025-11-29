import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Package } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";
import orbitImg from "@/assets/scenario-orbit-documents.jpg";
import deepSpaceImg from "@/assets/scenario-deep-space.jpg";

export default function Home() {
  const { groupId, groupName, clearGroup } = useGroupStore();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) {
      navigate("/");
      return;
    }
    loadScenarios();
  }, [groupId]);

  const loadScenarios = async () => {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast.error("Failed to load scenarios");
      return;
    }

    setScenarios(data || []);
  };

  const handleSwitchGroup = () => {
    clearGroup();
    navigate("/");
  };

  const getScenarioImage = (index: number) => {
    return index === 0 ? orbitImg : deepSpaceImg;
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.toLowerCase() === "intermediate") return "bg-accent text-accent-foreground";
    if (difficulty.toLowerCase() === "advanced") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} onSwitchGroup={handleSwitchGroup} />
      
      <div 
        className="relative py-16 bg-cover bg-center"
        style={{ backgroundImage: `url(${spaceHeroBg})` }}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl font-bold mb-3">
            Welcome to Space Travel Control Centre, <span className="text-primary">{groupName}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-4xl">
            It's 2030. As Cathay enters the era of space travel, this portal harnesses state-of-the-art AI tools to power safe and innovative mission launches. Your decisions here will shape outcomes and guarantee a smooth, successful launch of our next frontier.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">YOUR IMMEDIATE ATTENTION NEEDED:</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {scenarios.map((scenario, index) => (
            <Card
              key={scenario.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group border-border/50 bg-card/50 backdrop-blur-sm"
              onClick={() => navigate(`/scenario/${scenario.id}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={getScenarioImage(index)}
                  alt={scenario.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  {index === 0 ? <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" /> : <Package className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{scenario.name}</h3>
                      <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {scenario.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{scenario.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
