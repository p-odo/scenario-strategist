import { Card } from "@/components/ui/card";
import { Lightbulb, Layers } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface AICheatSheetProps {
  name: string;
  icon: string;
  headerColor: string;
  whatIs: string;
  prerequisites: string;
  exampleUseCases: string[];
}

export function AICheatSheet({
  name,
  icon,
  headerColor,
  whatIs,
  prerequisites,
  exampleUseCases,
}: AICheatSheetProps) {
  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[icon] || Layers;

  return (
    <Card className="overflow-hidden border-border">
      {/* Header */}
      <div 
        className="p-6 flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: headerColor }}
      >
        <IconComponent className="w-12 h-12 mb-3" strokeWidth={1.5} />
        <h3 className="text-xl font-bold text-center">{name}</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 bg-card">
        {/* What it is */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-semibold text-sm">What {name} is</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {whatIs.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? (
                <span key={i} className="text-primary font-semibold">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        </div>

        {/* Prerequisites */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h4 className="font-semibold text-sm">Prerequisites</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {prerequisites.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? (
                <span key={i} className="text-primary font-semibold">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        </div>

        {/* Example Use Cases */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <h4 className="font-semibold text-sm">Example Use Cases</h4>
          </div>
          <ul className="space-y-1.5">
            {exampleUseCases.map((useCase, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {useCase.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                    i % 2 === 1 ? (
                      <span key={i} className="text-primary font-semibold">
                        {part}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}