const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
require('dotenv').config();
// const htmlPlugin = new HtmlWebPackPlugin({
//   template: './src/index.html',
//   filename: './index.html',
// });
module.exports = {
  entry: './src/index.js',
  output: {
    // NEW
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
    assetModuleFilename: 'images/[hash][ext][query]',
  }, // NEW Ends

  devtool: 'eval-source-map',
  mode: process.env.NODE_ENV,
  devServer: {
    // enable HMR on the devServer
    hot: true,
    // fallback to root for other urls
    historyApiFallback: true,

    static: {
      // match the output path
      publicPath: '/',
      directory: path.resolve(__dirname, 'dist'),
      // match the output 'publicPath'
    },

    /**
     * proxy is required in order to make api calls to
     * express server while using hot-reload webpack server
     * routes api fetch requests from localhost:8080/api/* (webpack dev server)
     * to localhost:3000/api/* (where our Express server is running)
     */
    proxy: {
      '/api': 'http://localhost:3333/',
    },
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, './index.html'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|eot|mp3)$/i,
        type: 'asset/resource',
        // use: 'file-loader?name=./images/[name].[ext]',
      },
    ],
  },
  resolve: {
    // Enable importing JS / JSX files without specifying their extension
    extensions: ['.js', '.jsx'],
  },
};
