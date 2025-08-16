import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateWalletForm } from "./components/create-wallet-form";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <div className="space-y-4 p-2">
      <div>
        <h3>Create an e-wallet</h3>
        <p className="text-sm">Create an e-wallet you wish to track</p>
      </div>
      <CreateWalletForm userId={session.user.id} />
    </div>
  );
}
