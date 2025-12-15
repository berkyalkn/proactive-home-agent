import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export function SensorCard({ title, value, unit, icon: Icon, onClick }: SensorCardProps) {
  return (
    <Card 
      className={`relative transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-95' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary/70" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
          <span className="text-xs text-muted-foreground ml-1 font-medium">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}