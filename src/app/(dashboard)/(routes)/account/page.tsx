import { auth } from "@/lib/auth";
import { UserForm } from "./user-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PasswordForm } from "./password-form";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");
  return (
    <div className="space-y-2 p-2">
      <div>
        <h3>Account</h3>
        <p className="text-sm">Manage your account settings and preferences</p>
        <div className="mt-6 space-y-16">
          <UserForm
            key={session.user.name + session.user.email}
            initialData={session.user}
          />
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
