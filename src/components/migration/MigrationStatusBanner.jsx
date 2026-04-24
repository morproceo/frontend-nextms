import { useMigrationState } from '../../hooks/useMigrationState';

export function MigrationStatusBanner() {
  const migration = useMigrationState();

  if (!migration.isFrozen) {
    return null;
  }

  const isDryRun = migration.dryRun === 'freeze';
  const title = isDryRun
    ? 'Dry run: migration freeze preview'
    : 'Read-only mode is active';

  return (
    <div className="sticky top-0 z-[120] border-b border-amber-300 bg-amber-50 text-amber-950 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 text-sm sm:px-6 lg:px-8">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-amber-900/90">
          Create and update operations are temporarily unavailable while data migration is in progress.
          Read-only access remains available until {migration.redirectLabel}, when this site will redirect to the new MorPro Next login.
        </p>
      </div>
    </div>
  );
}

export default MigrationStatusBanner;
