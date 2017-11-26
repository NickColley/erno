const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');

const HtmlPlugin = require('html-webpack-plugin');

const { DIST, HTML_WEBPACK_PLUGIN_OPTIONS } = require('./constants.js');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  plugins: [
    new HtmlPlugin(HTML_WEBPACK_PLUGIN_OPTIONS)
  ],
  module: {},
  devtool: 'inline-source-map',
  devServer: {
    contentBase: DIST
  }
})
