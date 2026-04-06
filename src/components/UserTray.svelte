<script>
  import { users, PASTEL_COLORS } from '../store.js';
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
