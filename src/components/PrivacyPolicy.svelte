<script>
  import { X } from 'lucide-svelte';
  export let open = false;
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1c1917]/40 backdrop-blur-sm px-4 py-4" on:click={() => open = false}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between p-6 border-b border-stone-100 shrink-0">
        <h2 class="text-lg font-semibold text-stone-800">นโยบายความเป็นส่วนตัว</h2>
        <button on:click={() => open = false} class="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
          <X size={20} />
        </button>
      </div>

      <div class="overflow-y-auto p-6 text-sm text-stone-600 leading-relaxed flex flex-col gap-5">
        <p class="text-xs text-stone-400">อัปเดตล่าสุด: เมษายน 2569</p>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">ข้อมูลที่จัดเก็บ</h3>
          <p>แอปหารเงินจ้าฟจัดเก็บข้อมูลทั้งหมดไว้ใน <span class="font-medium text-stone-700">localStorage</span> ของเบราว์เซอร์คุณบนอุปกรณ์ของคุณเองเท่านั้น ข้อมูลที่จัดเก็บได้แก่</p>
          <ul class="list-disc list-inside mt-2 flex flex-col gap-1 text-stone-500">
            <li>รายชื่อเพื่อนและสีที่กำหนด</li>
            <li>รายการค่าใช้จ่ายและจำนวนเงิน</li>
            <li>การตั้งค่าภาษีและกองกลาง</li>
            <li>ค่ากำหนดธีม (สว่าง / มืด)</li>
            <li>สถานะการยอมรับนโยบายคุกกี้</li>
          </ul>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">ไม่มีการส่งข้อมูลออกนอกอุปกรณ์</h3>
          <p>แอปนี้ไม่มีเซิร์ฟเวอร์ ไม่มีฐานข้อมูล และไม่ส่งข้อมูลใดๆ ออกไปภายนอก ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของคุณเท่านั้น</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">คุกกี้และการติดตาม</h3>
          <p>แอปนี้ไม่ใช้คุกกี้จากบุคคลที่สาม ไม่มีการวิเคราะห์พฤติกรรม และไม่มีระบบติดตามผู้ใช้ใดๆ ทั้งสิ้น</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">การลบข้อมูล</h3>
          <p>คุณสามารถลบข้อมูลทั้งหมดได้ตลอดเวลาโดยล้างข้อมูลเว็บไซต์ของเบราว์เซอร์ หรือใช้ปุ่ม "เคลียร์ทุกรายการ" ในแอป</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">การเปลี่ยนแปลงนโยบาย</h3>
          <p>หากมีการเปลี่ยนแปลงนโยบายนี้ จะแสดงวันที่อัปเดตล่าสุดไว้ด้านบน</p>
        </section>
      </div>

      <div class="p-4 border-t border-stone-100 shrink-0">
        <button on:click={() => open = false} class="w-full bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer">
          ปิด
        </button>
      </div>
    </div>
  </div>
{/if}
