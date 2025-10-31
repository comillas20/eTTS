"use server";

import { createFeeRange, deleteFeeRange } from "@/app/(dashboard)/actions/fees";
import { feesTable } from "@/db/schema";

type Operation = "create" | "update" | "delete";
type FeeRange = typeof feesTable.$inferSelect;
type MutationProps = {
  data: FeeRange;
  op: Operation;
};

export async function mutateFeeRange({ data, op }: MutationProps) {
  switch (op) {
    case "create":
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = data;
      return { ...(await createFeeRange(rest)), op };
    case "delete":
      const result = await deleteFeeRange(data.id);
      return { ...result, data: null, op };
    default:
      return {
        success: false as const,
        data: null,
        error: "Invalid operation",
        op: null,
      };
  }
}
