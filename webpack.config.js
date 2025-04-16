// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // Entry point: your main module
  entry: './scripts/main.js',

  // Output: the final bundled file and location
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  // Development mode: for unminified, debug-friendly output
  mode: 'development',

  // Generate source maps to debug original files in the browser
  devtool: 'source-map',

  // Rules: handling JavaScript and CSS files
  module: {
    rules: [
      {
        test: /\.js$/,          // Process all .js files
        exclude: /node_modules/,// Except those in node_modules
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'] // Use the Babel preset-env
          }
        }
      },
      {
        test: /\.css$/,         // Process all .css files
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  // Plugins
  plugins: [
    // Generates an index.html in dist and injects the bundle.js script automatically.
    new HtmlWebpackPlugin({
      template: './index.html' // Uses your existing index.html as a template.
    }),
    // Copies your media folder (from root) into the dist folder.
    new CopyWebpackPlugin({
      patterns: [
        { from: 'media', to: 'media' }
      ]
    })
  ],

  // Development server configuration: serves the content from dist on port 9000.
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true,
    historyApiFallback: true
  }
};
