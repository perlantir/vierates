import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FOOTER_DISCLOSURE,
  FooterDisclosures,
} from "../components/footer-disclosures";
import { RateDisplay } from "../components/rate-display";
import { consentTextForParty } from "../lib/consent/text";

describe("Prompt 2 component contracts", () => {
  it("renders the exact footer disclosure", () => {
    expect(FOOTER_DISCLOSURE).toBe(
      "VieRates is a marketplace, not a lender, mortgage broker, or loan originator. VieRates does not make loans, take loan applications, or make credit decisions. All credit decisions are made by participating lenders. NMLS Consumer Access: nmlsconsumeraccess.org.",
    );
    expect(renderToString(<FooterDisclosures />)).toContain(FOOTER_DISCLOSURE);
  });

  it("requires all RateDisplay compliance props in development", () => {
    expect(() =>
      renderToString(
        <RateDisplay
          apr="6.012%"
          asOfDate="June 10, 2026"
          assumptions=""
          rate="5.875%"
        />,
      ),
    ).toThrow("RateDisplay missing compliance props");
  });

  it("renders rate and APR figures with assumptions", () => {
    const html = renderToString(
      <RateDisplay
        apr="6.012%"
        asOfDate="June 10, 2026"
        assumptions="$450,000 loan, 75% LTV, 740+ credit band, 45-day lock."
        rate="5.875%"
      />,
    );

    expect(html).toContain("APR");
    expect(html).toContain("6.012%");
    expect(html).toContain("75% LTV");
  });

  it("names the exact consent party", () => {
    const text = consentTextForParty("Prairie Home Lending LLC");

    expect(text).toContain("Prairie Home Lending LLC");
    expect(text).toContain("Reply STOP to opt out");
  });
});
