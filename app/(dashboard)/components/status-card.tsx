import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

const statusCardVariants = cva("", {
  variants: {
    variant: {
      default: "text-primary border-primary",
      destructive: "text-destructive border-destructive",
      secondary: "text-secondary border-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type StatusCardProps = {
  title: string;
  icon: LucideIcon;
  content: string;
  description?: string;
} & VariantProps<typeof statusCardVariants>;

export function StatusCard({
  title,
  icon,
  content,
  description,
  variant,
}: StatusCardProps) {
  const CardIcon = icon;
  return (
    <Card className={statusCardVariants({ variant })}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardIcon />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{content}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
