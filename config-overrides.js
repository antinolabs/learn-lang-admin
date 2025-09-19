const { override, addWebpackModuleRule } = require('customize-cra');

module.exports = override(
  (config, env) => {
    // Override webpack dev server configuration
    if (env === 'development') {
      config.devServer = {
        ...config.devServer,
        // Increase timeout for dev server
        timeout: 600000,
        proxy: {
          '/api': {
            target: process.env.REACT_APP_API_BASE_URL,
            changeOrigin: true,
            timeout: 600000,
            proxyTimeout: 600000
          }
        }
      };
    }
    return config;
  }
);