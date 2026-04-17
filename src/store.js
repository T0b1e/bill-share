import { writable, derived } from 'svelte/store';

function uuidv4() {
  return crypto.randomUUID();
}

function createPersistedStore(key, startValue) {
  let initialValue = startValue;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      initialValue = JSON.parse(stored);
    } catch (e) {}
  }
  const store = writable(initialValue);
  store.subscribe(val => localStorage.setItem(key, JSON.stringify(val)));
  return store;
}

const MIN_SETTLEMENT_THRESHOLD = 0.01;

export const users = createPersistedStore('billshare_users', [
  { id: uuidv4(), name: 'เพื่อน 1', color: 'bg-rose-200 text-rose-900 border-rose-300' },
  { id: uuidv4(), name: 'เพื่อน 2', color: 'bg-blue-200 text-blue-900 border-blue-300' }
]);

export const PASTEL_COLORS = [
  'bg-emerald-200 text-emerald-900 border-emerald-300',
  'bg-purple-200 text-purple-900 border-purple-300',
  'bg-amber-200 text-amber-900 border-amber-300',
  'bg-pink-200 text-pink-900 border-pink-300',
  'bg-cyan-200 text-cyan-900 border-cyan-300',
  'bg-orange-200 text-orange-900 border-orange-300',
  'bg-violet-200 text-violet-900 border-violet-300',
  'bg-lime-200 text-lime-900 border-lime-300',
  'bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300'
];

export const autoApplyPayer = createPersistedStore('billshare_autoApplyPayer', false);

export const transactions = createPersistedStore('billshare_transactions', [
  { id: uuidv4(), name: 'รายการ 1', qty: 1, price: 0, paidBy: [], paidFor: [] }
]);

export const taxes = createPersistedStore('billshare_taxes', { serviceCharge: 0, vat: 0 });

export const poolSettings = createPersistedStore('billshare_poolSettings', {
  enabled: false,
  excludedUsers: []
});

export const settlement = derived(
  [users, transactions, taxes, poolSettings],
  ([$users, $transactions, $taxes, $poolSettings]) => {
    const balances = {};
    $users.forEach(user => {
      balances[user.id] = 0;
    });

    let totalBaseAmount = 0;
    let pooledAmount = 0;
    const pooledUserIds = new Set();

    // Identify pooled users
    if ($poolSettings.enabled) {
      $users.forEach(user => {
        if (!$poolSettings.excludedUsers.includes(user.id)) {
          pooledUserIds.add(user.id);
        }
      });
    }

    $transactions.forEach(transaction => {
      const transactionAmount = transaction.qty * transaction.price;
      totalBaseAmount += transactionAmount;

      const hasPayers = transaction.paidBy.length > 0;
      const hasEaters = transaction.paidFor.length > 0;

      if (hasPayers && hasEaters) {
        // Separate pooled and non-pooled eaters
        const pooledEaters = [];
        const nonPooledEaters = [];

        transaction.paidFor.forEach(eater => {
          const userId = eater.originalUserId || eater.id;
          if ($poolSettings.enabled && pooledUserIds.has(userId)) {
            pooledEaters.push(eater);
          } else {
            nonPooledEaters.push(eater);
          }
        });

        // Handle non-pooled eaters normally
        nonPooledEaters.forEach(eater => {
          const amountPerEater = transactionAmount / transaction.paidFor.length;
          const userId = eater.originalUserId || eater.id;
          if (balances[userId] !== undefined) {
            balances[userId] -= amountPerEater;
          }
        });

        // Handle pooled eaters and payers
        if (pooledEaters.length > 0) {
          let remainingToPay = transactionAmount;
          let explicitPayersCount = 0;

          transaction.paidBy.forEach(payer => {
            if (payer.customPaidAmount !== undefined) {
              remainingToPay -= payer.customPaidAmount;
              explicitPayersCount += 1;
            }
          });

          const autoPayersCount = transaction.paidBy.length - explicitPayersCount;
          const autoPaidAmountPerPerson = autoPayersCount > 0 ? Math.max(0, remainingToPay / autoPayersCount) : 0;

          // Credit payers
          transaction.paidBy.forEach(payer => {
            const userId = payer.originalUserId || payer.id;
            const amountPaid = payer.customPaidAmount !== undefined
              ? payer.customPaidAmount
              : autoPaidAmountPerPerson;

            if (balances[userId] !== undefined) {
              balances[userId] += amountPaid;
            }
          });

          // For pooled eaters, add to pool if pool is enabled
          if ($poolSettings.enabled) {
            pooledAmount += transactionAmount;
            // Don't debit individuals yet, will split pool among all pooled users
          } else {
            // Normal split among pooled eaters
            const amountPerEater = transactionAmount / pooledEaters.length;
            pooledEaters.forEach(eater => {
              const userId = eater.originalUserId || eater.id;
              if (balances[userId] !== undefined) {
                balances[userId] -= amountPerEater;
              }
            });
          }
        }
      }
    });

    // If pool is enabled, split pooled amount equally among all pooled users
    if ($poolSettings.enabled && pooledUserIds.size > 0) {
      const amountPerPooledUser = pooledAmount / pooledUserIds.size;
      pooledUserIds.forEach(userId => {
        balances[userId] -= amountPerPooledUser;
      });
    }

    const scPercentage = $taxes.serviceCharge / 100;
    const vatPercentage = $taxes.vat / 100;
    
    const scAmount = totalBaseAmount * scPercentage;
    const vatAmount = totalBaseAmount * vatPercentage;
    const taxMultiplier = 1 + scPercentage + vatPercentage;

    // Apply tax multiplier proportionally across balances
    // This assumes the prices and payments entered were pre-tax
    if (taxMultiplier > 1 && totalBaseAmount > 0) {
      Object.keys(balances).forEach(userId => {
        balances[userId] *= taxMultiplier;
      });
    }

    const grandTotal = totalBaseAmount + scAmount + vatAmount;

    // Separate into debtors and creditors
    let debtors = [];
    let creditors = [];
    
    for (const [userId, balance] of Object.entries(balances)) {
      if (balance < -MIN_SETTLEMENT_THRESHOLD) {
        debtors.push({ id: userId, amount: Math.abs(balance) });
      } else if (balance > MIN_SETTLEMENT_THRESHOLD) {
        creditors.push({ id: userId, amount: balance });
      }
    }

    // Sort to settle largest amounts first (greedy algorithm)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      transfers.push({
        from: debtor.id,
        to: creditor.id,
        amount: transferAmount
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      if (debtor.amount < MIN_SETTLEMENT_THRESHOLD) {
        debtorIndex += 1;
      }
      if (creditor.amount < MIN_SETTLEMENT_THRESHOLD) {
        creditorIndex += 1;
      }
    }

    return { 
      total: totalBaseAmount, 
      grandTotal, 
      transfers, 
      scAmount, 
      vatAmount 
    };
  }
);

// Sync transactions when users are deleted
users.subscribe($users => {
  const currentUserIds = new Set($users.map(user => user.id));
  
  transactions.update($transactions => {
    let hasChanges = false;
    
    const updatedTransactions = $transactions.map(transaction => {
      const filteredPaidBy = transaction.paidBy.filter(payer => {
        const userId = payer.originalUserId || payer.id;
        return currentUserIds.has(userId);
      });
      
      const filteredPaidFor = transaction.paidFor.filter(eater => {
        const userId = eater.originalUserId || eater.id;
        return currentUserIds.has(userId);
      });
      
      if (filteredPaidBy.length !== transaction.paidBy.length || 
          filteredPaidFor.length !== transaction.paidFor.length) {
        hasChanges = true;
        return { 
          ...transaction, 
          paidBy: filteredPaidBy, 
          paidFor: filteredPaidFor 
        };
      }
      
      return transaction;
    });
    
    return hasChanges ? updatedTransactions : $transactions;
  });
});
