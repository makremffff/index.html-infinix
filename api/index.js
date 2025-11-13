module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  const{SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY}=process.env;
  const{action,userID,ref}=req.query;
  if(!userID)return res.json({success:false,message:'userID required'});
  const hdr={apikey:NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`,'Content-Type':'application/json'};
  const url=(path,query='')=>`${SUPABASE_URL}/rest/v1${path}${query}`;
  const get=async(path,query='')=>fetch(url(path,query),{headers:hdr}).then(r=>r.json());
  const post=async(path,body)=>fetch(url(path),{method:'POST',headers:hdr,body:JSON.stringify(body)}).then(r=>r.json());
  const patch=async(path,body,query)=>fetch(url(path,query),{method:'PATCH',headers:hdr,body:JSON.stringify(body)}).then(r=>r.json());

  try{
    const rows=await get(`/players?user_id=eq.${userID}`);
    const user=rows[0];

    if(action==='registerUser'){
      if(!user){
        await post('/players',{user_id:userID,points:0,usdt:0,referrals:0});
        if(ref&&ref!==userID){
          const refRows=await get(`/players?user_id=eq.${ref}`);
          const refUser=refRows[0];
          if(refUser){
            await patch(`/players?user_id=eq.${ref}`,{points:refUser.points+2500,referrals:refUser.referrals+1});
          }
        }
      }
      return res.json({success:true,data:{},message:'registered'});
    }

    if(action==='getProfile'){
      if(!user)return res.json({success:false,message:'user not found'});
      return res.json({success:true,data:{points:user.points,usdt:user.usdt,referrals:user.referrals}});
    }

    if(action==='watchAd'){
      if(!user)return res.json({success:false,message:'user not found'});
      const np=user.points+1000;
      await patch(`/players?user_id=eq.${userID}`,{points:np});
      return res.json({success:true,data:{points:np,usdt:user.usdt,referrals:user.referrals}});
    }

    res.json({success:false,message:'invalid action'});
  }catch(e){
    res.json({success:false,message:e.message});
  }
};
