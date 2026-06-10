export const borrowerSessionHeader = "x-vierates-borrower-session";

export function smsOptInText(phone: string): string {
  return `I agree that VieRates may text one verification code to ${phone}. Reply STOP to opt out. VieRates never sells my number.`;
}
