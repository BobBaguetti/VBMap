// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Entry point: your main module
  entry: './scripts/main.js', 
  
  // Output: the final bundle file and where to put it
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  // Development mode (for unminified, debug-friendly output)
  mode: 'development',

  // Generate source maps so you can debug original files in your browser
  devtool: 'source-map',

  // Rules: how Webpack handles certain file types
  module: {
    rules: [
      {
        test: /\.js$/,          // All .js files
        exclude: /node_modules/,// Except node_modules
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'] // Use our Babel preset
          }
        }
      },
      {
        test: /\.css$/,        // All .css files
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  // Plugins
  plugins: [
    // HtmlWebpackPlugin will generate an index.html in dist, 
    // automatically injecting your <script src="bundle.js"></script>
    new HtmlWebpackPlugin({
      template: './index.html' // Use your existing index.html as a template
    })
  ],

  // Development server: run locally on port 9000
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
