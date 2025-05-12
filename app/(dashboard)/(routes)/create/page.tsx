import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlertIcon } from "lucide-react";
import { hasWallets } from "./actions";
import { WalletForm } from "./components/wallet-form";

export default async function Page() {
  const noWallet = !(await hasWallets());

  return (
    <div className="space-y-4 p-2">
      {noWallet && (
        <Alert variant="warning">
          <CircleAlertIcon className="size-4" />
          <AlertTitle>No e-wallet exists here</AlertTitle>
          <AlertDescription>Let&apos;s create one here first</AlertDescription>
        </Alert>
      )}
      <div>
        <h3>Create an e-wallet</h3>
        <p className="text-sm">Create an e-wallet you wish to track</p>
      </div>
      <WalletForm />
    </div>
  );
}
