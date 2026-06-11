import { FooterDisclosures } from "@/components/footer-disclosures";
import { LenderOnboardingWizard } from "@/components/lender/onboarding-wizard";
import { NavBar } from "@/components/nav-bar";

export default function LenderOnboardingPage() {
  return (
    <>
      <NavBar />
      <main className="vr-section bg-paper">
        <div className="vr-frame">
          <LenderOnboardingWizard />
        </div>
      </main>
      <FooterDisclosures />
    </>
  );
}
