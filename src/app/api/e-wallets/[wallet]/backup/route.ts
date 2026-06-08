"use server";

import db from "@/db/drizzle";
import { getAuthentication } from "@/lib/auth";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { PassThrough, Readable } from "stream";
import { createGzip } from "zlib";

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const auth = await getAuthentication();
  if (!auth) redirect("/login");

  const backupPassword = request.headers.get("X-Backup-Password");
  if (!backupPassword || backupPassword.length < 8) {
    return new NextResponse(
      "A valid backup password (min 8 chars) is required.",
      { status: 400 },
    );
  }

  const { wallet: walletUrl } = await params;

  const wallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { and, eq }) =>
      and(eq(wallets.url, walletUrl), eq(wallets.userId, auth.user.id)),
  });

  if (!wallet) return new NextResponse("Wallet not found", { status: 404 });

  try {
    const records = await db.query.recordsTable.findMany({
      where: (records, { eq }) => eq(records.eWalletId, wallet.id),
      columns: {
        eWalletId: false,
      },
      with: {
        eWallet: {
          columns: {
            name: true,
            cellNumber: true,
          },
        },
      },
    });

    const jsonData = JSON.stringify(records, null, 2);

    // 2. Generate a random cryptographic salt specifically for this file
    const fileSalt = crypto.randomBytes(16);

    // 3. Derive a unique 32-byte key from the user's backup password using scrypt
    const keyBuffer = crypto.scryptSync(backupPassword, fileSalt, 32, {
      N: 16384,
      r: 8,
      p: 1,
    });

    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

    // Create a gzip stream
    const gzip = createGzip();

    // Create a readable stream from the JSON string
    const jsonReadable = Readable.from(jsonData);

    const outputStream = new PassThrough();

    // 4. Write metadata to the head of the file: [16 bytes Salt] + [12 bytes IV]
    outputStream.write(fileSalt);
    outputStream.write(iv);

    // Pipe pipeline: JSON -> GZIP -> CIPHER -> OUTPUT
    jsonReadable.pipe(gzip).pipe(cipher).pipe(outputStream, { end: false });

    // 5. Append the 16-byte Auth Tag when encryption finishes
    cipher.on("end", () => {
      const authTag = cipher.getAuthTag();
      outputStream.write(authTag);
      outputStream.end();
    });

    const webStream = Readable.toWeb(
      outputStream,
    ) as ReadableStream<Uint8Array>;

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    const filename = `backup_${wallet.name}_${new Date().toISOString().split("T")[0]}.enc`;
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(webStream, { headers });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
