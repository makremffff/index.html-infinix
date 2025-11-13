// index.js – الواجهة الأمامية (Front-End) – تعمل محليًا ومع الـ API الحقيقي
(() => {
  /* ---------- عناصر DOM ---------- */
  const userPhoto     = document.getElementById('userPhoto');
  const mainUI        = document.getElementById('mainUI');
  const refUI         = document.getElementById('refUI');
  const refLinkEl     = document.getElementById('refLink');
  const refCountEl    = document.getElementById('refCount');
  const copyBtn       = document.getElementById('copyBtn');
  const copyLinkBtn   = document.getElementById('copyLinkBtn');
  const watchBtn      = document.getElementById('watchBtn');
  const watchBadge    = document.getElementById('watchBadge');
  const pointsVal     = document.getElementById('pointsVal');
  const usdtVal       = document.getElementById('usdtVal');
  const timeEl        = document.querySelector('.time');

  /* ---------- إعدادات API ---------- */
  const API_BASE = window.location.origin + '/api'; // نفس النطاق عند النشر على Vercel

  /* ---------- بيانات المستخدم ---------- */
  let userId, userName, userPic;
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    const u = window.Telegram.WebApp.initDataUnsafe.user;
    userId   = u.id;
    userName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User';
    userPic  = u.photo_url || '';
  } else {
    // خارج Telegram
    userId   = localStorage.getItem('guestId') || 'g_' + Math.random().toString(36).slice(2);
    localStorage.setItem('guestId', userId);
    userName = 'Guest';
    userPic  = '';
  }

  /* ---------- رابط الإحالة ---------- */
  const BOT_USERNAME = 'Game_win_usdtBot'; // غيّره لاحقًا
  const refLink      = `https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userId}`;

  /* ---------- واجهة الإحالة ---------- */
  function showRef() {
    mainUI.style.display = 'none';
    refUI.style.display  = 'flex';
    refLinkEl.textContent = refLink;
    refCountEl.textContent = localStorage.getItem('refCount_' + userId) || '0';
  }
  function showMain() {
    refUI.style.display  = 'none';
    mainUI.style.display = 'flex';
  }
  copyBtn.addEventListener('click', showRef);
  document.querySelector('#refUI .cartoon-btn').addEventListener('click', showMain);

  copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(refLink).then(() => {
      copyLinkBtn.textContent = '✓ Copied!';
      setTimeout(() => copyLinkBtn.textContent = 'Copy Link', 1500);
    });
  });

  /* ---------- دوال API ---------- */
  async function apiCall(action, extra = {}) {
    const params = new URLSearchParams({ action, userID: userId, ...extra });
    const res = await fetch(`${API_BASE}?${params}`);
    const json = await res.json();
    return json;
  }

  async function loadProfile() {
    const { success, data } = await apiCall('getProfile');
    if (success) {
      pointsVal.textContent = data.points.toLocaleString();
      usdtVal.textContent   = data.usdt.toFixed(2);
      localStorage.setItem('refCount_' + userId, data.referrals);
    }
  }

  /* ---------- تسجيل المستخدم (مع معالجة الإحالة) ---------- */
  (async () => {
    let ref = null;
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      ref = window.Telegram.WebApp.initDataUnsafe.start_param;
    } else {
      const params = new URLSearchParams(location.search);
      ref = params.get('ref') || params.get('startapp');
    }
    await apiCall('registerUser', { ref });
    await loadProfile();
  })();

  /* ---------- زر Watch ---------- */
  let counter = 15, cooldown = 0;

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

  watchBtn.addEventListener('click', async () => {
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
    const { success, data } = await apiCall('watchAd');
    if (success) {
      pointsVal.textContent = data.points.toLocaleString();
      usdtVal.textContent   = data.usdt.toFixed(2);
    }
    updateWatchBtn();
  });

  /* ---------- الساعة ---------- */
  function updateTime() {
    const now = new Date();
    timeEl.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
  updateTime(); setInterval(updateTime, 1000);

  /* ---------- عرض صورة المستخدم ---------- */
  if (userPic) {
    userPhoto.src = userPic;
    userPhoto.style.display = 'block';
  }
})();
