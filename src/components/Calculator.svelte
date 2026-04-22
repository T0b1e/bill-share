<script>
  let visible = false;
  let display = '0';
  let operator = null;
  let operand = null;
  let justEvaluated = false;

  function pressDigit(d) {
    if (justEvaluated) {
      display = String(d);
      justEvaluated = false;
    } else {
      display = display === '0' ? String(d) : display + d;
    }
  }

  function pressDot() {
    if (justEvaluated) { display = '0.'; justEvaluated = false; return; }
    if (!display.includes('.')) display += '.';
  }

  function pressOp(op) {
    operand = parseFloat(display);
    operator = op;
    justEvaluated = true;
  }

  function evaluate() {
    if (operator === null || operand === null) return;
    const current = parseFloat(display);
    let result;
    if (operator === '+') result = operand + current;
    else if (operator === '-') result = operand - current;
    else if (operator === '×') result = operand * current;
    else if (operator === '÷') result = current === 0 ? 'Error' : operand / current;
    display = result === 'Error' ? 'Error' : String(parseFloat(result.toFixed(10)));
    operator = null;
    operand = null;
    justEvaluated = true;
  }

  function clear() {
    display = '0';
    operator = null;
    operand = null;
    justEvaluated = false;
  }

  function backspace() {
    if (display.length > 1 && display !== 'Error') {
      display = display.slice(0, -1);
    } else {
      display = '0';
    }
  }

  const buttons = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.'],
  ];

  function handleButton(label) {
    if (label === 'C') clear();
    else if (label === '⌫') backspace();
    else if (label === '=') evaluate();
    else if (['+', '-', '×', '÷'].includes(label)) pressOp(label);
    else if (label === '.') pressDot();
    else pressDigit(label);
  }

  function isOp(label) {
    return ['+', '-', '×', '÷', '='].includes(label);
  }
</script>

<!-- Toggle button -->
<button
  on:click={() => visible = !visible}
  class="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white border border-stone-200 shadow-lg flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all active:scale-95"
  title="Calculator"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="8" y2="10"/>
    <line x1="12" y1="10" x2="12" y2="10"/>
    <line x1="16" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="14"/>
    <line x1="12" y1="14" x2="12" y2="14"/>
    <line x1="16" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="12" y2="18"/>
    <line x1="16" y1="18" x2="16" y2="18"/>
  </svg>
</button>

<!-- Calculator panel -->
{#if visible}
  <div class="fixed bottom-22 right-6 z-50 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden select-none">
    <!-- Display -->
    <div class="px-4 py-3 bg-stone-50 border-b border-stone-100 text-right">
      <div class="text-xs text-stone-400 h-4">{operator ? `${operand} ${operator}` : ''}</div>
      <div class="text-2xl font-mono font-semibold text-stone-800 truncate">{display}</div>
    </div>

    <!-- Buttons -->
    <div class="p-2 grid gap-1.5">
      {#each buttons as row}
        <div class="grid gap-1.5" style="grid-template-columns: repeat({row.length === 2 ? 4 : row.length}, 1fr)">
          {#each row as label}
            <button
              on:click={() => handleButton(label)}
              class="
                h-10 rounded-xl text-sm font-medium transition-all active:scale-95 cursor-pointer
                {label === '0' && row.length === 2 ? 'col-span-2' : ''}
                {label === 'C' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' :
                 label === '⌫' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200' :
                 label === '=' ? 'bg-stone-800 text-white hover:bg-stone-700 border border-stone-700' :
                 isOp(label) ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200' :
                 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'}
              "
            >
              {label}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/if}
