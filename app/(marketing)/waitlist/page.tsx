import { SectionHead } from "@/components/section-head";
import { WaitlistForm } from "@/components/waitlist-form";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "Join the VieRates waitlist and get one update when anonymous mortgage bidding opens in your state.",
  path: "/waitlist",
  title: "Waitlist",
});

export default function WaitlistPage() {
  return (
    <main className="vr-section bg-paper">
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
