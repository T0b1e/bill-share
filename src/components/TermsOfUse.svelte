<script>
  import { X } from 'lucide-svelte';
  export let open = false;
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1c1917]/40 backdrop-blur-sm px-4 py-4" on:click={() => open = false}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between p-6 border-b border-stone-100 shrink-0">
        <h2 class="text-lg font-semibold text-stone-800">ข้อกำหนดการใช้งาน</h2>
        <button on:click={() => open = false} class="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
          <X size={20} />
        </button>
      </div>

      <div class="overflow-y-auto p-6 text-sm text-stone-600 leading-relaxed flex flex-col gap-5">
        <p class="text-xs text-stone-400">อัปเดตล่าสุด: เมษายน 2569</p>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">วัตถุประสงค์ของแอป</h3>
          <p>หารเงินจ้าฟเป็นเครื่องมือช่วยคำนวณและแบ่งค่าใช้จ่ายระหว่างกลุ่มเพื่อน แอปนี้ให้บริการฟรีโดยไม่มีค่าใช้จ่าย</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">ความถูกต้องของการคำนวณ</h3>
          <p>แอปพยายามคำนวณให้ถูกต้องที่สุด อย่างไรก็ตาม ผู้ใช้ควรตรวจสอบผลลัพธ์ด้วยตนเองก่อนชำระเงินจริง ผู้พัฒนาไม่รับผิดชอบต่อความผิดพลาดที่เกิดจากการใช้งาน</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">ข้อมูลของผู้ใช้</h3>
          <p>ข้อมูลทั้งหมดจัดเก็บในอุปกรณ์ของคุณเอง ผู้พัฒนาไม่มีสิทธิ์เข้าถึงข้อมูลดังกล่าว และไม่รับผิดชอบต่อการสูญหายของข้อมูลอันเนื่องมาจากการล้างข้อมูลเบราว์เซอร์หรือการเปลี่ยนอุปกรณ์</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">การใช้งานที่ยอมรับได้</h3>
          <p>แอปนี้มีไว้สำหรับการใช้งานส่วนบุคคล ห้ามใช้เพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือสร้างความเสียหายแก่ผู้อื่น</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">การเปลี่ยนแปลงข้อกำหนด</h3>
          <p>ผู้พัฒนาสงวนสิทธิ์ในการแก้ไขข้อกำหนดนี้ได้ตลอดเวลา การใช้งานแอปต่อไปหลังจากมีการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดที่อัปเดต</p>
        </section>

        <section>
          <h3 class="font-semibold text-stone-800 mb-1">ติดต่อผู้พัฒนา</h3>
          <p>หากมีคำถามหรือข้อเสนอแนะ ติดต่อได้ที่ <a href="https://github.com/T0b1e" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-stone-700 hover:text-stone-900">github.com/T0b1e</a></p>
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
