"use server";

import db from "@/db/drizzle";
import { getAuthentication } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import z from "zod";
import gcash from "./parse/g-cash";
import { parseFile } from "./parse/utils";

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

const ACCEPTED_EXTENSIONS = ["pdf"];

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
      { success: false, error: "Wallet not found" },
      { status: 404 },
    );

  try {
    const formData = await request.formData();

    const formDataSchema = z.object({
      file: z.instanceof(File).refine((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        return ACCEPTED_EXTENSIONS.includes(ext);
      }, "Invalid file type"),
      password: z.string().optional(),
    });

    const file = formData.get("file");
    const password = formData.get("password");
    const parsedFormData = formDataSchema.safeParse({ file, password });

    if (!parsedFormData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Something went wrong, please refresh and try again",
        },
        { status: 400 },
      );
    }

    const passProtectedWallets = process.env.PASS_PROTECTED_WALLETS?.split(",");
    if (
      !!passProtectedWallets &&
      passProtectedWallets.includes(wallet.type) &&
      !parsedFormData.data.password
    )
      return NextResponse.json(
        { success: false, error: "Password required for this specific file" },
        { status: 400 },
      );

    const uploadedFile = parsedFormData.data.file;

    const rawParsedData = await parseFile(
      uploadedFile,
      wallet,
      parsedFormData.data.password,
    );

    if (!rawParsedData.success) {
      console.error(rawParsedData.error);
      return NextResponse.json(
        { success: false, error: "Internal Server Error" },
        { status: 500 },
      );
    }

    switch (wallet.type) {
      case "g-cash":
        const cleanData = await gcash.refineFileData(
          rawParsedData.data,
          wallet,
        );

        return NextResponse.json(
          { success: true, records: cleanData },
          { status: 200 },
        );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
