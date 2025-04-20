import { ColumnDef } from "@tanstack/react-table";
import { Record } from "../../actions";

export const columns: ColumnDef<Record>[] = [
  {
    id: "Reference",
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
    id: "Mobile number",
    accessorKey: "cellNumber",
    header: "Mobile number",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "fee",
    header: "Fee",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
];
