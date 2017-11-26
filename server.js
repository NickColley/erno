const { ENV } = require('./constants.js');
const nunjucks = require('nunjucks');
const express = require('express');
const compression = require('compression')

const app = express();

const Scrambo = require('scrambo');
const threebythree = new Scrambo();

if (ENV !== 'production') {
  const webpack = require('webpack');
  
  const webpackDevMiddleware = require('webpack-dev-middleware');
    
  const config = require('./webpack.dev.js');
  const compiler = webpack(config);

  app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
  }));
}

// Force https
app.use(function(request, response, next) {
  if (!request.headers['x-forwarded-proto'].includes('https')) {
    return response.redirect(301, 'https://' + request.headers.host + '/');
  }
  
  next();
});

if (ENV === 'production') {
  app.use(compression());
}

app.get("/", function (request, response) {
  response.setHeader('Content-Type', 'text/html');
  response.render(__dirname + '/public/index.html', {
    scramble: threebythree.get()
  });
});

let staticOptions = {}

if (ENV === 'production') {
  staticOptions = {
    immutable: true,
    maxAge: 31536000,
    setHeaders: setCustomCacheControl
  }
  function setCustomCacheControl (response, path) {
    if (
      express.static.mime.lookup(path) === 'text/html' ||
      path.includes('sw.js')
    ) {
      response.setHeader('Cache-Control', 'public, max-age=0')
    }
  }
}

app.use(express.static('public', staticOptions));

nunjucks.configure(['public'], {
  noCache: ENV === 'development',
  autoescape: true,
  express: app
});

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});