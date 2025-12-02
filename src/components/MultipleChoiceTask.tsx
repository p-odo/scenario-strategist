import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ReactMarkdown from 'react-markdown';

interface MultipleChoiceTaskProps {
  options: any[];
  onConfirm: (selectedOptions: string[]) => void;
  isConfirming: boolean;
}

export function MultipleChoiceTask({ options, onConfirm, isConfirming }: MultipleChoiceTaskProps) {
  const [rankings, setRankings] = useState<Record<string, string>>({});

  const handleRankChange = (optionId: string, rank: string) => {
    setRankings(prev => ({ ...prev, [optionId]: rank }));
  };

  const handleConfirm = () => {
    // Convert rankings to ordered list
    const rankedOptions = Object.entries(rankings)
      .sort(([, rankA], [, rankB]) => parseInt(rankA) - parseInt(rankB))
      .map(([optionId]) => optionId);
    
    onConfirm(rankedOptions);
  };

  const allRanked = options.length === Object.keys(rankings).length;
  const hasValidRankings = allRanked && new Set(Object.values(rankings)).size === options.length;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-6">RANK THE AI MODELS (1 = MOST IMPORTANT, 4 = LEAST IMPORTANT):</h3>
      
      <div className="space-y-4">
        {options.map((option) => (
          <Card key={option.id} className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-2">{option.title}</h4>
                <div className="text-sm text-muted-foreground mb-4">
                  <ReactMarkdown>{option.description}</ReactMarkdown>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium mb-1">Rank</Label>
                <RadioGroup 
                  value={rankings[option.id] || ""} 
                  onValueChange={(value) => handleRankChange(option.id, value)}
                  className="flex gap-2"
                >
                  {[1, 2, 3, 4].map((rank) => {
                    const isUsed = Object.entries(rankings).some(
                      ([id, r]) => id !== option.id && r === rank.toString()
                    );
                    return (
                      <div key={rank} className="flex items-center">
                        <RadioGroupItem 
                          value={rank.toString()} 
                          id={`${option.id}-${rank}`}
                          disabled={isUsed}
                          className="peer"
                        />
                        <Label 
                          htmlFor={`${option.id}-${rank}`}
                          className={`ml-2 text-sm cursor-pointer ${isUsed ? 'opacity-40' : ''}`}
                        >
                          {rank}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button 
        onClick={handleConfirm} 
        disabled={!hasValidRankings || isConfirming}
        className="w-full font-bold text-lg h-14 shadow-xl hover:shadow-primary/20 transition-all"
        size="lg"
      >
        {isConfirming ? "Confirming..." : hasValidRankings ? "Confirm Rankings" : "Please rank all options"}
      </Button>
    </div>
  );
}