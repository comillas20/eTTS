"use server";

import { recordsTable } from "@/db/schema";
import { canAccessWallet, getAuthentication } from "@/lib/auth";
import { createInsertSchema } from "drizzle-zod";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import crypto from "crypto";
import z from "zod";
import { Readable } from "stream";
import { createGunzip } from "zlib";
import db from "@/db/drizzle";
import { sql } from "drizzle-orm";

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

const ACCEPTED_EXTENSIONS = ["enc"];

export async function POST(request: Request, { params }: RouteProps) {
  const auth = await getAuthentication();
  if (!auth) redirect("/login");

  const formData = await request.formData();
  const file = formData.get("file");
  const password = formData.get("password");
  const requestType = formData.get("requestType");

  const formDataSchema = z.object({
    file: z.instanceof(File).refine((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      return ACCEPTED_EXTENSIONS.includes(ext);
    }, "Invalid file type"),
    password: z.string().min(8, "Invalid backup password"),
    requestType: z.enum(["preview", "save"]),
  });

  const parsedForm = formDataSchema.safeParse({ file, password, requestType });

  if (!parsedForm.success)
    return new NextResponse(parsedForm.error.message, { status: 400 });

  try {
    const { file, password, requestType } = parsedForm.data;
    const decrypted = await decryptFile(file, password);
    if (!decrypted.data)
      return new NextResponse("Decryption failed", { status: 400 });

    const parsed = await parseRecords(decrypted.data);
    if (!parsed.data) return new NextResponse(parsed.error, { status: 400 });

    switch (requestType) {
      case "preview":
        return NextResponse.json({ data: parsed.data }, { status: 200 });
      case "save":
        const { wallet: walletUrl } = await params;

        const wallet = await db.query.eWalletsTable.findFirst({
          where: (wallets, { and, eq }) =>
            and(eq(wallets.url, walletUrl), eq(wallets.userId, auth.user.id)),
        });

        if (!wallet)
          return new NextResponse("Wallet not found", { status: 404 });

        parsed.data.forEach((record) => {
          if (record.type === "cash-in") record.claimedAt = null;
        });

        const hasAccess = await canAccessWallet(wallet.id);

        if (!hasAccess)
          return new NextResponse("Unauthorized", { status: 403 });

        const finalData = parsed.data.map((record) => ({
          ...record,
          eWalletId: wallet.id,
          date: new Date(record.date),
          claimedAt: record.claimedAt ? new Date(record.claimedAt) : null,
          createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
        }));

        await db
          .insert(recordsTable)
          .values(finalData)
          .returning({ id: recordsTable.id })
          .onConflictDoUpdate({
            target: [recordsTable.eWalletId, recordsTable.referenceNumber],
            set: {
              fee: sql.raw(`excluded.${recordsTable.fee.name}`),
              claimedAt: sql.raw(`excluded."${recordsTable.claimedAt.name}"`),
              notes: sql.raw(`excluded.${recordsTable.notes.name}`),
            },
          });

        return NextResponse.json({ data: finalData.length }, { status: 200 });
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    return new NextResponse("Invalid backup password or corrupted file", {
      status: 400,
    });
  }
}

async function decryptFile(file: File, backupPassword: string) {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Structural length check
    if (fileBuffer.length < 16 + 12 + 16)
      return { data: null, error: "Invalid backup file structure." };

    // 1. Slice file segments out based on our custom format layout
    const fileSalt = fileBuffer.subarray(0, 16);
    const iv = fileBuffer.subarray(16, 16 + 12);
    const authTag = fileBuffer.subarray(fileBuffer.length - 16);
    const ciphertext = fileBuffer.subarray(16 + 12, fileBuffer.length - 16);

    // 2. Re-derive the cryptographic key using the provided password
    const keyBuffer = crypto.scryptSync(backupPassword, fileSalt, 32, {
      N: 16384,
      r: 8,
      p: 1,
    });

    // 3. Initialize Decipher with the Auth Tag
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(authTag);

    const encryptedReadable = Readable.from(ciphertext);
    const gunzip = createGunzip();

    const decryptedStream = encryptedReadable.pipe(decipher).pipe(gunzip);

    // 4. Accumulate chunks back to plaintext string
    let rawJson = "";
    for await (const chunk of decryptedStream) {
      rawJson += chunk.toString("utf8");
    }

    return { data: rawJson, error: null };
  } catch (error) {
    return { data: null, error: "Something went wrong" };
  }
}

async function parseRecords(raw: string) {
  const recordSchema = createInsertSchema(recordsTable, {
    date: z.string(),
    claimedAt: z.string().nullable(),
    createdAt: z.string().optional(),
  })
    .omit({ eWalletId: true })
    .array();

  try {
    const parsedJSON = JSON.parse(raw);
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

// export async function POST(request: Request, { params }: RouteProps) {
//   const auth = await getAuthentication();
//   if (!auth) redirect("/login");

//   const formData = await request.formData();

//   const formDataSchema = z.object({
//     file: z.instanceof(File).refine((file) => {
//       const ext = file.name.split(".").pop()?.toLowerCase() || "";
//       return ACCEPTED_EXTENSIONS.includes(ext);
//     }, "Invalid file type"),
//     password: z.string().min(8, "Invalid backup password"),
//   });

//   const parsedForm = formDataSchema.safeParse(formData);

//   if (!parsedForm.success)
//     return new NextResponse(parsedForm.error.message, { status: 400 });

//   const { wallet: walletUrl } = await params;

//   const wallet = await db.query.eWalletsTable.findFirst({
//     where: (wallets, { and, eq }) =>
//       and(eq(wallets.url, walletUrl), eq(wallets.userId, auth.user.id)),
//   });

//   if (!wallet) return new NextResponse("Wallet not found", { status: 404 });

//   try {
//     const { file, password } = parsedForm.data;
//     const decrypted = await decryptFile(file, password);
//     if (decrypted.data === null)
//       return new NextResponse("Decryption failed", { status: 400 });

//     const parsed = await parseRecords(decrypted.data);
//     if (!parsed.data) return new NextResponse(parsed.error, { status: 400 });

//     parsed.data.forEach((record) => {
//       if (record.type === "cash-in") record.claimedAt = null;
//     });

//     const hasAccess = await canAccessWallet(wallet.id);

//     if (!hasAccess)
//       return { success: false as const, data: null, error: "Unauthorized" };

//     const finalData = parsed.data.map((record) => ({
//       ...record,
//       eWalletId: wallet.id,
//       date: new Date(record.date),
//       claimedAt: record.claimedAt ? new Date(record.claimedAt) : null,
//       createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
//     }));

//     await db
//       .insert(recordsTable)
//       .values(finalData)
//       .returning({ id: recordsTable.id })
//       .onConflictDoUpdate({
//         target: [recordsTable.eWalletId, recordsTable.referenceNumber],
//         set: {
//           fee: sql.raw(`excluded.${recordsTable.fee.name}`),
//           claimedAt: sql.raw(`excluded."${recordsTable.claimedAt.name}"`),
//           notes: sql.raw(`excluded.${recordsTable.notes.name}`),
//         },
//       });

//     return NextResponse.json({ success: true, count: finalData.length });
//   } catch (error) {
//     console.error("Decryption failed:", error);
//     return new NextResponse("Invalid backup password or corrupted file", {
//       status: 400,
//     });
//   }
// }
