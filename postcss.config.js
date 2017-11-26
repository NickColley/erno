const { BLACK } = require('./constants.js');

module.exports = {
  plugins: {
    'postcss-inject-css-variables': {
      'black': BLACK
    },
    'postcss-cssnext': {},
    'cssnano': { autoprefixer: false }
  }
}