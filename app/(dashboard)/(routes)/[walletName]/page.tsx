import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  ChevronDownIcon,
  ColumnsIcon,
  PlusIcon,
} from "lucide-react";
import { fakeWalletsData } from "../../data";

export async function generateStaticParams() {
  // const posts = await fetch("https://.../posts").then(res => res.json());

  return fakeWalletsData.map((data) => ({
    walletName: data.label.trim().replace(" ", "_"),
  }));
}

type PageProps = {
  params: Promise<{ walletName: string }>;
};

export default async function Page({ params }: PageProps) {
  const { walletName } = await params;
  console.log(walletName);
  return (
    <div className="flex size-full flex-col-reverse gap-4 md:flex-col md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input className="w-80" placeholder="Search" />
          <Button size="icon" variant="outline">
            <CalendarIcon />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ColumnsIcon />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem>XD</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <PlusIcon />
            <span className="hidden lg:inline">Add Record</span>
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border pb-6 md:min-h-min">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow className="text-primary-foreground hover:bg-inherit">
              <TableHead>Reference</TableHead>
              <TableHead>Mobile no.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-32">Amount</TableHead>
              <TableHead className="w-32">Fee</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Cash-in</TableCell>
              <TableCell>$25000.00</TableCell>
              <TableCell>$250.00</TableCell>
              <TableCell>Jan 20, 2002, 8:00am</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
