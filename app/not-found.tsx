import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className="vr-section min-h-[70vh] bg-paper">
        <div className="vr-frame max-w-3xl">
          <p className="vr-data text-sm text-text-muted">404</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-ink">
            This page is sealed.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-text-muted">
            The page you opened does not exist, but the marketplace is still
            here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/" variant="secondary">
              Go home
            </Button>
            <Button href="/app/new">Start my listing</Button>
          </div>
        </div>
      </main>
      <FooterDisclosures />
    </>
  );
}
