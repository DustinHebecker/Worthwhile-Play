/**
 * Household money in integer cents with an exact audit trail.
 *
 * Every change is either a transfer between the household's own accounts (wealth unchanged) or an
 * external flow tagged with a category (income, taxes, rent, market gains …). The invariant
 * `Σ balances − Σ opening balances = Σ flows` holds after any sequence of operations, so money never
 * appears from nothing. Balances may be negative (overdraft, loans). All functions are pure.
 */
export type Cents = number;

export interface Ledger {
  /** Account id → balance in cents. */
  balances: Record<string, Cents>;
  /** Category → cumulative external flow in cents (positive = into the household). */
  flows: Record<string, Cents>;
  /** Σ balances when the ledger was opened. */
  opening: Cents;
}

const ID = /^[a-z][a-z0-9-]{0,39}(?::[a-z0-9-]{1,40})?$/;

export function isAccountId(value: unknown): value is string {
  return typeof value === 'string' && ID.test(value);
}

function checkCents(cents: number): void {
  if (!Number.isSafeInteger(cents)) throw new RangeError(`Not a whole number of cents: ${cents}`);
}

function checkSafe(value: number): Cents {
  if (!Number.isSafeInteger(value)) throw new RangeError('Ledger value outside the safe integer range.');
  return value;
}

function sum(record: Record<string, Cents>): Cents {
  let total = 0;
  for (const v of Object.values(record)) total = checkSafe(total + v);
  return total;
}

export function openLedger(balances: Readonly<Record<string, Cents>> = {}): Ledger {
  for (const [id, v] of Object.entries(balances)) {
    if (!isAccountId(id)) throw new RangeError(`Invalid account id: ${id}`);
    checkCents(v);
  }
  const copy = { ...balances };
  return { balances: copy, flows: {}, opening: sum(copy) };
}

export function balanceOf(ledger: Ledger, account: string): Cents {
  return Object.hasOwn(ledger.balances, account) ? (ledger.balances[account] as Cents) : 0;
}

export function flowOf(ledger: Ledger, category: string): Cents {
  return Object.hasOwn(ledger.flows, category) ? (ledger.flows[category] as Cents) : 0;
}

/** Sum of all account balances (assets minus debts held as negative balances). */
export function netWorth(ledger: Ledger): Cents {
  return sum(ledger.balances);
}

/** External flow: `cents` > 0 enters `account` from outside, < 0 leaves it. */
export function book(ledger: Ledger, account: string, cents: Cents, category: string): Ledger {
  if (!isAccountId(account)) throw new RangeError(`Invalid account id: ${account}`);
  if (!isAccountId(category)) throw new RangeError(`Invalid category: ${category}`);
  checkCents(cents);
  return {
    balances: { ...ledger.balances, [account]: checkSafe(balanceOf(ledger, account) + cents) },
    flows: { ...ledger.flows, [category]: checkSafe(flowOf(ledger, category) + cents) },
    opening: ledger.opening
  };
}

/** Moves `cents` from one own account to another; net worth is unchanged. */
export function transfer(ledger: Ledger, from: string, to: string, cents: Cents): Ledger {
  if (!isAccountId(from) || !isAccountId(to)) throw new RangeError('Invalid account id.');
  checkCents(cents);
  if (from === to) return ledger;
  return {
    balances: {
      ...ledger.balances,
      [from]: checkSafe(balanceOf(ledger, from) - cents),
      [to]: checkSafe(balanceOf(ledger, to) + cents)
    },
    flows: ledger.flows,
    opening: ledger.opening
  };
}

/** The conservation invariant; true for every ledger built with these functions. */
export function isBalanced(ledger: Ledger): boolean {
  return netWorth(ledger) - ledger.opening === sum(ledger.flows);
}

/** Structural check of untrusted data (saves); never throws. */
export function isLedger(value: unknown): value is Ledger {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const l = value as Record<string, unknown>;
    if (!Number.isSafeInteger(l.opening)) return false;
    for (const key of ['balances', 'flows'] as const) {
      const r = l[key];
      if (typeof r !== 'object' || r === null || Array.isArray(r)) return false;
      for (const [id, v] of Object.entries(r)) if (!isAccountId(id) || !Number.isSafeInteger(v)) return false;
    }
    return isBalanced(value as Ledger);
  } catch {
    return false;
  }
}
