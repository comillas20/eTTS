import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StatusCardProps = {
  title: string;
  icon: LucideIcon;
  content: string;
  description?: string;
};

export function StatusCard(props: StatusCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        <props.icon />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{props.content}</div>
        {props.description && (
          <p className="text-muted-foreground text-xs">{props.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
