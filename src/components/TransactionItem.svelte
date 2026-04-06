<script>
  import { dndzone, TRIGGERS } from "svelte-dnd-action";
  import { X } from "lucide-svelte";
  import { transactions, users, autoApplyPayer } from "../store.js";

  function uuidv4() {
    return crypto.randomUUID();
  }

  export let transaction;

  // Local reactive properties for dnd-action to work with
  let paidByItems = [];
  let paidForItems = [];

  let showPayerModal = false;
  let modalUser = null;
  let customAmount = "";

  $: paidByItems = transaction.paidBy;
  $: paidForItems = transaction.paidFor;

  function removeDuplicates(items) {
    const seen = new Set();
    return items.filter((item) => {
      const userId = item.originalUserId || item.id;
      if (seen.has(userId)) return false;
      seen.add(userId);
      return true;
    });
  }

  function handleConsiderBy(e) {
    paidByItems = e.detail.items;
  }

  function handleFinalizeBy(e) {
    let items = e.detail.items;

    // Remove user if dropped outside
    if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
      const droppedUserId = e.detail.info.id;
      items = items.filter((item) => item.id !== droppedUserId);
    }

    const finalized = removeDuplicates(
      items.map((item) => {
        // If the item came from the UserTray, we need to clone it as a transaction-specific item
        if (item.isTrayItem) {
          return {
            ...item,
            originalUserId: item.id,
            id: uuidv4(),
            isTrayItem: false,
          };
        }
        return item;
      }),
    );

    if ($autoApplyPayer) {
      $transactions = $transactions.map((currentTransaction) => {
        if (currentTransaction.id === transaction.id) {
          return { ...currentTransaction, paidBy: finalized };
        } else {
          // Sync the payers across all transactions
          const clonedPayers = finalized.map((payer) => ({
            ...payer,
            id: uuidv4(),
          }));
          return { ...currentTransaction, paidBy: clonedPayers };
        }
      });
    } else {
      $transactions = $transactions.map((currentTransaction) => {
        return currentTransaction.id === transaction.id
          ? { ...currentTransaction, paidBy: finalized }
          : currentTransaction;
      });
    }

    // If a single user was dropped into the zone, open the custom amount modal
    const isSingleDrop =
      e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ZONE &&
      finalized.length > 1;
    if (isSingleDrop) {
      const droppedId = e.detail.info.id;
      const droppedUser = finalized.find(
        (user) => user.id === droppedId || user.originalUserId === droppedId,
      );
      if (droppedUser) {
        setTimeout(() => openPayerModal(droppedUser), 50);
      }
    }
  }

  function openPayerModal(user) {
    // Only show modal if there are multiple payers to split between
    if (transaction.paidBy.length > 1) {
      modalUser = user;
      customAmount =
        user.customPaidAmount !== undefined ? user.customPaidAmount : "";
      showPayerModal = true;
    }
  }

  function savePayerAmount() {
    const parsedAmount = parseFloat(customAmount);
    const isEmpty = customAmount === "";

    const finalized = transaction.paidBy.map((user) => {
      if (user.id === modalUser.id) {
        let updatedUser = { ...user };
        if (isEmpty || isNaN(parsedAmount)) {
          delete updatedUser.customPaidAmount;
        } else {
          updatedUser.customPaidAmount = Math.max(0, parsedAmount);
        }
        return updatedUser;
      }
      return user;
    });

    if ($autoApplyPayer) {
      $transactions = $transactions.map((currentTransaction) => {
        if (currentTransaction.id === transaction.id) {
          return { ...currentTransaction, paidBy: finalized };
        } else {
          // Sync custom amounts too if auto-apply is on
          const clonedPayers = finalized.map((user) => ({
            ...user,
            id: uuidv4(),
          }));
          return { ...currentTransaction, paidBy: clonedPayers };
        }
      });
    } else {
      $transactions = $transactions.map((currentTransaction) => {
        return currentTransaction.id === transaction.id
          ? { ...currentTransaction, paidBy: finalized }
          : currentTransaction;
      });
    }

    showPayerModal = false;
    modalUser = null;
    customAmount = "";
  }

  function shareWithAll() {
    const allUsers = $users.map((user) => ({
      ...user,
      originalUserId: user.id,
      id: uuidv4(),
      isTrayItem: false,
    }));

    $transactions = $transactions.map((currentTransaction) => {
      return currentTransaction.id === transaction.id
        ? { ...currentTransaction, paidFor: allUsers }
        : currentTransaction;
    });
  }

  function handleConsiderFor(e) {
    paidForItems = e.detail.items;
  }

  function handleFinalizeFor(e) {
    let items = e.detail.items;

    if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
      items = items.filter((user) => user.id !== e.detail.info.id);
    }

    const finalized = removeDuplicates(
      items.map((item) => {
        let cleanItem = { ...item };
        // Debtors shouldn't have custom payment info
        delete cleanItem.customPaidAmount;

        if (cleanItem.isTrayItem) {
          return {
            ...cleanItem,
            originalUserId: cleanItem.id,
            id: uuidv4(),
            isTrayItem: false,
          };
        }
        return cleanItem;
      }),
    );

    $transactions = $transactions.map((currentTransaction) => {
      return currentTransaction.id === transaction.id
        ? { ...currentTransaction, paidFor: finalized }
        : currentTransaction;
    });
  }

  function updateField(fieldName, newValue) {
    const updatedTransactions = $transactions.map((currentTransaction) => {
      const isMatch = currentTransaction.id === transaction.id;
      if (isMatch) {
        return { ...currentTransaction, [fieldName]: newValue };
      }
      return currentTransaction;
    });

    $transactions = updatedTransactions;
  }

  function removeTransaction() {
    $transactions = $transactions.filter(
      (currentTransaction) => currentTransaction.id !== transaction.id,
    );
  }

  function handleNameInput(event) {
    updateField("name", event.target.value);
  }

  function handleQtyInput(event) {
    const value = parseFloat(event.target.value);
    updateField("qty", isNaN(value) ? 1 : value);
  }

  function handlePriceInput(event) {
    const value = parseFloat(event.target.value);
    updateField("price", isNaN(value) ? 0 : value);
  }

  function getAvText(user) {
    const userId = user.originalUserId || user.id;
    const foundUser = $users.find((u) => u.id === userId);
    const name = foundUser ? foundUser.name : user.name;
    return name.substring(0, 2).trim();
  }

  function getFullAvName(user) {
    const userId = user.originalUserId || user.id;
    const foundUser = $users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : user.name;
  }

  function getAvColor(user) {
    const userId = user.originalUserId || user.id;
    const foundUser = $users.find((u) => u.id === userId);
    return foundUser
      ? foundUser.color
      : "bg-stone-200 text-stone-700 border-stone-300";
  }

  function getPayerLabel(user) {
    const totalAmount = transaction.qty * transaction.price;
    if (totalAmount === 0 || transaction.paidBy.length <= 1) {
      return "";
    }

    let unassignedAmount = totalAmount;
    let assignedCount = 0;

    transaction.paidBy.forEach((payer) => {
      if (payer.customPaidAmount !== undefined) {
        unassignedAmount -= payer.customPaidAmount;
        assignedCount += 1;
      }
    });

    const remainingCount = transaction.paidBy.length - assignedCount;
    const paidPerPerson =
      remainingCount > 0 ? Math.max(0, unassignedAmount / remainingCount) : 0;

    const userPaid =
      user.customPaidAmount !== undefined
        ? user.customPaidAmount
        : paidPerPerson;
    const percentage = Math.round((userPaid / totalAmount) * 100);
    return `${percentage}%`;
  }
</script>

{#if showPayerModal && modalUser}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1917]/40 backdrop-blur-sm px-4"
  >
    <div
      class="bg-[#ffffff] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative"
    >
      <button
        on:click={() => (showPayerModal = false)}
        class="absolute top-4 right-4 text-[#a8a29e] hover:text-[#44403c] cursor-pointer"
      >
        <X size={20} />
      </button>
      <h3 class="text-lg font-medium text-[#292524] mb-2">
        ยอดเงินที่ {getFullAvName(modalUser)} จ่าย
      </h3>
      <p class="text-sm text-[#78716c] mb-4 tracking-wide">
        ปล่อยว่างเพื่อหารเท่าๆ กัน (Leave blank for equal split)
      </p>

      <div class="flex items-center gap-2 mb-6">
        <input
          type="number"
          bind:value={customAmount}
          min="0"
          class="flex-1 bg-[#fafaf9] border border-[#e7e5e4] text-[#292524] rounded-lg px-4 py-2 outline-none focus:border-[#78716c]"
          placeholder="จำนวนเงินดิบ (บาท)"
        />
        <span class="text-[#78716c] font-medium">บาท</span>
      </div>

      <div class="flex gap-3">
        <button
          on:click={() => {
            customAmount = "";
            savePayerAmount();
          }}
          class="flex-1 bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#44403c] py-2 rounded-lg font-medium cursor-pointer transition"
          >หารเท่ากัน</button
        >
        <button
          on:click={savePayerAmount}
          class="flex-1 bg-[#292524] hover:bg-[#1c1917] text-[#ffffff] py-2 rounded-lg font-medium cursor-pointer transition shadow-sm active:scale-95"
          >บันทึก</button
        >
      </div>
    </div>
  </div>
{/if}

<div
  class="flex flex-col lg:flex-row gap-6 py-2 border-b border-stone-100 last:border-0 relative group items-start"
>
  <!-- Left info -->
  <div class="flex-grow flex flex-col gap-3 w-full lg:w-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 w-full">
      <input
        type="text"
        value={transaction.name}
        on:input={handleNameInput}
        class="text-lg font-medium text-stone-800 bg-transparent outline-none focus:border-b border-stone-300 flex-1 min-w-[120px] placeholder-stone-300"
        placeholder="ชื่อรายการ"
      />
      <div class="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg">
        <span class="text-stone-700 font-medium text-sm"
          >{(transaction.qty * transaction.price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</span
        >
        <span class="text-stone-500 text-xs mt-1 tracking-wide">บาท</span>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-3 text-sm text-stone-600">
      <div class="flex items-center gap-1.5">
        <span class="text-stone-400 text-base">จำนวน</span>
        <input
          type="number"
          min="1"
          value={transaction.qty}
          on:input={handleQtyInput}
          class="w-20 bg-stone-50 border border-stone-200 rounded-lg text-center outline-none focus:border-stone-400 py-2 text-base text-stone-700"
        />
      </div>
      <span class="text-stone-300 text-lg">x</span>
      <div class="flex items-center gap-1.5">
        <span class="text-stone-400 text-base">ราคา</span>
        <input
          type="number"
          min="0"
          value={transaction.price}
          on:input={handlePriceInput}
          class="w-32 bg-stone-50 border border-stone-200 rounded-lg text-right px-3 outline-none focus:border-stone-400 py-2 text-base text-stone-700"
        />
      </div>
    </div>
  </div>

  <!-- Right Dropzones -->
  <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-[420px] shrink-0">
    <div class="flex flex-col gap-1 flex-1">
      <div class="px-1 text-xs text-stone-400 font-medium tracking-wide mt-1">
        จ่ายโดย
      </div>
      <div
        class="min-h-[62px] bg-stone-50 border border-dashed border-stone-200 rounded-xl p-1.5 flex flex-wrap gap-1.5 items-center transition-colors shadow-inner"
        use:dndzone={{ items: paidByItems, type: "user", flipDurationMs: 200 }}
        on:consider={handleConsiderBy}
        on:finalize={handleFinalizeBy}
      >
        {#each paidByItems as user (user.id)}
          <button
            type="button"
            class="w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm cursor-pointer active:scale-95 leading-none pb-0.5 border relative {getAvColor(
              user,
            )}"
            title={getFullAvName(user)}
            on:click={() => openPayerModal(user)}
          >
            {getAvText(user)}
            {#if paidByItems.length > 1}
              <div
                class="absolute -bottom-1.5 -right-2 bg-stone-800 dark:bg-stone-600 text-white text-[9px] px-1 rounded-sm shadow-sm leading-none py-0.5 pointer-events-none z-10 font-bold tracking-tight"
              >
                {getPayerLabel(user)}
              </div>
            {/if}
          </button>
        {/each}
        {#if paidByItems.length === 0}
          <div
            class="text-xs text-stone-400 w-full text-center py-2 pointer-events-none select-none"
          >
            ลากเพื่อนมาวาง
          </div>
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-1 flex-1">
      <div class="flex justify-between items-center px-1">
        <div class="text-xs text-stone-400 font-medium tracking-wide mt-1">
          ใช้โดย
        </div>
        <button
          on:click={shareWithAll}
          class="text-[10px] text-stone-500 font-semibold uppercase bg-stone-100 hover:bg-stone-200 transition-colors px-2 py-0.5 rounded cursor-pointer shadow-sm active:shadow-none active:translate-y-[1px]"
          >ทุกคน</button
        >
      </div>
      <div
        class="min-h-[62px] bg-stone-50 border border-dashed border-stone-200 rounded-xl p-1.5 flex flex-wrap gap-1.5 items-center transition-colors shadow-inner"
        use:dndzone={{ items: paidForItems, type: "user", flipDurationMs: 200 }}
        on:consider={handleConsiderFor}
        on:finalize={handleFinalizeFor}
      >
        {#each paidForItems as user (user.id)}
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shadow-sm cursor-grab active:cursor-grabbing leading-none pb-0.5 border {getAvColor(
              user,
            )}"
            title={getFullAvName(user)}
          >
            {getAvText(user)}
          </div>
        {/each}
        {#if paidForItems.length === 0}
          <div
            class="text-xs text-stone-400 w-full text-center py-2 pointer-events-none select-none"
          >
            ลากเพื่อนมาวาง
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if $transactions.length > 1}
    <button
      on:click={removeTransaction}
      class="absolute top-4 right-1 lg:-right-4 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-full"
    >
      <X size={18} />
    </button>
  {/if}
</div>
