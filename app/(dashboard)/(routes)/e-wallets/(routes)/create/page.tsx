import { CreateWalletForm } from "./components/create-wallet-form";

export default async function Page() {
  return (
    <div className="space-y-4 p-2">
      <div>
        <h3>Create an e-wallet</h3>
        <p className="text-sm">Create an e-wallet you wish to track</p>
      </div>
      <CreateWalletForm />
    </div>
  );
}
