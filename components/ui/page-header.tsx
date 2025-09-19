import { Separator } from "@/components/ui/separator";

type PageHeaderProps = {
  id?: string;
  title: string;
  description: string;
};

export function PageHeader({ id, title, description }: PageHeaderProps) {
  return (
    <div>
      <h3 id={id}>{title}</h3>
      <p className="text-sm">{description}</p>
      <Separator className="mt-2" />
    </div>
  );
}
