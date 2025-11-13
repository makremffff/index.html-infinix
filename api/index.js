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

    // ---------- registerUser ----------
    if (action === "registerUser") {
      // التحقق من وجود المستخدم
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/players?select=*&user_id=eq.${userID}`,
        { headers: restHeaders() }
      );
      const exist = await checkRes.json();

      if (exist.length) {
        return res.status(200).json({ success: true, message: "User already exists" });
      }

      // إضافة المستخدم الجديد
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
        method: "POST",
        headers: restHeaders(),
        body: JSON.stringify({
          user_id: userID,
          points: 0,
          usdt: 0,
          referrals: 0
        })
      });

      if (!insertRes.ok) throw new Error("Insert failed");

      // إذا وجد رابط إحالة → مكافأة صاحب الرابط
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

      return res.status(200).json({ success: true, message: "User registered" });
    }

    // ---------- getProfile ----------
    if (action === "getProfile") {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/players?select=*&user_id=eq.${userID}`,
        { headers: restHeaders() }
      );
      const data = await profileRes.json();

      if (!data.length) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const { points, usdt, referrals } = data[0];
      return res.status(200).json({
        success: true,
        data: { points, usdt, referrals }
      });
    }

    // ---------- action غير معروف ----------
    res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
