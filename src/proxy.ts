import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isSignUpDisabled = process.env.DISABLE_SIGN_UP !== "false";
  if (isSignUpDisabled && request.nextUrl.pathname === "/register") {
    // Display an error message instead of letting user see the now non-working register page
    return NextResponse.error();
  }
}

export const config = {
  matcher: ["/register"],
};
