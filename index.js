// index.js
document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM
  const statusEl   = document.getElementById('status');
  const profileEl  = document.getElementById('profile');
  const copyBtn    = document.getElementById('copyRef');
  const refLinkEl  = document.getElementById('refLink');

  // محاكاة بيانات وهمية
  const userName = 'علي';
  const userId   = '123456789';
  const refUrl   = `https://t.me/MyBot?start=${userId}`;

  // تحديث الواجهة
  statusEl.textContent = '✅ متصل';
  profileEl.textContent = `المستخدم: ${userName} (ID: ${userId})`;
  refLinkEl.textContent = refUrl;
  copyBtn.style.display = 'inline-block';

  // منطق زر النسخ
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(refUrl).then(() => {
      copyBtn.textContent = '✅ تم النسخ!';
      setTimeout(() => copyBtn.textContent = '🔗 نسخ رابط الإحالة', 2000);
    });
  });
});
