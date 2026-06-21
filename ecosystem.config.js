module.exports = {
  apps: [
    {
      name: "real-capital",
      script: "node_modules/.bin/next",
      args: "start -p 4012",
      cwd: "/home/ubuntu/real-capital",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      restart_delay: 3000,
    },
  ],
};
