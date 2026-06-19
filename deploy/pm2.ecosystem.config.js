// ─────────────────────────────────────────────────────────────────────────────
// PM2 Ecosystem — Mastchieve IA Production (Linux Ubuntu)
// Usar: pm2 start deploy/pm2.ecosystem.config.js --env production
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    // ── NestJS API ─────────────────────────────────────────────────────────
    {
      name: 'mastchieve-api',
      cwd: '/var/www/mastchieve/apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4301,
      },
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/mastchieve/api-error.log',
      out_file:   '/var/log/mastchieve/api-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },

    // ── Next.js Web ─────────────────────────────────────────────────────────
    {
      name: 'mastchieve-web',
      cwd: '/var/www/mastchieve/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 4300',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4300,
      },
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/mastchieve/web-error.log',
      out_file:   '/var/log/mastchieve/web-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};
