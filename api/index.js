const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restHeaders() {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
}

module.exports = async function(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const { action, userID, ref } = req.query;
    if (action === "registerUser") {
      if (!userID) return res.status(400).json({ success: false, message: "Missing userID" });

      const checkUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
      const check = await fetch(checkUrl, { headers: restHeaders() });
      const exists = await check.json();
      if (Array.isArray(exists) && exists.length > 0) return res.json({ success: true, message: "User exists" });

      const insertUrl = `${SUPABASE_URL}/rest/v1/players?select=*`;
      const body = JSON.stringify([{ user_id: userID, referred_by: ref || null, points: 0, usdt: 0, referrals: 0 }]);
      const add = await fetch(insertUrl, { method: "POST", headers: restHeaders(), body });
      const data = await add.json().catch(()=>null);

      if (ref) {
        const rewardPts = 2500, rewardUsdt = 0.25;
        const getRef = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(ref)}&select=*`;
        const refRes = await fetch(getRef, { headers: restHeaders() });
        const refData = await refRes.json();
        if (Array.isArray(refData) && refData.length > 0) {
          const cur = refData[0];
          const updateUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(ref)}`;
          const body2 = JSON.stringify({ referrals: cur.referrals + 1, points: cur.points + rewardPts, usdt: (parseFloat(cur.usdt)||0) + rewardUsdt });
          await fetch(updateUrl, { method: "PATCH", headers: restHeaders(), body: body2 });
        }
      }
      return res.json({ success: true, message: "User registered", row: data });
    }

    if (action === "getProfile") {
      const url = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
      const r = await fetch(url, { headers: restHeaders() });
      const d = await r.json();
      return res.json({ success: true, data: d[0] || null });
    }

    res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
