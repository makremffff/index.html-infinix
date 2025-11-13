// index.js – الواجهة الأمامية – تعمل فقط داخل تلغرام
(() => {
  if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif">
        <h2>⚠️ التطبيق يعمل فقط من داخل تلغرام</h2>
        <p>يرجى فتح الرابط من داخل تطبيق تلغرام.</p>
      </div>
    `;
    throw new Error('Access denied: not running inside Telegram');
  }

  const userPhoto = document.getElementById('userPhoto');
  const mainUI = document.getElementById('mainUI');
  const refUI = document.getElementById('refUI');
  const refLinkEl = document.getElementById('refLink');
  const refCountEl = document.getElementById('refCount');
  const copyBtn = document.getElementById('copyBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const watchBtn = document.getElementById('watchBtn');
  const watchBadge = document.getElementById('watchBadge');
  const pointsVal = document.getElementById('pointsVal');
  const usdtVal = document.getElementById('usdtVal');
  const timeEl = document.querySelector('.time');

  const API_BASE = window.location.origin + '/api';

  const u = window.Telegram.WebApp.initDataUnsafe.user;
  const userId = u.id;
  const userName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User';
  const userPic = u.photo_url || '';

  const BOT_USERNAME = 'Game_win_usdtBot';
  const refLink = `https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userId}`;

  function showRef() {
    mainUI.style.display = 'none';
    refUI.style.display = 'flex';
    refLinkEl.textContent = refLink;
    refCountEl.textContent = localStorage.getItem('refCount_' + userId) || '0';
  }
  function showMain() {
    refUI.style.display = 'none';
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

  async function apiCall(action, extra = {}) {
    const params = new URLSearchParams({ action, userID: userId, ...extra });
    const res = await fetch(`${API_BASE}?${params}`);
    return await res.json();
  }

  async function loadProfile() {
    const { success, data } = await apiCall('getProfile');
    if (success) {
      pointsVal.textContent = data.points.toLocaleString();
      usdtVal.textContent = data.usdt.toFixed(2);
      localStorage.setItem('refCount_' + userId, data.referrals);
    }
  }

  (async () => {
    let ref = null;
    const params = new URLSearchParams(location.search);
    ref = params.get('startapp') || params.get('ref');
    await apiCall('registerUser', { ref });
    await loadProfile();
  })();

  let counter = 15, cooldown = 0;

  function fmtMMSS(s) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  async function updateWatchBtn() {
    const { success, data } = await apiCall('getAdStatus');
    if (success) {
      counter = 15 - data.watched;
      cooldown = data.cooldown;
      if (cooldown > 0) {
        watchBtn.disabled = true;
        watchBadge.textContent = fmtMMSS(cooldown);
      } else {
        watchBtn.disabled = false;
        watchBadge.textContent = counter;
      }
    }
  }

  watchBtn.addEventListener('click', async () => {
    if (cooldown > 0 || counter <= 0) return;
    const { success, data } = await apiCall('watchAd');
    if (success) {
      pointsVal.textContent = data.points.toLocaleString();
      usdtVal.textContent = data.usdt.toFixed(2);
      await updateWatchBtn();
    }
  });

  function updateTime() {
    const now = new Date();
    timeEl.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
  updateTime(); setInterval(updateTime, 1000);
  updateWatchBtn(); setInterval(updateWatchBtn, 30000);

  if (userPic) {
    userPhoto.src = userPic;
    userPhoto.style.display = 'block';
  }
})();
