// عناصر LED
const usdtVal    = document.getElementById('usdtVal');
const pointsVal  = document.getElementById('pointsVal');

// زر Watch + شارته
const watchBtn   = document.getElementById('watchBtn');
const watchBadge = document.getElementById('watchBadge');

// باقي الأزرار
const taskBtn    = document.querySelector('.cartoon-btn');      // أول زر (Task)
const swapBtn    = document.querySelectorAll('.cartoon-btn')[1]; // ثاني زر (Swap)
const withdrawBtn= document.querySelectorAll('.cartoon-btn')[2]; // ثالث زر (Withdraw)
const copyBtn    = document.querySelectorAll('.cartoon-btn')[4]; // خامس زر (Copy)

// متغيّرات العمل
let counter = 15;
let cooldown = 0;
let points  = 0;

// مساعدة تنسيق الوقت
function fmtMMSS(s){const m=Math.floor(s/60);return `${m}:${(s%60).toString().padStart(2,'0')}`;}

// تحديث زر Watch
function updateWatchBtn(){
  if(cooldown > 0){
    watchBtn.disabled = true;
    watchBadge.textContent = fmtMMSS(cooldown);
  }else{
    watchBtn.disabled = false;
    watchBadge.textContent = counter;
  }
}

// منطق زر Watch
watchBtn.addEventListener('click',()=>{
  if(cooldown>0) return;
  if(counter<=0){
    cooldown=60*60;
    updateWatchBtn();
    const cd=setInterval(()=>{
      cooldown--;
      updateWatchBtn();
      if(cooldown<=0){clearInterval(cd);counter=15;updateWatchBtn();}
    },1000);
    return;
  }
  counter--;
  points+=1000;
  pointsVal.textContent=points.toLocaleString();
  usdtVal.textContent=(points/10000).toFixed(2);
  updateWatchBtn();
});

// تفاعل باقي الأزرار
taskBtn.addEventListener('click',()=>alert('Task button clicked!'));
swapBtn.addEventListener('click',()=>alert('Swap button clicked!'));
withdrawBtn.addEventListener('click',()=>alert('Withdraw button clicked!'));
copyBtn.addEventListener('click',()=>alert('Copy button clicked!'));

// تحديث الساعة
function updateTime(){
  const now=new Date();
  document.querySelector('.time').textContent=
    `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
}
updateTime(); setInterval(updateTime,1000);
