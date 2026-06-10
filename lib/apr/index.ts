export type AprBasisPoint = number;

export type AprInput = {
  financeChargeFees: number[];
  loanAmount: number;
  noteRateBp: number;
  points: number;
  termMonths: number;
};

export function calculateAprBp(input: AprInput): AprBasisPoint {
  const monthlyNoteRate = input.noteRateBp / 10_000 / 12;
  const notePayment = monthlyPayment(
    input.loanAmount,
    monthlyNoteRate,
    input.termMonths,
  );
  const prepaidFinanceCharges =
    (input.loanAmount * input.points) / 100 +
    input.financeChargeFees.reduce((sum, fee) => sum + fee, 0);
  const amountFinanced = input.loanAmount - prepaidFinanceCharges;

  if (prepaidFinanceCharges === 0) {
    return input.noteRateBp;
  }

  let low = 0;
  let high = 0.25 / 12;

  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    const paymentAtMid = monthlyPayment(amountFinanced, mid, input.termMonths);

    if (paymentAtMid > notePayment) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(((low + high) / 2) * 12 * 10_000);
}

export function formatApr(aprBp: AprBasisPoint): string {
  return `${(aprBp / 100).toFixed(3)}%`;
}

function monthlyPayment(
  principal: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  return (
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))
  );
}
