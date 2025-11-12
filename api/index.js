const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

function restHeaders() {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
}

// ======= Register User =======
async function registerUser(userID, ref) {
  if (!userID) return { success: false, message: "Missing userID" };

  try {
    const checkUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
    const check = await fetch(checkUrl, { headers: restHeaders() });
    const exists = await check.json();

    if (Array.isArray(exists) && exists.length > 0)
      return { success: true, message: "User exists" };

    const insertUrl = `${SUPABASE_URL}/rest/v1/players?select=*`;
    const body = JSON.stringify([{
      user_id: userID,
      referred_by: ref || null,
      points: 0,
      usdt: 0,
      referrals: 0
    }]);
    const add = await fetch(insertUrl, { method: "POST", headers: restHeaders(), body });
    const data = await add.json().catch(() => null);

    // Ref reward
    if (ref) {
      const rewardPts = 5000, rewardUsdt = 0.25;
      const getRef = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(ref)}&select=*`;
      const refRes = await fetch(getRef, { headers: restHeaders() });
      const refData = await refRes.json();
      if (Array.isArray(refData) && refData.length > 0) {
        const cur = refData[0];
        const updateUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(ref)}`;
        const body2 = JSON.stringify({
          referrals: cur.referrals + 1,
          points: cur.points + rewardPts,
          usdt: (parseFloat(cur.usdt) || 0) + rewardUsdt
        });
        await fetch(updateUrl, { method: "PATCH", headers: restHeaders(), body: body2 });
      }
    }
    return { success: true, message: "User registered", row: data };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// ======= Get Profile =======
async function getProfile(userID) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
    const r = await fetch(url, { headers: restHeaders() });
    const d = await r.json();
    return { success: true, data: d[0] || null };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// ======= Swap Points =======
async function swapPoints(userID) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
    const r = await fetch(url, { headers: restHeaders() });
    const data = await r.json();
    if (!data?.length) return { success: false, message: "User not found" };

    const user = data[0];
    const rate = 10000; // 10k points = 1 USDT
    if (user.points < rate) return { success: false, message: "Not enough points" };

    const addUsdt = Math.floor(user.points / rate);
    const remainPts = user.points % rate;
    const newUsdt = (parseFloat(user.usdt) || 0) + addUsdt;
    const updateUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}`;
    const body = JSON.stringify({ points: remainPts, usdt: newUsdt });
    await fetch(updateUrl, { method: "PATCH", headers: restHeaders(), body });

    return { success: true, message: "Swapped successfully", points: remainPts, usdt: newUsdt };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// ======= Withdraw =======
async function withdraw(userID, amount) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=*`;
    const r = await fetch(url, { headers: restHeaders() });
    const data = await r.json();
    if (!data?.length) return { success: false, message: "User not found" };

    const user = data[0];
    const balance = parseFloat(user.usdt) || 0;
    if (amount > balance) return { success: false, message: "Insufficient balance" };

    const newBal = balance - amount;
    const updateUrl = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}`;
    const body = JSON.stringify({ usdt: newBal });
    await fetch(updateUrl, { method: "PATCH", headers: restHeaders(), body });
    return { success: true, message: "Withdraw success", usdt: newBal };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// ======= Open Task =======
async function openTask(userID) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/players?user_id=eq.${encodeURIComponent(userID)}&select=referrals,points,usdt`;
    const r = await fetch(url, { headers: restHeaders() });
    const d = await r.json();
    return { success: true, data: d[0] || null };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// ======= MAIN HANDLER =======
module.exports = async function(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const { action, userID, ref, amount } = req.query;
    switch (action) {
      case "registerUser": return res.json(await registerUser(userID, ref));
      case "getProfile": return res.json(await getProfile(userID));
      case "swap": return res.json(await swapPoints(userID));
      case "withdraw": return res.json(await withdraw(userID, parseFloat(amount || 0)));
      case "openTask": return res.json(await openTask(userID));
      default:
        return res.status(400).json({ success: false, message: "Invalid action" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
