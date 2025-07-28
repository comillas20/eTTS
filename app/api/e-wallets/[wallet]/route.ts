"use server";

import db from "@/db/drizzle";
import { eWalletsTable, recordsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { createGzip } from "zlib";

export async function generateStaticParams() {
  const wallets = await db.query.eWalletsTable.findMany();

  return wallets.map((wallet) => ({
    wallet: wallet.url,
  }));
}

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  // Authorization check here, if ever

  const { wallet: walletUrl } = await params;

  const wallet = await db.query.eWalletsTable.findFirst({
    where: eq(eWalletsTable.url, walletUrl),
  });

  if (!wallet) return null;

  try {
    const records = await db.query.recordsTable.findMany({
      where: eq(recordsTable.eWalletId, wallet.id),
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

    // Create a gzip stream
    const gzip = createGzip();

    // Create a readable stream from the JSON string
    const jsonReadable = Readable.from(jsonData);

    // Pipe the JSON stream to the gzip stream
    jsonReadable.pipe(gzip);

    // Create a Web Stream from the Node.js Gzip stream for the response
    const webStream = Readable.toWeb(gzip) as ReadableStream<Uint8Array>;

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Type", "application/json"); // MIME type for JSON
    headers.set("Content-Encoding", "gzip"); // Indicate that the content is gzipped
    const filename = `records_wallet_${wallet.name}_backup_${new Date().toISOString().split("T")[0]}.json.gz`;
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(webStream, { headers });
  } catch (e) {
    console.error(e);
  }
}
