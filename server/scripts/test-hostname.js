require('dotenv').config();
const dns = require('dns');

const host = process.env.SUPABASE_DB_HOST;
console.log('Testing hostname:', JSON.stringify(host));
console.log('Host length:', host ? host.length : 'undefined');
console.log('Host characters:', host ? Array.from(host).map(c => c.charCodeAt(0)) : 'undefined');

if (host) {
  dns.lookup(host, (err, address) => {
    if (err) {
      console.log('DNS lookup failed:', err.message);
    } else {
      console.log('DNS lookup successful:', address);
    }
  });
}