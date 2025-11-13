// api/index.js
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

    /* ---------- registerUser ---------- */
    if (action === "registerUser") {
      // 1) هل المستخدم موجود؟
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
        { headers: restHeaders() }
      );
      const exist = await checkRes.json();

      if (exist.length) {
        return res.status(200).json({ success: true, data: exist[0], message: "User already exists" });
      }

      // 2) إنشاء الحساب الجديد
      const body = { user_id: userID, points: 0, usdt: 0, referrals: 0 };
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
        method: "POST",
        headers: restHeaders(),
        body: JSON.stringify(body)
      });
      if (!insertRes.ok) throw new Error("Insert failed");

      // 3) مكافأة المُحيل (إن وُجد)
      if (ref && ref !== userID) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${ref}`,
          {
            method: "PATCH",
            headers: restHeaders(),
            body: JSON.stringify({
              points: 5000,
              usdt: 0.25,
              referrals: 1
            })
          }
        );
      }

      return res.status(201).json({ success: true, data: body, message: "User registered" });
    }

    /* ---------- getProfile ---------- */
    if (action === "getProfile") {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
        { headers: restHeaders() }
      );
      const data = await profileRes.json();
      if (!data.length) return res.status(404).json({ success: false, message: "User not found" });
      return res.status(200).json({ success: true, data: data[0] });
    }

    /* ---------- addPoints ---------- */
    if (action === "addPoints") {
      const { amount } = req.query; // amount=1000 (مثلاً)
      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
        {
          method: "PATCH",
          headers: restHeaders(),
          body: JSON.stringify({ points: amount })
        }
      );
      if (!patchRes.ok) throw new Error("Update failed");
      return res.status(200).json({ success: true, message: "Points added" });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
