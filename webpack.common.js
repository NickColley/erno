const { DIST, DESCRIPTION, NAME } = require('./constants.js');

const path = require('path');

const CleanPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  plugins: [
    new CleanPlugin(DIST),
    new ExtractTextPlugin('style.[hash].css')
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          'postcss-loader'
        ]
      }
    ]
  },
  entry: {
    index: path.resolve(__dirname, 'src/index.js')
  },
  output: {
    filename: '[name].bundle.[hash].js',
    chunkFilename: '[name].chunk.bundle.[hash].js',
    path: DIST,
    publicPath: '/'
  }
};
