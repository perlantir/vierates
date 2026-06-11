import Image from "next/image";
import Link from "next/link";

export const FOOTER_DISCLOSURE =
  "VieRates is a marketplace, not a lender, mortgage broker, or loan originator. VieRates does not make loans, take loan applications, or make credit decisions. All credit decisions are made by participating lenders.";

export function FooterDisclosures() {
  return (
    <footer className="bg-ink text-on-ink">
      <div className="vr-frame py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link
              aria-label="VieRates home"
              className="inline-flex items-center no-underline"
              href="/"
            >
              <Image
                alt=""
                className="h-10 w-10"
                height={44}
                src="/assets/logo-mark.svg"
                width={44}
              />
              <span className="ml-3 text-2xl font-semibold text-on-ink">
                VieRates
              </span>
            </Link>
            <p className="mt-3 max-w-[18rem] text-sm leading-6 text-on-ink-dim">
              Make lenders vie for you.
            </p>
          </div>
          <FooterColumn
            links={[
              ["How it works", "/how-it-works"],
              ["Bid index", "/bid-index"],
              ["FAQ", "/#faq"],
              ["Start my listing", "/app/new"],
              ["Waitlist", "/waitlist"],
            ]}
            title="Borrowers"
          />
          <FooterColumn
            links={[
              ["Lenders", "/lenders"],
              ["Trust", "/trust"],
              ["Licenses", "/legal/licenses"],
            ]}
            title="Marketplace"
          />
          <FooterColumn
            links={[
              ["About", "/about"],
              ["Privacy", "/legal/privacy"],
              ["Terms", "/legal/terms"],
              ["Consent", "/legal/consent"],
            ]}
            title="Company"
          />
        </div>

        <div className="mt-9 flex items-center gap-3 border-t border-ink-line pt-6">
          <Image
            alt="Equal Housing Opportunity"
            height={34}
            src="/assets/equal-housing.svg"
            width={34}
          />
          <p className="text-sm leading-6 text-on-ink-dim">
            Equal Housing Opportunity. We do business in accordance with the
            Fair Housing Act.
          </p>
        </div>

        <p className="mt-5 max-w-3xl text-xs leading-5 text-on-ink-dim">
          {FOOTER_DISCLOSURE}
        </p>
        <Link
          className="mt-2 inline-flex text-xs font-semibold text-on-ink no-underline underline-offset-4 hover:underline"
          href="https://www.nmlsconsumeraccess.org/"
        >
          NMLS Consumer Access
        </Link>
        <p className="vr-data mt-4 text-xs text-on-ink-dim">
          © 2026 VieRates, Inc.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  links,
  title,
}: {
  links: Array<[string, string]>;
  title: string;
}) {
  return (
    <div>
      <p className="vr-eyebrow mb-3 text-on-ink-dim">{title}</p>
      <ul className="flex list-none flex-col gap-2 p-0 text-sm text-on-ink">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link className="opacity-85" href={href}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
