const express = require('express');
const router = express.Router();
const { supabaseAdmin, isSupabaseEnabled, config: supabaseConfig } = require('../config/supabase');

// Returns a small, non-sensitive status about Supabase clients.
// DOES NOT expose keys or tokens — only booleans and a basic test result.
router.get('/supabase-status', async (req, res) => {
  try {
    const status = {
      isSupabaseEnabled: Boolean(isSupabaseEnabled()),
      hasAdminClient: Boolean(supabaseAdmin),
      hasServiceKeyInEnv: Boolean(supabaseConfig && supabaseConfig.serviceKey),
      // We'll try a harmless select using the admin client if available
      adminQueryOk: false,
      adminQueryError: null
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
        if (error) {
          status.adminQueryOk = false;
          status.adminQueryError = error.message || String(error);
        } else {
          status.adminQueryOk = true;
        }
      } catch (err) {
        status.adminQueryOk = false;
        status.adminQueryError = err.message || String(err);
      }
    }

    res.json({ message: 'Supabase status', data: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to determine supabase status', message: error.message });
  }
});

module.exports = router;
