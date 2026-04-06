<script>
  import { users, transactions, PASTEL_COLORS } from '../store.js';
  import { dndzone, TRIGGERS } from 'svelte-dnd-action';
  import { Trash2, AlertCircle, X } from 'lucide-svelte';

  // We need a local copy of users for the dndzone to work correctly
  let items = [];
  $: items = $users.map(user => ({ 
    ...user, 
    isTrayItem: true 
  }));

  let showDuplicateModal = false;
  let duplicateWarning = "";

  function handleDndConsider(event) {
    items = event.detail.items;
  }

  function handleDndFinalize(event) {
    // Revert items back to the pure users list so the tray never loses its original items
    items = $users.map(user => ({ ...user, isTrayItem: true }));
  }

  function removeUser(userId) {
    $users = $users.filter(user => user.id !== userId);
  }

  function attemptNameChange(userId, oldName, newName, eventTarget) {
     const trimmedName = newName.trim();
     
     if (!trimmedName) {
        eventTarget.value = oldName;
        return;
     }

     const isDuplicate = $users.some(user => user.id !== userId && user.name.trim() === trimmedName);
     if (isDuplicate) {
        duplicateWarning = trimmedName;
        showDuplicateModal = true;
        eventTarget.value = oldName; // revert visually
        return;
     }

     $users = $users.map(user => user.id === userId ? { ...user, name: trimmedName } : user);
  }

  function handleNameChange(event, user) {
     attemptNameChange(user.id, user.name, event.target.value, event.target);
  }

  let activePickerId = null;

  function togglePicker(userId) {
     activePickerId = activePickerId === userId ? null : userId;
  }

  function selectColor(userId, color) {
     $users = $users.map(u => u.id === userId ? { ...u, color: color } : u);
     activePickerId = null;
  }

  // Spender stats: how much each user actually paid across all transactions
  $: spenderStats = (() => {
    const stats = $users.map(user => {
      let totalPaid = 0;
      $transactions.forEach(tx => {
        const txAmount = tx.qty * tx.price;
        let remaining = txAmount;
        let customCount = 0;
        tx.paidBy.forEach(p => {
          if (p.customPaidAmount !== undefined) {
            remaining -= p.customPaidAmount;
            customCount++;
          }
        });
        const autoCount = tx.paidBy.length - customCount;
        const autoAmt = autoCount > 0 ? Math.max(0, remaining / autoCount) : 0;
        tx.paidBy.forEach(p => {
          const uid = p.originalUserId || p.id;
          if (uid === user.id) {
            totalPaid += p.customPaidAmount !== undefined ? p.customPaidAmount : autoAmt;
          }
        });
      });
      return { ...user, totalPaid };
    });
    return stats.sort((a, b) => b.totalPaid - a.totalPaid);
  })();

  $: maxPaid = spenderStats.length > 0 ? Math.max(...spenderStats.map(s => s.totalPaid), 1) : 1;
  $: totalPaidAll = spenderStats.reduce((sum, s) => sum + s.totalPaid, 0);

  const rankEmoji = ['🥇', '🥈', '🥉'];

  function getFunLabel(stat, rank, total) {
    if (total === 0) return '🦗 ยังไม่มีใครจ่ายเลย';
    if (stat.totalPaid === 0) return '🪨 ตังค์อยู่ที่ไหน??';
    if (rank === 0) return 'Top Spender';
    if (rank === 1) return '😤 เกือบแล้ว';
    if (rank === spenderStats.length - 1 && stat.totalPaid < total / spenderStats.length * 0.5) return '👀 แอบเบี้ยว';
    return '👌 โอเค';
  }
</script>

<div class="flex flex-col gap-3 min-h-[100px] relative"
     use:dndzone={{items: items, type: 'user', flipDurationMs: 200, dropFromOthersDisabled: true}}
     on:consider={handleDndConsider}
     on:finalize={handleDndFinalize}>
  {#each items as user (user.id)}
    <div class="flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 p-2 rounded-xl group relative transition-all shadow-sm">
      <div class="relative">
        <button 
          type="button"
          on:dblclick|stopPropagation={() => togglePicker(user.id)}
          class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-stone-200 shadow-inner shrink-0 leading-none pb-0.5 border transition-all {user.color}"
          title="ดับเบิลคลิกเพื่อเลือกสี"
        >
          {user.name.substring(0, 2).trim()}
        </button>

        {#if activePickerId === user.id}
          <!-- Overlay to close picker -->
          <div 
            class="fixed inset-0 z-10" 
            on:click|stopPropagation={() => activePickerId = null}
            role="presentation"
          ></div>
          
          <!-- Picker Popover -->
          <div class="absolute top-10 left-0 z-20 bg-white border border-stone-200 rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 w-32 animate-in fade-in zoom-in duration-150 origin-top-left">
            {#each PASTEL_COLORS as color}
              <button 
                type="button"
                on:click|stopPropagation={() => selectColor(user.id, color)}
                class="w-6 h-6 rounded-full border border-stone-100 transition-transform active:scale-90 {color} {user.color === color ? 'ring-2 ring-stone-400 ring-offset-1' : ''}"
                aria-label="เลือกสีนี้"
              ></button>
            {/each}
          </div>
        {/if}
      </div>
      <input type="text" value={user.name} 
             on:change={(e) => handleNameChange(e, user)}
             class="bg-transparent border-none outline-none focus:ring-1 focus:ring-stone-400 rounded px-2 py-1.5 flex-grow text-sm text-stone-700 min-w-0" />
      
      {#if items.length > 1}
        <button on:click={() => removeUser(user.id)} class="text-stone-300 hover:text-red-500 transition absolute right-2 bg-stone-50 rounded-md p-1.5 cursor-pointer shadow-sm active:scale-95 hover:bg-red-50">
          <Trash2 size={14} />
        </button>
      {/if}
    </div>
  {/each}
</div>

<!-- {#if spenderStats.length > 0}
  <div class="mt-4 rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden shadow-sm">
    <div class="flex items-center gap-2 px-3 pt-3 pb-2">
      <span class="text-base">💸</span>
      <span class="text-xs font-semibold text-stone-500 uppercase tracking-wide">ใครจ่ายเท่าไหร่</span>
    </div>

    <div class="flex flex-col gap-1 px-3 pb-3">
      {#each spenderStats as stat, i}
        {@const barPct = maxPaid > 0 ? (stat.totalPaid / maxPaid) * 100 : 0}
        {@const label = getFunLabel(stat, i, totalPaidAll)}
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-sm shrink-0">{i < 3 ? rankEmoji[i] : '▪️'}</span>
              <button
                type="button"
                class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 border {stat.color}"
              >{stat.name.substring(0, 2).trim()}</button>
              <span class="text-xs text-stone-700 font-medium truncate">{stat.name}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[10px] text-stone-400">{label}</span>
              <span class="text-xs font-semibold text-stone-700 tabular-nums">
                {stat.totalPaid > 0 ? '฿' + stat.totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '฿0'}
              </span>
            </div>
          </div>
          <div class="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 {stat.color.split(' ')[0].replace('-200', '-400')}"
              style="width: {barPct}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if} -->

{#if showDuplicateModal}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1917]/40 backdrop-blur-sm px-4">
    <div class="bg-[#ffffff] rounded-2xl shadow-xl w-full max-w-xs overflow-hidden p-6 relative flex flex-col items-center text-center">
       <button on:click={() => showDuplicateModal = false} class="absolute top-4 right-4 text-[#a8a29e] hover:text-[#44403c] cursor-pointer">
         <X size={20} />
       </button>
       <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
          <AlertCircle size={24} />
       </div>
       <h3 class="text-lg font-semibold text-[#292524] mb-2">ชื่อซ้ำกัน</h3>
       <p class="text-sm text-[#78716c] mb-6">มีเพื่อนชื่อ <span class="font-bold text-stone-800">"{duplicateWarning}"</span> อยู่ในรายการแล้ว กรุณาใช้ชื่ออื่น</p>
       <button on:click={() => showDuplicateModal = false} class="w-full bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#44403c] py-2.5 rounded-xl font-medium cursor-pointer transition">เข้าใจแล้ว</button>
    </div>
  </div>
{/if}
