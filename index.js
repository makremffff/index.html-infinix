(async function(){
  const status   = document.getElementById("status");
  const profileEl= document.getElementById("profile");
  const refLinkEl= document.getElementById("refLink");
  const tasksBtn = document.getElementById("tasksBtn");
  const tasksPopup=document.getElementById("tasksPopup");
  const referralCountPopup=document.getElementById("referralCountPopup");
  const copyRefInsidePopup=document.getElementById("copyRefInsidePopup");

  const LS_KEY      = "tg_user_id";
  const BOT_USERNAME= "Game_win_usdtBot";

  function getBaseUrl(){return window.location.origin;}

  async function registerUser(userID, ref){
    const base = getBaseUrl();
    const url = `${base}/api/index?action=registerUser&userID=${encodeURIComponent(userID)}${ref?`&ref=${encodeURIComponent(ref)}`:""}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.success) status.innerHTML='<div class="loader"></div>';
  }

  async function getProfile(userID){
    const base=getBaseUrl();
    const url=`${base}/api/index?action=getProfile&userID=${encodeURIComponent(userID)}`;
    const res=await fetch(url);
    const data=await res.json();
    if(data.success&&data.data){
      const u=data.data;
      status.style.display='none';
      profileEl.innerHTML=`💰 Balance: ${u.usdt||0} USDT<br>⭐ Points: ${u.points||0}<br>👥 Referrals: ${u.referrals||0}`;

      tasksBtn.style.display="inline-block";
      tasksBtn.onclick=()=>{
        referralCountPopup.textContent=`Your referrals: ${u.referrals||0}`;
        tasksPopup.style.display="block";
      };
    }
  }

  function getTelegramUserID(){
    try{
      if(window.Telegram&&window.Telegram.WebApp){
        return window.Telegram.WebApp.initDataUnsafe?.user?.id;
      }
    }catch(e){}
    return null;
  }

  let ref=null;
  try{
    ref=window.Telegram?.WebApp?.initDataUnsafe?.start_param?.replace("ref_","")||null;
    if(!ref) ref=new URLSearchParams(window.location.search).get("ref");
  }catch(e){
    ref=new URLSearchParams(window.location.search).get("ref");
  }

  const userID=getTelegramUserID()||localStorage.getItem(LS_KEY);

  if(userID){
    localStorage.setItem(LS_KEY,userID);
    await registerUser(userID,ref);
    await getProfile(userID);

    const refLink=`https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userID}`;
    refLinkEl.textContent=refLink;

    copyRefInsidePopup.addEventListener("click",()=>{
      navigator.clipboard.writeText(refLink);
      alert("✅ Link copied!");
    });

  }else{
    status.innerHTML='<div class="loader"></div><p style="margin-top:10px;">⚠️ Open inside Telegram</p>';
  }
})();
