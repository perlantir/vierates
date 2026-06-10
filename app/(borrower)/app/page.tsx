export default function BorrowerDashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1100px] px-6 py-10">
      <h1 className="font-display text-4xl font-semibold">
        Borrower dashboard
      </h1>
      <p className="mt-3 max-w-2xl text-slate">
        Authenticated borrower surfaces will render owned listings and masked
        marketplace state here.
      </p>
    </main>
  );
}
