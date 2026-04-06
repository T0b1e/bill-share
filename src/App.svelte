<script>
  import { users, transactions, taxes, settlement, PASTEL_COLORS, autoApplyPayer } from './store.js';
  import UserTray from './components/UserTray.svelte';
  import TransactionList from './components/TransactionList.svelte';
  import SettlementSummary from './components/SettlementSummary.svelte';
  import { Plus, Sun, Moon, X } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let isDark = false;

  onMount(() => {
    isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function uuidv4() {
    return crypto.randomUUID();
  }

  function addUser() {
    const nextColor = PASTEL_COLORS[$users.length % PASTEL_COLORS.length];
    let userCount = $users.length + 1;
    
    // Ensure unique name for new user
    while ($users.some(user => user.name === `เพื่อน ${userCount}`)) {
      userCount++;
    }
    
    const newUser = { 
      id: uuidv4(), 
      name: `เพื่อน ${userCount}`, 
      color: nextColor 
    };
    
    $users = [...$users, newUser];
  }

  function handleToggleAutoApply() {
    const hasTransactions = $transactions.length > 0;
    
    if ($autoApplyPayer && hasTransactions) {
      const firstTransactionPayers = $transactions[0].paidBy;
      
      $transactions = $transactions.map((transaction, index) => {
        // Keep the first transaction as the template
        if (index === 0) {
          return transaction;
        }
        
        // Clone payers with new unique IDs for the current transaction
        const clonedPayers = firstTransactionPayers.map(payer => {
          return { ...payer, id: uuidv4() };
        });
        
        return { ...transaction, paidBy: clonedPayers };
      });
    }
  }

  function addTransaction() {
    let initialPaidBy = [];
    const hasExistingTransactions = $transactions.length > 0;

    if ($autoApplyPayer && hasExistingTransactions) {
      const firstTransactionPayers = $transactions[0].paidBy;
      initialPaidBy = firstTransactionPayers.map(payer => {
        return { ...payer, id: uuidv4() };
      });
    }

    const newTransaction = {
      id: uuidv4(),
      name: `รายการ ${$transactions.length + 1}`,
      qty: 1,
      price: 0,
      paidBy: initialPaidBy,
      paidFor: []
    };

    $transactions = [...$transactions, newTransaction];
  }

  let showClearModal = false;

  function clearTransactions() {
    showClearModal = true;
  }

  function confirmClearTransactions() {
    $transactions = [];
    showClearModal = false;
  }
</script>

<div class="min-h-screen p-4 md:p-8 flex flex-col items-center gap-4 pb-32 transition-colors duration-300">
  <div class="w-full max-w-7xl flex justify-between items-center px-2">
    <h1 class="text-3xl font-semibold tracking-tight text-stone-800 transition-colors">หารเงินจ้าฟ</h1>
    <button on:click={toggleTheme} class="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer active:scale-95 shadow-sm bg-white border border-stone-200" title="Toggle Theme">
      {#if isDark} <Sun size={22} /> {:else} <Moon size={22} /> {/if}
    </button>
  </div>

  <div class="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
    <div class="lg:col-span-4 flex flex-col gap-6 w-full shadow-sm rounded-2xl bg-white border border-stone-200">
      <div class="p-6 md:p-8 bg-white rounded-t-2xl border-b border-stone-100 flex flex-col min-h-[400px]">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-medium tracking-tight text-stone-800">รายการ 💸</h2>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
              <input type="checkbox" bind:checked={$autoApplyPayer} on:change={handleToggleAutoApply} class="w-4 h-4 text-stone-800 rounded border-stone-300 cursor-pointer accent-stone-700 mt-0.5" />
              <span class="font-medium">จ่ายทั้งหมด</span>
            </label>
            <button on:click={clearTransactions} class="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-sm font-medium border border-rose-200 cursor-pointer shadow-sm active:scale-95">
              เคลียร์ทุกรายการ
            </button>
            <button on:click={addTransaction} class="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-200">
              <Plus size={16} /> เพิ่มรายการ
            </button>
          </div>
        </div>
        <TransactionList />
      </div>

      <div class="p-3 md:p-8 bg-stone-50/50 rounded-b-2xl">
        <h2 class="text-xl font-medium tracking-tight text-stone-800 mb-6">สรุปและแบ่งบิล 📊</h2>
        <SettlementSummary />
      </div>
    </div>

    <!-- Right Side Tray -->
    <div class="lg:col-span-2 md:sticky md:top-8 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col w-full h-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-medium text-stone-800">เพื่อนๆ 😊</h2>
        <button on:click={addUser} class="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors p-2 hover:bg-stone-50 rounded-lg cursor-pointer font-medium" title="เพิ่มเพื่อน">
          <Plus size={18} /> เพิ่มรายการเพื่อน
        </button>
      </div>
      <UserTray />
    </div>
  </div>

  <!-- Footer -->
  <footer class="w-full text-center mt-auto pb-0 pt-12 flex justify-center opacity-80 hover:opacity-100 transition-opacity">
    <a href="https://github.com/T0b1e" target="_blank" rel="noopener noreferrer" class="text-stone-500 font-medium text-sm flex items-center gap-1.5 hover:text-stone-900 transition-colors">
      Designed by <span class="font-bold underline decoration-stone-300 underline-offset-2">T0b1e</span>
    </a>
  </footer>
</div>

{#if showClearModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1917]/40 backdrop-blur-sm px-4">
    <div class="bg-[#ffffff] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
       <button on:click={() => showClearModal = false} class="absolute top-4 right-4 text-[#a8a29e] hover:text-[#44403c] cursor-pointer">
         <X size={20} />
       </button>
       <h3 class="text-xl font-semibold text-rose-600 mb-2">เคลียร์ทุกรายการใช่หรือไม่?</h3>
       <p class="text-sm text-[#78716c] mb-6 tracking-wide">การกระทำนี้ไม่สามารถย้อนกลับได้ (This action cannot be undone.)</p>
       
       <div class="flex gap-3">
         <button on:click={() => showClearModal = false} class="flex-1 bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#44403c] py-3 rounded-xl font-medium cursor-pointer transition">ยกเลิก (Cancel)</button>
         <button on:click={confirmClearTransactions} class="flex-1 bg-rose-600 hover:bg-rose-700 text-[#ffffff] py-3 rounded-xl font-medium cursor-pointer transition shadow-sm active:scale-95">ยืนยัน (Confirm)</button>
       </div>
    </div>
  </div>
{/if}
