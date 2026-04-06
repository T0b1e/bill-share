<script>
  import { settlement, users, taxes, transactions } from "../store.js";

  function getUser(userId) {
    return $users.find((user) => user.id === userId) || { name: "Unknown", color: "bg-stone-200 text-stone-600 border-stone-300" };
  }
</script>

<div class="flex flex-col gap-3 text-stone-800 text-sm md:text-base">
  <!-- Subtotal -->
  <div class="flex justify-between items-center px-2">
    <span class="font-medium text-stone-500">ยอดรวมยอดดิบ (ก่อนหักภาษี)</span>
    <span class="text-xl font-semibold tracking-tight text-stone-600"
      >{$settlement.total.toFixed(2)}
      <span class="text-stone-400 text-sm font-normal">บาท</span></span
    >
  </div>

  <!-- Taxes/Charges inputs -->
  <div
    class="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm"
  >
    <div class="flex flex-col gap-1.5 w-full sm:w-1/2">
      <div class="flex justify-between items-center pr-1 overflow-hidden">
        <label
          for="service-charge"
          class="text-[10px] sm:text-xs text-stone-500 uppercase font-medium pl-1 truncate cursor-pointer"
          >ค่าบริการ (Service Charge %)</label
        >
        <span
          class="text-xs font-semibold text-stone-600 tracking-tight whitespace-nowrap"
          >+{$settlement.scAmount.toFixed(2)} ฿</span
        >
      </div>
      <input
        id="service-charge"
        type="number"
        min="0"
        bind:value={$taxes.serviceCharge}
        class="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 w-full transition-all"
        placeholder="0"
      />
    </div>
    <div class="flex flex-col gap-1.5 w-full sm:w-1/2">
      <div class="flex justify-between items-center pr-1 overflow-hidden">
        <label
          for="vat"
          class="text-[10px] sm:text-xs text-stone-500 uppercase font-medium pl-1 truncate cursor-pointer"
          >ภาษี (VAT %)</label
        >
        <span
          class="text-xs font-semibold text-stone-600 tracking-tight whitespace-nowrap"
          >+{$settlement.vatAmount.toFixed(2)} ฿</span
        >
      </div>
      <input
        id="vat"
        type="number"
        min="0"
        bind:value={$taxes.vat}
        class="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 w-full transition-all"
        placeholder="0"
      />
    </div>
  </div>

  <div
    class="flex justify-between items-center py-4 px-2 border-b-2 border-stone-200 border-dashed"
  >
    <span class="font-medium text-stone-600">ยอดรวมทั้งหมด (รวมภาษี)</span>
    <span class="text-2xl font-semibold tracking-tight text-stone-800"
      >{$settlement.grandTotal.toFixed(2)}
      <span class="text-stone-400 text-lg">บาท</span></span
    >
  </div>

  <div class="flex flex-col gap-3 pt-2">
    <h3
      class="text-sm font-semibold tracking-wide text-stone-400 uppercase mb-2 px-1"
    >
      สรุปการโอน
    </h3>
    {#if $settlement.transfers.length === 0}
      {#if $transactions.some((t) => t.paidBy.length > 0 && t.paidFor.length > 0)}
        <div
          class="text-center text-stone-500 py-8 border border-dashed border-stone-200 rounded-xl bg-white shadow-sm px-4"
        >
          ยอดใช้งานหักล้างกันเป็นศูนย์ (ทุกคนจ่ายส่วนของตัวเองครบแล้ว) 🎉
        </div>
      {:else}
        <div
          class="text-center text-stone-400 italic py-8 border border-dashed border-stone-200 rounded-xl bg-white shadow-sm"
        >
          ยังไม่มีรายการแบ่งจ่ายหนี้ (ลากเพื่อนใส่รายการก่อน)
        </div>
      {/if}
    {:else}
      {#each $settlement.transfers as transfer}
        <div
          class="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl p-4 border border-stone-100 shadow-sm gap-4 hover:border-stone-300 transition-colors"
        >
          <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <!-- From User -->
            <div class="flex items-center gap-2 overflow-hidden shrink-0 min-w-[20px]">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-[10px] border shadow-sm shrink-0 leading-none pb-0.5 {getUser(transfer.from).color}">
                {getUser(transfer.from).name.substring(0, 2).trim()}
              </div>
              <!-- <span class="font-medium text-stone-800 truncate max-w-[60px] sm:max-w-[100px]">{getUser(transfer.from).name}</span> -->
            </div>

            <!-- Transfer Label -->
            <div class="flex flex-col items-center flex-shrink-0 px-2 min-w-[70px]">
              <span class="text-[18px] uppercase text-stone-600 tracking-tight">โอนให้</span>
            </div>

            <!-- To User -->
            <div class="flex items-center gap-2 overflow-hidden shrink-0 min-w-[100px]">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-[10px] border shadow-sm shrink-0 leading-none pb-0.5 {getUser(transfer.to).color}">
                {getUser(transfer.to).name.substring(0, 2).trim()}
              </div>
              <!-- <span class="font-medium text-stone-800 truncate max-w-[60px] sm:max-w-[100px]">{getUser(transfer.to).name}</span> -->
            </div>
          </div>
          <div
            class="font-semibold px-4 py-1.5 bg-green-pastel text-emerald-900 rounded-lg shrink-0 flex items-center gap-1 border border-emerald-100"
          >
            {transfer.amount.toFixed(2)}
            <span class="text-emerald-600/70 font-normal text-sm">บาท</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
