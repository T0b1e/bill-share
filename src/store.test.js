import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { users, transactions, taxes, settlement } from './store.js';

describe('Settlement Logic', () => {
  beforeEach(() => {
    // Reset stores to a clean state before each test
    // We use mock objects that match the expected structure
    users.set([
      { id: 'u1', name: 'User 1' },
      { id: 'u2', name: 'User 2' }
    ]);
    transactions.set([]);
    taxes.set({ serviceCharge: 0, vat: 0 });
  });

  it('calculates simple equal split correctly', () => {
    transactions.set([{
      id: 't1',
      qty: 1,
      price: 100,
      paidBy: [{ id: 'u1', name: 'User 1' }],
      paidFor: [{ id: 'u1', name: 'User 1' }, { id: 'u2', name: 'User 2' }]
    }]);

    const result = get(settlement);
    expect(result.total).toBe(100);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0]).toEqual({
      from: 'u2',
      to: 'u1',
      amount: 50
    });
  });

  it('applies Service Charge and VAT correctly', () => {
    transactions.set([{
      id: 't1',
      qty: 1,
      price: 100,
      paidBy: [{ id: 'u1', name: 'User 1' }],
      paidFor: [{ id: 'u2', name: 'User 2' }]
    }]);
    
    // 10% Service Charge, 7% VAT
    taxes.set({ serviceCharge: 10, vat: 7 });

    const result = get(settlement);
    // 100 + 10 (SC) + 7 (VAT) = 117
    expect(result.grandTotal).toBe(117);
    expect(result.transfers[0].amount).toBeCloseTo(117);
  });

  it('handles custom payment amounts correctly', () => {
    transactions.set([{
      id: 't1',
      qty: 1,
      price: 100,
      paidBy: [
        { id: 'u1', name: 'User 1', customPaidAmount: 30 },
        { id: 'u2', name: 'User 2' } // Result should be remaining 70
      ],
      paidFor: [
        { id: 'u1', name: 'User 1' }, 
        { id: 'u2', name: 'User 2' }
      ]
    }]);

    const result = get(settlement);
    // Total is 100. Split equal is 50 each.
    // User 1 paid 30, owes 50 -> net -20 (debtor)
    // User 2 paid 70, owes 50 -> net +20 (creditor)
    expect(result.transfers[0]).toEqual({
      from: 'u1',
      to: 'u2',
      amount: 20
    });
  });

  it('syncs correctly when a user is deleted', () => {
    users.set([
      { id: 'u1', name: 'User 1' },
      { id: 'u2', name: 'User 2' }
    ]);
    
    transactions.set([{
      id: 't1',
      qty: 1,
      price: 100,
      paidBy: [{ id: 'u1', name: 'User 1' }],
      paidFor: [{ id: 'u1', name: 'User 1' }, { id: 'u2', name: 'User 2' }]
    }]);

    // Delete User 2
    users.set([{ id: 'u1', name: 'User 1' }]);

    const currentTransactions = get(transactions);
    expect(currentTransactions[0].paidBy).toHaveLength(1);
    expect(currentTransactions[0].paidFor).toHaveLength(1);
    expect(currentTransactions[0].paidFor[0].id).toBe('u1');
    
    const result = get(settlement);
    expect(result.transfers).toHaveLength(0); // Only one person left
  });
});
