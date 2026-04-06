<script>
  import { transactions } from '../store.js';
  import TransactionItem from './TransactionItem.svelte';
  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
</script>

<div class="flex flex-col relative gap-2">
  {#each $transactions as transaction (transaction.id)}
    <div animate:flip={{ duration: 400, easing: cubicOut }} in:slide={{ duration: 300, easing: cubicOut }} out:slide={{ duration: 250 }}>
      <TransactionItem {transaction} />
    </div>
  {/each}
  {#if $transactions.length === 0}
    <div class="text-center py-12 text-stone-400 italic text-sm">
      ยังไม่มีรายการ กดเพิ่มใหม่ด้านบน
    </div>
  {/if}
</div>
