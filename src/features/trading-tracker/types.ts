/** `payout` = money in, `fee` = eval fee (money out). */
export type EntryType = 'payout' | 'fee';

export interface Entry {
  id: string;
  type: EntryType;
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Always a positive integer number of cents; `type` decides the direction. */
  amountCents: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export type EntryInput = Pick<Entry, 'type' | 'date' | 'amountCents' | 'notes'>;
