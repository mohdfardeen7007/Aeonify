module.exports = {
  apps: [{
    name: 'aeonify',
    script: 'src/start.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 9,
    env_file: '.env'
  }]
}; 