import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react"; 

export type SensorStatusColor = "normal" | "warning" | "critical" | "info" | "neutral";

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  statusText?: string; 
  statusColor?: SensorStatusColor;
  tooltipContent?: string;
  onClick?: () => void;
}

const colorStyles = {
  normal: "text-white bg-emerald-500/10 border-emerald-500/20",
  warning: "text-white bg-amber-500/10 border-amber-500/20",
  critical: "text-white bg-rose-500/10 border-rose-500/20",
  info: "text-white bg-blue-500/10 border-blue-500/20",
  neutral: "text-white bg-muted border-border/50"
};

const iconColors = {
  normal: "text-emerald-500",
  warning: "text-amber-500",
  critical: "text-rose-500",
  info: "text-blue-500",
  neutral: "text-primary/70"
};

export function SensorCard({ 
  title, value, unit, icon: Icon, statusText, statusColor = "neutral", tooltipContent, onClick 
}: SensorCardProps) {
  return (
    <Card 
      className={`relative transition-all duration-300 overflow-visible ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-95' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-1.5">
          {title}
          
          {tooltipContent && (
            <div className="group relative flex items-center" onClick={(e) => e.stopPropagation()}>
              <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-foreground cursor-help transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2.5 bg-popover border border-border text-popover-foreground text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none font-normal leading-relaxed">
                 {tooltipContent}
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45"></div>
              </div>
            </div>
          )}

        </CardTitle>
        <Icon className={`h-4 w-4 transition-colors ${iconColors[statusColor]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          <div className="text-2xl font-bold text-foreground flex items-baseline">
            {value}
            <span className="text-xs text-muted-foreground ml-1 font-medium">{unit}</span>
          </div>
          {statusText && (
            <div className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${colorStyles[statusColor]}`}>
              {statusText}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}