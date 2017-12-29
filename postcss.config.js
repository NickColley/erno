const { BLACK } = require('./constants.js');

module.exports = {
  plugins: {
    'postcss-inject-css-variables': {
      'black': BLACK
    },
    'postcss-cssnext': {},
    'cssnano': { autoprefixer: false },
    'postcss-reporter': {
      clearAllMessages: true,
      filter: function (message) {
        const isUnitConverstion = message.text === 'Unit cannot be used for conversion, so 16px is used.';
        const isDiscardEmpty = message.plugin === 'postcss-discard-empty'
        return !isUnitConverstion && !isDiscardEmpty;
      }
    }
  }
}
