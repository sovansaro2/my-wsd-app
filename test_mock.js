const { config } = require('./dist/server.cjs');
console.log('Is Mock enabled?', !config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_SERVICE_ROLE_KEY.length < 20);
