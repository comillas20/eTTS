"use server";

import db from "@/db/drizzle";
import { recordsTable } from "@/db/schema";
import { canAccessWallet, getAuthentication } from "@/lib/auth";
import { createInsertSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import z from "zod";

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const auth = await getAuthentication();
  if (!auth) redirect("/login");

  const { wallet: walletUrl } = await params;

  const wallet = await db.query.eWalletsTable.findFirst({
    where: (wallets, { and, eq }) =>
      and(eq(wallets.url, walletUrl), eq(wallets.userId, auth.user.id)),
  });

  if (!wallet)
    return NextResponse.json(
      { success: false, data: null, error: "Wallet not found" },
      { status: 404 },
    );

  try {
    const requestData = await request.json();

    const requestDataSchema = z.object({
      records: createInsertSchema(recordsTable, {
        date: z
          .string()
          .datetime()
          .transform((s) => new Date(s)),
        claimedAt: z
          .string()
          .datetime()
          .nullable()
          .transform((s) => (s === null ? null : new Date(s))),
      })
        .omit({ eWalletId: true })
        .array(),
      walletId: z.number(),
    });

    const parsedRequestData = requestDataSchema.safeParse(requestData);

    if (parsedRequestData.error) {
      console.error(parsedRequestData.error);
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Parsing file error",
        },
        { status: 400 },
      );
    }

    parsedRequestData.data.records.forEach((record) => {
      if (record.type === "cash-in") record.claimedAt = null;
    });

    const hasAccess = await canAccessWallet(parsedRequestData.data.walletId);

    if (!hasAccess)
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Unauthorized",
        },
        { status: 401 },
      );

    const finalData = parsedRequestData.data.records.map((record) => ({
      ...record,
      eWalletId: parsedRequestData.data.walletId,
    }));

    const result = await db
      .insert(recordsTable)
      .values(finalData)
      .returning({ id: recordsTable.id })
      .onConflictDoNothing();

    revalidatePath("/e-wallets");

    return NextResponse.json(
      {
        success: true,
        data: result,
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, data: null, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
