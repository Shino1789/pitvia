import type { ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  subtitleColor?: "default" | "primary" | "success" | "destructive";
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = "primary",
  icon: Icon,
}: StatCardProps) {
  const subtitleColorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-500",
    destructive: "text-destructive",
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-foreground mt-2">{value}</p>
            {subtitle && (
              <p
                className={`text-sm mt-1 ${subtitleColorClasses[subtitleColor]}`}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="text-muted-foreground">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
