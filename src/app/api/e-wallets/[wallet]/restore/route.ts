"use server";

import { recordsTable } from "@/db/schema";
import { getAuthentication } from "@/lib/auth";
import { createInsertSchema } from "drizzle-zod";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import z from "zod";

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

const ACCEPTED_EXTENSIONS = ["enc"];

export async function GET(request: Request, { params }: RouteProps) {
  const auth = await getAuthentication();
  if (!auth) redirect("/login");

  const backupPassword = request.headers.get("X-Backup-Password");
  if (!backupPassword || backupPassword.length < 8)
    return new NextResponse("Invalid backup password", { status: 400 });

  try {
    const formData = await request.formData();

    const formDataSchema = z.object({
      file: z.instanceof(File).refine((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        return ACCEPTED_EXTENSIONS.includes(ext);
      }, "Invalid file type"),
      password: z.string(),
    });
  } catch (error) {}
}

async function decryptFile() {}

async function parseFile(file: File) {
  const recordSchema = createInsertSchema(recordsTable, {
    date: z.string(),
    claimedAt: z.string().nullable(),
    createdAt: z.string().optional(),
  })
    .omit({ eWalletId: true })
    .array();

  if (file.type !== "application/json")
    return { data: null, error: "Invalid file" };

  const blobString = await file.text();

  try {
    const parsedJSON = JSON.parse(blobString);
    const parsedRecords = recordSchema.safeParse(parsedJSON);

    if (parsedRecords.error) return { data: null, error: "Invalid JSON file" };
    else
      return {
        data: parsedRecords.data,
        error: null,
      };
  } catch (error) {
    if (error instanceof SyntaxError)
      return { data: null, error: "Invalid JSON file" };
    else return { data: null, error: "Something went wrong" };
  }
}
