// /api/index.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, userID, ref } = req.query;

  if (!action) return res.status(400).json({ success: false, message: "Missing action" });

  try {
    /* ---------- registerUser ---------- */
    if (action === "registerUser") {
      // check exists
      const check = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
        { headers: restHeaders() }
      ).then(r => r.json());

      if (check.length) {
        return res.json({ success: true, data: check[0], message: "User exists" });
      }

      // create
      const body = { user_id: userID, usdt: 0, points: 0, referrals: 0 };
      const created = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
        method: "POST",
        headers: restHeaders(),
        body: JSON.stringify(body)
      }).then(r => r.json());

      // reward referrer if provided
      if (ref && ref !== userID) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${ref}`,
          { headers: restHeaders() }
        )
          .then(r => r.json())
          .then(async rows => {
            if (rows.length) {
              const r = rows[0];
              await fetch(
                `${SUPABASE_URL}/rest/v1/players?user_id=eq.${ref}`,
                {
                  method: "PATCH",
                  headers: restHeaders(),
                  body: JSON.stringify({
                    referrals: r.referrals + 1,
                    points: r.points + 2500
                  })
                }
              );
            }
          });
      }

      return res.json({ success: true, data: created[0], message: "User registered" });
    }

    /* ---------- getProfile ---------- */
    if (action === "getProfile") {
      const rows = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
        { headers: restHeaders() }
      ).then(r => r.json());

      if (!rows.length)
        return res.status(404).json({ success: false, message: "User not found" });

      return res.json({ success: true, data: rows[0] });
    }

    /* ---------- watchAd ---------- */
    if (action === "watchAd") {
      const rows = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
        { headers: restHeaders() }
      ).then(r => r.json());

      if (!rows.length)
        return res.status(404).json({ success: false, message: "User not found" });

      const user = rows[0];
      const updated = await fetch(
        `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
        {
          method: "PATCH",
          headers: restHeaders(),
          body: JSON.stringify({ points: user.points + 1000 })
        }
      ).then(r => r.json());

      return res.json({ success: true, data: updated[0], message: "Ad watched" });
    }

    return res.status(400).json({ success: false, message: "Unknown action" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
