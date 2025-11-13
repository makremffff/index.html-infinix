// index.js
(() => {
  const $ = id => document.getElementById(id);

  const mainUI      = $('mainUI');
  const refUI       = $('refUI');
  const refLinkEl   = $('refLink');
  const refCountEl  = $('refCount');
  const copyBtn     = $('copyBtn');
  const copyLinkBtn = $('copyLinkBtn');
  const watchBtn    = $('watchBtn');
  const watchBadge  = $('watchBadge');
  const pointsVal   = $('pointsVal');
  const usdtVal     = $('usdtVal');

  /* ---------- منطق الإحالة ---------- */
  function showRef() {
    mainUI.style.display = 'none';
    refUI.style.display  = 'flex';
    refLinkEl.textContent = refLink;
    refCountEl.textContent = refCount;
  }
  function showMain() {
    refUI.style.display  = 'none';
    mainUI.style.display = 'flex';
  }
  copyBtn.addEventListener('click', showRef);
  copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(refLink).then(() => {
      copyLinkBtn.textContent = '✓ Copied!';
      setTimeout(() => copyLinkBtn.textContent = 'Copy Link', 1500);
    });
  });

  /* ---------- زر المشاهدة ---------- */
  let counter = 15, cooldown = 0, points = 0;
  function fmtMMSS(s) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }
  function updateWatchBtn() {
    if (cooldown > 0) {
      watchBtn.disabled = true;
      watchBadge.textContent = fmtMMSS(cooldown);
    } else {
      watchBtn.disabled = false;
      watchBadge.textContent = counter;
    }
  }
  watchBtn.addEventListener('click', () => {
    if (cooldown > 0) return;
    if (counter <= 0) {
      cooldown = 60 * 60;
      updateWatchBtn();
      const iv = setInterval(() => {
        cooldown--;
        updateWatchBtn();
        if (cooldown <= 0) {
          clearInterval(iv);
          counter = 15;
          updateWatchBtn();
        }
      }, 1000);
      return;
    }
    counter--;
    points += 1000;
    pointsVal.textContent = points.toLocaleString();
    usdtVal.textContent = '0.00';
    updateWatchBtn();
  });

  /* ---------- الساعة ---------- */
  function updateTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    document.querySelector('.time').textContent = `${h}:${m}`;
  }
  updateTime();
  setInterval(updateTime, 1000);

  /* ---------- قراءة الإحالة ---------- */
  let ref = '';
  try {
    const initData = window.Telegram?.WebApp?.initDataUnsafe;
    if (initData?.start_param) ref = initData.start_param;
  } catch {}
  if (!ref) {
    const params = new URLSearchParams(location.search);
    ref = params.get('ref') || '';
  }
  console.log('Ref captured:', ref);
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = ref;
})();
