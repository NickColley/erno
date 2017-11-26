const path = require('path')
const packageJson = require('./package.json')

const constants = {
  NAME: packageJson.name,
  DESCRIPTION: packageJson.description,
  ENV: process.env.NODE_ENV || 'development',
  DIST: path.resolve(__dirname, 'public'),
  BLACK: "#0d0d0d"
}

constants.THEME_COLOR = constants.BLACK

constants.HTML_WEBPACK_PLUGIN_OPTIONS = {
  env: constants.ENV,
  title: `${constants.NAME}: ${constants.DESCRIPTION}`,
  name: constants.NAME,
  description: constants.DESCRIPTION,
  template: path.resolve(__dirname, 'src/index.html')
};

module.exports = constants