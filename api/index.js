// /api/index.js - نسخة فعلية تعمل مع Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restHeaders() {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, userID, ref } = req.query;

  if (!userID) {
    return res.status(400).json({ success: false, message: 'Missing userID' });
  }

  try {
    switch (action) {
      case 'registerUser': {
        // التحقق من وجود المستخدم
        const getRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
          { headers: restHeaders() }
        );
        const existing = await getRes.json();

        if (existing.length > 0) {
          return res.status(200).json({
            success: true,
            data: existing[0],
            message: 'User already registered'
          });
        }

        // إنشاء مستخدم جديد
        const newUser = {
          user_id: userID,
          points: 0,
          usdt: 0,
          referrals: 0,
          created_at: new Date().toISOString()
        };

        const insertRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players`,
          {
            method: 'POST',
            headers: restHeaders(),
            body: JSON.stringify(newUser)
          }
        );

        if (!insertRes.ok) throw new Error('Insert failed');

        // معالجة الإحالة
        if (ref && ref.startsWith('ref_')) {
          const referrerId = ref.replace('ref_', '');
          
          // الحصول على بيانات المُحيل
          const referrerRes = await fetch(
            `${SUPABASE_URL}/rest/v1/players?user_id=eq.${referrerId}&select=*`,
            { headers: restHeaders() }
          );
          const referrer = await referrerRes.json();

          if (referrer.length > 0) {
            // تحديث بيانات المُحيل
            await fetch(
              `${SUPABASE_URL}/rest/v1/players?user_id=eq.${referrerId}`,
              {
                method: 'PATCH',
                headers: restHeaders(),
                body: JSON.stringify({
                  referrals: referrer[0].referrals + 1,
                  points: referrer[0].points + 2500
                })
              }
            );
          }
        }

        return res.status(201).json({
          success: true,
          data: newUser,
          message: 'User registered successfully'
        });
      }

      case 'getProfile': {
        const getRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
          { headers: restHeaders() }
        );
        const user = await getRes.json();

        if (user.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: user[0],
          message: 'Profile retrieved'
        });
      }

      case 'watchAd': {
        // الحصول on بيانات المستخدم الحالية
        const getRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
          { headers: restHeaders() }
        );
        const user = await getRes.json();

        if (user.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // تحديث النقاط
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}`,
          {
            method: 'PATCH',
            headers: restHeaders(),
            body: JSON.stringify({
              points: user[0].points + 1000
            })
          }
        );

        if (!patchRes.ok) throw new Error('Update failed');

        // إرجاع البيانات المحدثة
        const updatedRes = await fetch(
          `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userID}&select=*`,
          { headers: restHeaders() }
        );
        const updated = await updatedRes.json();

        return res.status(200).json({
          success: true,
          data: updated[0],
          message: 'Ad watched, +1000 points'
        });
      }

      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown action'
        });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
};
