const BOT_USERNAME=process.env.BOT_USERNAME||'Game_win_usdtBot';
const NEXT_PUBLIC_SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const $=id=>document.getElementById(id);
const mainUI=$('mainUI'),refUI=$('refUI'),refLinkEl=$('refLink'),refCountEl=$('refCount'),
      copyBtn=$('copyBtn'),copyLinkBtn=$('copyLinkBtn'),watchBtn=$('watchBtn'),watchBadge=$('watchBadge'),
      pointsVal=$('pointsVal'),usdtVal=$('usdtVal');

let userId,points=0,usdt=0,referrals=0,counter=15,cooldown=0;

function fmtMMSS(s){const m=Math.floor(s/60);return`${m}:${(s%60).toString().padStart(2,'0')}`;}

async function api(action,p={}){
  const u=new URL(`${window.location.origin}/api`);
  u.searchParams.set('action',action);
  u.searchParams.set('userID',userId);
  Object.entries(p).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u,{headers:{'x-supabase-url':NEXT_PUBLIC_SUPABASE_URL,'x-supabase-anon':NEXT_PUBLIC_SUPABASE_ANON_KEY}});
  return r.json();
}

function render(){
  pointsVal.textContent=points.toLocaleString();
  usdtVal.textContent=usdt.toFixed(2);
  refCountEl.textContent=referrals;
}

function updateWatchBtn(){
  if(cooldown>0){watchBtn.disabled=true;watchBadge.textContent=fmtMMSS(cooldown);}
  else{watchBtn.disabled=false;watchBadge.textContent=counter;}
}

async function watchAd(){
  if(cooldown>0)return;
  if(counter<=0){
    cooldown=60*60;
    updateWatchBtn();
    const iv=setInterval(()=>{cooldown--;updateWatchBtn();if(cooldown<=0){clearInterval(iv);counter=15;updateWatchBtn();}},1000);
    return;
  }
  const res=await api('watchAd');
  if(res.success){points=res.data.points;counter--;render();updateWatchBtn();}
}

function showRef(){mainUI.style.display='none';refUI.style.display='flex';refLinkEl.textContent=`https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userId}`;}
function showMain(){refUI.style.display='none';mainUI.style.display='flex';}

copyBtn.addEventListener('click',showRef);
copyLinkBtn.addEventListener('click',()=>{navigator.clipboard.writeText(`https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userId}`).then(()=>{copyLinkBtn.textContent='✓ Copied!';setTimeout(()=>copyLinkBtn.textContent='Copy Link',1500);});});
watchBtn.addEventListener('click',watchAd);

(async()=>{
  window.Telegram.WebApp.ready();
  const initData=window.Telegram.WebApp.initDataUnsafe;
  if(initData&&initData.user){userId=initData.user.id;}else{
    userId=localStorage.getItem('guestId');
    if(!userId){userId='guest_'+Math.random().toString(36).slice(2);localStorage.setItem('guestId',userId);}
  }
  const urlParams=new URLSearchParams(window.location.search);
  const ref=initData?.start_param||urlParams.get('ref')||'';
  const reg=await api('registerUser',{ref});
  if(reg.success){const p=await api('getProfile');if(p.success){points=p.data.points;usdt=p.data.usdt;referrals=p.data.referrals;render();}}
  setInterval(()=>{const n=new Date();document.querySelector('.time').textContent=`${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`},1000);
})();
