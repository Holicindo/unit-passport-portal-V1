/**
 * PM2 Ecosystem Config — Holicindo Unit Passport Portal
 * Auto-restart backend & frontend saat crash atau reboot
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup   (jalankan perintah output-nya sebagai admin)
 */

module.exports = {
  apps: [
    {
      name: 'holicindo-backend',
      script: 'dist/main.js',
      cwd: 'D:\\Holicindo\\unit-passport-portal\\app\\backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: 'D:\\Holicindo\\unit-passport-portal\\logs\\backend-error.log',
      out_file:   'D:\\Holicindo\\unit-passport-portal\\logs\\backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'holicindo-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: 'D:\\Holicindo\\unit-passport-portal\\app\\frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      restart_delay: 5000,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'D:\\Holicindo\\unit-passport-portal\\logs\\frontend-error.log',
      out_file:   'D:\\Holicindo\\unit-passport-portal\\logs\\frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};

