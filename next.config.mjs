/** @type {import('next').NextConfig} */

const nextConfig = {
  // experimental: {
  //   serverActions: true,
  // },
  webpack(config, options) {
    config.module.rules.push({
      test: /\.(mp3)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]',
      },
      exclude: /node_modules/,
    });

    return config;
  },
};

export default nextConfig;
