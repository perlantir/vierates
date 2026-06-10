export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10">
      <h1 className="font-display text-4xl font-semibold">Admin console</h1>
      <p className="mt-3 max-w-2xl text-slate">
        State rules, approvals, disputes, and audit logs are admin-only
        resources.
      </p>
    </main>
  );
}
