import { ColumnDef } from "@tanstack/react-table";
import { Record } from "../../actions";

export const columns: ColumnDef<Record>[] = [
  {
    accessorKey: "referenceNumber",
    header: "Reference",
  },
  {
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
