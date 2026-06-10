import { SectionHead } from "@/components/section-head";
import { WaitlistForm } from "@/components/waitlist-form";

export default function WaitlistPage() {
  return (
    <main className="vr-section bg-bone">
      <div className="vr-frame max-w-3xl">
        <SectionHead
          sub="Leave your email and we will tell you when VieRates opens in your area."
          title="Join the VieRates waitlist"
        />
        <WaitlistForm source="waitlist-page" />
      </div>
    </main>
  );
}
