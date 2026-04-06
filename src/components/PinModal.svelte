<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  // Returns true if a PIN credential is already stored
  function hasStoredPin() {
    return !!localStorage.getItem('billshare_pin_credential');
  }

  let mode = hasStoredPin() ? 'login' : 'setup'; // 'setup' | 'login'
  let pin = '';
  let confirmPin = '';
  let showPin = false;
  let showConfirmPin = false;
  let error = '';
  let loading = false;

  // --- Crypto helpers ---

  function randomSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr));
  }

  async function deriveHash(pin, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }

  async function saveCredential(pin) {
    const salt = randomSalt();
    const hash = await deriveHash(pin, salt);
    // Store as "salt.hash" — never the raw PIN
    localStorage.setItem('billshare_pin_credential', `${salt}.${hash}`);
  }

  async function verifyPin(inputPin) {
    const stored = localStorage.getItem('billshare_pin_credential');
    if (!stored) return false;
    const dotIdx = stored.indexOf('.');
    const salt = stored.slice(0, dotIdx);
    const storedHash = stored.slice(dotIdx + 1);
    const inputHash = await deriveHash(inputPin, salt);
    return inputHash === storedHash;
  }

  function startSession() {
    // Mark this browser session as authenticated
    sessionStorage.setItem('billshare_session', '1');
    dispatch('authenticated');
  }

  // --- Handlers ---

  async function handleSetup() {
    error = '';
    if (pin.length < 4) { error = 'PIN ต้องมีอย่างน้อย 4 ตัว'; return; }
    if (pin !== confirmPin) { error = 'PIN ไม่ตรงกัน กรุณากรอกใหม่'; return; }
    loading = true;
    await saveCredential(pin);
    loading = false;
    startSession();
  }

  async function handleLogin() {
    error = '';
    if (!pin) { error = 'กรุณากรอก PIN'; return; }
    loading = true;
    const ok = await verifyPin(pin);
    loading = false;
    if (ok) {
      startSession();
    } else {
      error = 'PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง';
      pin = '';
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      mode === 'setup' ? handleSetup() : handleLogin();
    }
  }
</script>

<div class="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden p-8 flex flex-col items-center gap-6">

    <!-- Icon -->
    <div class="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
      {#if mode === 'setup'}
        <ShieldCheck size={28} />
      {:else}
        <Lock size={28} />
      {/if}
    </div>

    <!-- Title -->
    <div class="text-center">
      <h2 class="text-lg font-semibold text-stone-800">
        {mode === 'setup' ? 'ตั้ง PIN ของคุณ' : 'ยืนยันตัวตน'}
      </h2>
      <p class="text-sm text-stone-500 mt-1">
        {mode === 'setup'
          ? 'ตั้ง PIN เพื่อป้องกันข้อมูล (อย่างน้อย 4 ตัว)'
          : 'กรอก PIN เพื่อเข้าใช้งาน'}
      </p>
    </div>

    <!-- PIN input -->
    <div class="w-full flex flex-col gap-3">
      <div class="relative">
        <input
          type={showPin ? 'text' : 'password'}
          inputmode="numeric"
          placeholder="PIN"
          bind:value={pin}
          on:keydown={handleKeydown}
          maxlength="12"
          class="w-full border border-stone-200 rounded-xl px-4 py-3 pr-12 text-stone-800 text-base tracking-widest outline-none focus:ring-2 focus:ring-stone-400 transition"
        />
        <button
          type="button"
          on:click={() => showPin = !showPin}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        >
          {#if showPin} <EyeOff size={18} /> {:else} <Eye size={18} /> {/if}
        </button>
      </div>

      {#if mode === 'setup'}
        <div class="relative">
          <input
            type={showConfirmPin ? 'text' : 'password'}
            inputmode="numeric"
            placeholder="ยืนยัน PIN"
            bind:value={confirmPin}
            on:keydown={handleKeydown}
            maxlength="12"
            class="w-full border border-stone-200 rounded-xl px-4 py-3 pr-12 text-stone-800 text-base tracking-widest outline-none focus:ring-2 focus:ring-stone-400 transition"
          />
          <button
            type="button"
            on:click={() => showConfirmPin = !showConfirmPin}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            {#if showConfirmPin} <EyeOff size={18} /> {:else} <Eye size={18} /> {/if}
          </button>
        </div>
      {/if}

      {#if error}
        <p class="text-sm text-rose-500 text-center">{error}</p>
      {/if}
    </div>

    <!-- Action button -->
    <button
      on:click={mode === 'setup' ? handleSetup : handleLogin}
      disabled={loading}
      class="w-full bg-stone-800 hover:bg-stone-900 disabled:opacity-60 text-white py-3 rounded-xl font-medium cursor-pointer transition active:scale-95 shadow-sm"
    >
      {#if loading}
        กำลังตรวจสอบ...
      {:else if mode === 'setup'}
        ตั้ง PIN
      {:else}
        เข้าใช้งาน
      {/if}
    </button>

  </div>
</div>
