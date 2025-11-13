// index.js – نسخة نهائية مع نظام الإعلانات كل ساعة
(() => {
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

  // ✅ التحقق من أن المستخدم داخل تلغرام
  if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif">
        <h2>⚠️ التطبيق يعمل فقط من داخل تلغرام</h2>
        <p>يرجى فتح الرابط من داخل تطبيق تلغرام.</p>
      </div>
    `;
    throw new Error('Access denied: not running inside Telegram');
  }

  const u = window.Telegram.WebApp.initDataUnsafe.user;
  const userId = u.id;
  const userName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User';
  const userPic = u.photo_url || '';

  const BOT_USERNAME = 'Game_win_usdtBot'; // غيّره لاحقًا
  const refLink = `https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userId}`;

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
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      ref = window.Telegram.WebApp.initDataUnsafe.start_param;
    } else {
     
