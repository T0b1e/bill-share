<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let visible = false;

  onMount(() => {
    if (!localStorage.getItem('billshare_cookie_accepted')) {
      visible = true;
    }
  });

  function accept() {
    localStorage.setItem('billshare_cookie_accepted', '1');
    visible = false;
  }
</script>

{#if visible}
  <div class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg px-4 py-4 md:px-8">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <p class="text-sm text-stone-600 flex-1 leading-relaxed">
        แอปนี้จัดเก็บข้อมูลรายการและการตั้งค่าไว้ใน <span class="font-medium text-stone-800">localStorage</span> ของเบราว์เซอร์คุณเท่านั้น ไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์ใดๆ
        อ่านเพิ่มเติมใน
        <button on:click={() => dispatch('openPrivacy')} class="underline underline-offset-2 text-stone-700 hover:text-stone-900 transition-colors">นโยบายความเป็นส่วนตัว</button>
        และ
        <button on:click={() => dispatch('openTerms')} class="underline underline-offset-2 text-stone-700 hover:text-stone-900 transition-colors">ข้อกำหนดการใช้งาน</button>
      </p>
      <button
        on:click={accept}
        class="shrink-0 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer"
      >
        รับทราบ
      </button>
    </div>
  </div>
{/if}
