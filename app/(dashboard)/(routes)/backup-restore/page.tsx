import { BackupCard } from "./components/backup-card";
import { RestoreCard } from "./components/restore-card";

export default function Page() {
  return (
    <div className="space-y-8 bg-gradient-to-br p-2">
      <div>
        <h3>Backup & Restore</h3>
        <p className="text-sm">
          Manage your data backups and restore from previous versions
        </p>
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-2">
        <BackupCard />
        <RestoreCard />
      </div>
    </div>
  );
}
