"use server";

import db from "@/db/drizzle";
import { getAuthentication } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import z from "zod";
import { parseFile, PASS_PROTECTED_WALLETS } from "../utils";

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

    if (
      PASS_PROTECTED_WALLETS.includes(wallet.type) &&
      !parsedFormData.data.password
    )
      return NextResponse.json(
        { success: false, error: "Password required for this specific file" },
        { status: 400 },
      );

    const uploadedFile = parsedFormData.data.file;

    const parsingRecords = await parseFile(
      uploadedFile,
      wallet,
      parsedFormData.data.password,
    );

    if (parsingRecords.success)
      return NextResponse.json(
        { success: true, records: parsingRecords.data },
        { status: 200 },
      );
    else {
      console.error(parsingRecords.error);
      return NextResponse.json(
        { success: false, error: "Internal Server Error" },
        { status: 500 },
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
