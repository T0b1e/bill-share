<script>
  import { receiptSettings, transactions, settlement, taxes } from '../store.js';

  const sectionDefs = [
    { key: 'header', label: 'ส่วนหัว', sublabel: 'Header — ชื่อ, ที่อยู่, TIN, สาขา, โทร' },
    { key: 'transactionInfo', label: 'ข้อมูล Transaction', sublabel: 'เลขที่ใบเสร็จ, วันที่/เวลา, โต๊ะ, พนักงาน' },
    { key: 'lineItems', label: 'รายการสินค้า', sublabel: 'Line Items — ใช้รายการจากบิล' },
    { key: 'summary', label: 'ยอดรวม', sublabel: 'ก่อน VAT, SC, VAT, ยอดสุทธิ' },
    { key: 'payment', label: 'การชำระเงิน', sublabel: 'เงินสด / โอน / บัตร' },
  ];

  function toggleSection(key) {
    $receiptSettings.sections = { ...$receiptSettings.sections, [key]: !$receiptSettings.sections[key] };
  }

  $: now = new Date();
  $: dateDisplay = now.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  $: timeDisplay = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  $: cashChange = $receiptSettings.cashTendered
    ? parseFloat($receiptSettings.cashTendered || 0) - $settlement.grandTotal
    : null;

  const paymentMethods = [
    { value: 'cash', label: 'เงินสด' },
    { value: 'transfer', label: 'โอน / PromptPay' },
    { value: 'card', label: 'บัตร' },
  ];
</script>

<div class="flex flex-col xl:flex-row gap-6">
  <!-- Settings Panel -->
  <div class="flex flex-col gap-3 xl:w-80 shrink-0">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1">ส่วนที่แสดง</p>

    {#each sectionDefs as section}
      <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <!-- Row: label + toggle -->
        <div class="flex items-center justify-between px-4 py-3 gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-stone-800">{section.label}</p>
            <p class="text-xs text-stone-400 truncate">{section.sublabel}</p>
          </div>
          <button
            role="switch"
            aria-checked={$receiptSettings.sections[section.key]}
            on:click={() => toggleSection(section.key)}
            class="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer
              {$receiptSettings.sections[section.key] ? 'bg-stone-800' : 'bg-stone-300'}"
          >
            <span
              class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
                {$receiptSettings.sections[section.key] ? 'translate-x-4' : 'translate-x-0'}"
            />
          </button>
        </div>

        <!-- Expanded input fields -->
        {#if $receiptSettings.sections[section.key] && section.key !== 'lineItems' && section.key !== 'summary'}
          <div class="border-t border-stone-100 px-4 py-3 flex flex-col gap-2 bg-stone-50/60">
            {#if section.key === 'header'}
              <input bind:value={$receiptSettings.businessName} placeholder="ชื่อกิจการ / Business Name" class="rf-input" />
              <input bind:value={$receiptSettings.address} placeholder="ที่อยู่ / Address" class="rf-input" />
              <input bind:value={$receiptSettings.tin} placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)" maxlength="13" class="rf-input" />
              <input bind:value={$receiptSettings.branch} placeholder="สาขา (00000 = สำนักงานใหญ่)" class="rf-input" />
              <input bind:value={$receiptSettings.phone} placeholder="เบอร์โทรศัพท์" class="rf-input" />

            {:else if section.key === 'transactionInfo'}
              <input bind:value={$receiptSettings.receiptNumber} placeholder="เลขที่ใบเสร็จ / Receipt No." class="rf-input" />
              <input bind:value={$receiptSettings.tableNumber} placeholder="หมายเลขโต๊ะ / Table No." class="rf-input" />
              <input bind:value={$receiptSettings.staffId} placeholder="รหัสพนักงาน / Staff ID" class="rf-input" />

            {:else if section.key === 'payment'}
              <p class="text-[10px] text-stone-400 font-medium uppercase tracking-wide">วิธีชำระเงิน</p>
              <div class="flex gap-1.5">
                {#each paymentMethods as m}
                  <button
                    on:click={() => ($receiptSettings.paymentMethod = m.value)}
                    class="flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer
                      {$receiptSettings.paymentMethod === m.value
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}"
                  >{m.label}</button>
                {/each}
              </div>

              {#if $receiptSettings.paymentMethod === 'cash'}
                <input bind:value={$receiptSettings.cashTendered} type="number" min="0" placeholder="รับมา (บาท)" class="rf-input" />
              {:else if $receiptSettings.paymentMethod === 'transfer'}
                <input bind:value={$receiptSettings.transferRef} placeholder="เลขอ้างอิง / Ref No." class="rf-input" />
              {:else}
                <input bind:value={$receiptSettings.cardLastFour} placeholder="4 หลักท้ายบัตร" maxlength="4" class="rf-input" />
                <input bind:value={$receiptSettings.approvalCode} placeholder="Approval Code" class="rf-input" />
                <input bind:value={$receiptSettings.bankName} placeholder="ชื่อธนาคาร / Bank Name" class="rf-input" />
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Receipt Preview -->
  <div class="flex-1 flex justify-center">
    <div
      class="bg-white font-mono text-[11px] w-full max-w-xs shadow-lg border border-stone-200 px-6 py-8 flex flex-col leading-relaxed"
      style="box-shadow: 0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.06), 2px 0 0 0 #e7e5e4, -2px 0 0 0 #e7e5e4;"
    >
      <!-- Header -->
      {#if $receiptSettings.sections.header}
        <div class="text-center mb-3">
          {#if $receiptSettings.businessName}
            <p class="font-bold text-sm tracking-wide">{$receiptSettings.businessName}</p>
          {:else}
            <p class="font-bold text-sm tracking-wide text-stone-300">ชื่อกิจการ</p>
          {/if}
          {#if $receiptSettings.address}
            <p class="text-[10px] text-stone-600 whitespace-pre-line mt-0.5">{$receiptSettings.address}</p>
          {/if}
          {#if $receiptSettings.tin}
            <p class="text-[10px] mt-0.5">เลขผู้เสียภาษี: {$receiptSettings.tin}</p>
          {/if}
          {#if $receiptSettings.branch}
            <p class="text-[10px]">สาขา: {$receiptSettings.branch}</p>
          {/if}
          {#if $receiptSettings.phone}
            <p class="text-[10px]">โทร: {$receiptSettings.phone}</p>
          {/if}
        </div>
        <div class="border-t border-dashed border-stone-400 mb-3" />
      {/if}

      <!-- Transaction Info -->
      {#if $receiptSettings.sections.transactionInfo}
        <div class="mb-3 text-[10px] flex flex-col gap-0.5">
          {#if $receiptSettings.receiptNumber}
            <div class="flex justify-between"><span>เลขที่:</span><span>{$receiptSettings.receiptNumber}</span></div>
          {/if}
          <div class="flex justify-between"><span>วันที่:</span><span>{dateDisplay}</span></div>
          <div class="flex justify-between"><span>เวลา:</span><span>{timeDisplay}</span></div>
          {#if $receiptSettings.tableNumber}
            <div class="flex justify-between"><span>โต๊ะ:</span><span>{$receiptSettings.tableNumber}</span></div>
          {/if}
          {#if $receiptSettings.staffId}
            <div class="flex justify-between"><span>พนักงาน:</span><span>{$receiptSettings.staffId}</span></div>
          {/if}
        </div>
        <div class="border-t border-dashed border-stone-400 mb-3" />
      {/if}

      <!-- Line Items -->
      {#if $receiptSettings.sections.lineItems}
        <div class="mb-1">
          <div class="flex justify-between text-[9px] text-stone-400 border-b border-stone-200 pb-1 mb-1.5">
            <span>รายการ</span>
            <span>รวม (฿)</span>
          </div>
          {#each $transactions as item}
            {@const lineTotal = item.qty * item.price}
            <div class="mb-1.5">
              <div class="flex justify-between">
                <span class="truncate max-w-[140px]">{item.name}</span>
                <span class="shrink-0 ml-2">{lineTotal.toFixed(2)}</span>
              </div>
              {#if item.qty > 1}
                <div class="text-[9px] text-stone-400 pl-2">{item.qty} × {item.price.toFixed(2)}</div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="border-t border-dashed border-stone-400 mb-3 mt-1" />
      {/if}

      <!-- Summary -->
      {#if $receiptSettings.sections.summary}
        <div class="mb-3 text-[10px] flex flex-col gap-0.5">
          <div class="flex justify-between text-stone-600">
            <span>ยอดก่อนภาษี</span>
            <span>{$settlement.total.toFixed(2)}</span>
          </div>
          {#if $taxes.serviceCharge > 0}
            <div class="flex justify-between text-stone-600">
              <span>ค่าบริการ {$taxes.serviceCharge}%</span>
              <span>{$settlement.scAmount.toFixed(2)}</span>
            </div>
          {/if}
          {#if $taxes.vat > 0}
            <div class="flex justify-between text-stone-600">
              <span>VAT {$taxes.vat}%</span>
              <span>{$settlement.vatAmount.toFixed(2)}</span>
            </div>
          {/if}
          <div class="flex justify-between font-bold text-xs border-t border-stone-300 pt-1 mt-0.5">
            <span>ยอดสุทธิ</span>
            <span>{$settlement.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      {/if}

      <!-- Payment -->
      {#if $receiptSettings.sections.payment}
        <div class="border-t border-dashed border-stone-400 pt-3 text-[10px] flex flex-col gap-0.5">
          {#if $receiptSettings.paymentMethod === 'cash'}
            <div class="flex justify-between"><span>ชำระ:</span><span>เงินสด</span></div>
            {#if $receiptSettings.cashTendered}
              <div class="flex justify-between">
                <span>รับมา:</span>
                <span>{parseFloat($receiptSettings.cashTendered).toFixed(2)}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>ทอน:</span>
                <span>{cashChange !== null && cashChange >= 0 ? cashChange.toFixed(2) : '-'}</span>
              </div>
            {/if}
          {:else if $receiptSettings.paymentMethod === 'transfer'}
            <div class="flex justify-between"><span>ชำระ:</span><span>โอนเงิน / PromptPay</span></div>
            {#if $receiptSettings.transferRef}
              <div class="flex justify-between"><span>Ref No.:</span><span>{$receiptSettings.transferRef}</span></div>
            {/if}
          {:else}
            <div class="flex justify-between"><span>ชำระ:</span><span>บัตรเครดิต/เดบิต</span></div>
            {#if $receiptSettings.bankName}
              <div class="flex justify-between"><span>ธนาคาร:</span><span>{$receiptSettings.bankName}</span></div>
            {/if}
            {#if $receiptSettings.cardLastFour}
              <div class="flex justify-between"><span>บัตรเลขท้าย:</span><span>**** {$receiptSettings.cardLastFour}</span></div>
            {/if}
            {#if $receiptSettings.approvalCode}
              <div class="flex justify-between"><span>Approval:</span><span>{$receiptSettings.approvalCode}</span></div>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Receipt footer -->
      <div class="border-t border-dashed border-stone-300 mt-4 pt-3 text-center text-[9px] text-stone-400 tracking-wide">
        ขอบคุณที่ใช้บริการ
      </div>
    </div>
  </div>
</div>

<style>
  :global(.rf-input) {
    width: 100%;
    font-size: 0.75rem;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 0.5rem;
    padding: 0.375rem 0.75rem;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  :global(.rf-input::placeholder) {
    color: #c4bfbb;
  }
  :global(.rf-input:focus) {
    border-color: #a8a29e;
    box-shadow: 0 0 0 2px rgba(168,162,158,0.2);
  }
</style>
