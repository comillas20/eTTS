"use client";

import { createRecords } from "@/app/(dashboard)/actions/records";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInsertSchema } from "drizzle-zod";
import { CircleXIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const dataSchema = createInsertSchema(recordsTable, {
  date: z.string().datetime({ local: true }),
  cellNumber: (schema) => schema.min(11, "Invalid phone no.").nullable(),
  claimedAt: z.string().datetime({ local: true }).nullable(),
  eWalletId: z.number().optional(),
}).array();

export function getDataFromJSON(data: string, walletId: number) {
  try {
    const parsedJSON = JSON.parse(data);
    const validated = dataSchema.safeParse(parsedJSON);

    if (validated.error) {
      return null;
    }

    const transformed = validated.data.map((record) => ({
      ...record,
      date: new Date(record.date),
      claimedAt: record.claimedAt ? new Date(record.claimedAt) : null,
      eWalletId: walletId,
    }));

    return transformed;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

type JSONData = ReturnType<typeof getDataFromJSON>;

type RecordFromJsonProps = {
  wallet: typeof eWalletsTable.$inferSelect;
};
export function RecordFromJson({ wallet }: RecordFromJsonProps) {
  const [message, setMessage] = useState<string>();
  const [value, setValue] = useState<string>("");
  const [data, setData] = useState<JSONData>([]);

  useEffect(() => {
    const T = setTimeout(() => {
      if (!value) return;

      const parsedData = getDataFromJSON(value, wallet.id);
      if (!parsedData || parsedData.length === 0) {
        setMessage("Invalid JSON data");
        return;
      }

      setData(parsedData);
      setMessage("Valid JSON data");
    }, 1000);

    return () => {
      clearTimeout(T);
    };
  }, [value, wallet.id]);

  const router = useRouter();

  const queryClient = useQueryClient();
  const records = useMutation({
    mutationFn: createRecords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });

      toast("New records has been created", {
        action: {
          label: "View",
          onClick: () => router.push(`/e-wallets/${wallet.url}`),
        },
      });

      setMessage("");
      setData([]);
    },
  });

  return (
    <div className="space-y-4">
      <Textarea
        className="aspect-square"
        value={value}
        onChange={({ target }) => setValue(target.value)}
      />
      {message && <p>{message}</p>}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline">
          <CircleXIcon />
          Clear
        </Button>
        <Button
          type="submit"
          onClick={() => {
            if (data) records.mutate(data);
          }}
          disabled={!data || !data.length || records.isPending}>
          <PlusIcon />
          Create
        </Button>
      </div>
    </div>
  );
}
