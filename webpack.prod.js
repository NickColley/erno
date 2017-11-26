const {
  NAME,
  DESCRIPTION,
  THEME_COLOR,
  DIST,
  HTML_WEBPACK_PLUGIN_OPTIONS,
  SERVICE_WORKER_FILENAME
} = require('./constants.js');

const path = require('path');
const webpack = require('webpack');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const HtmlInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const PWAManifestPlugin = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  entry: {
    registerServiceWorker: path.resolve(__dirname, 'src/registerServiceWorker.js')
  },
  plugins: [
    new UglifyJSPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new HtmlPlugin(Object.assign(HTML_WEBPACK_PLUGIN_OPTIONS, {
      inlineSource: 'registerServiceWorker|style'
    })),
    new HtmlInlineSourcePlugin(),
    new PWAManifestPlugin({
      name: `${NAME}: ${DESCRIPTION}`,
      short_name: NAME,
      description: DESCRIPTION,
      background_color: THEME_COLOR,
      theme_color: THEME_COLOR,
      icons: [
        {
          src: path.resolve(__dirname, 'src/icon.png'),
          sizes: [96, 128, 192, 256, 384, 512]
        }
      ]
    }),
    new WorkboxPlugin({
      globDirectory: DIST,
      globPatterns: ['**/*.{html,js,css,png}'],
      swDest: path.join(DIST, 'sw.js'),
      clientsClaim: true,
      skipWaiting: true,
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: { importLoaders: 1 }
            },
            'postcss-loader'
          ]
        })
      }
    ]
  }
})
