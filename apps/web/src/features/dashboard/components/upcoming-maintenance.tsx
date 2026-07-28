import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Calendar } from "lucide-react";
import { Progress } from "@/shared/ui/progress";

interface MaintenanceItem {
  id: string;
  vehicle: string;
  task: string;
  remaining: string;
  progress: number;
  unit: "km" | "日";
}

const upcomingMaintenance: MaintenanceItem[] = [
  {
    id: "1",
    vehicle: "R32 GT-R",
    task: "タイミングベルト交換",
    remaining: "1500",
    progress: 85,
    unit: "km",
  },
  {
    id: "2",
    vehicle: "AE86 レビン",
    task: "車検",
    remaining: "45",
    progress: 60,
    unit: "日",
  },
  {
    id: "3",
    vehicle: "S13 シルビア",
    task: "オイル交換",
    remaining: "800",
    progress: 90,
    unit: "km",
  },
];

export function UpcomingMaintenance() {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            次回メンテナンス
          </CardTitle>
        </div>
        <div className="p-2 bg-secondary rounded-lg">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-4xl font-bold text-foreground">3件</p>
          <p className="text-sm text-muted-foreground">30日以内に予定</p>
        </div>

        <p className="text-sm text-muted-foreground mb-4">近日中の予定</p>

        <div className="space-y-5">
          {upcomingMaintenance.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.vehicle}</p>
                  <p className="text-sm text-muted-foreground">{item.task}</p>
                </div>
                <span className="text-sm text-primary font-medium px-2 py-1 bg-primary/10 rounded">
                  あと{item.remaining}
                  {item.unit}
                </span>
              </div>
              <Progress
                value={item.progress}
                className="h-1.5 bg-secondary [&>div]:bg-primary"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
