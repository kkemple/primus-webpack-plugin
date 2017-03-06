const http = require('http')
const Primus = require('primus')
const uglify = require('uglify-js')

function PrimusWebpackPlugin (options) {
  this.options = Object.assign({}, {
    filename: 'primus-client.js',
    minify: false,
    primusOptions: {}
  }, options)
}

PrimusWebpackPlugin.prototype.apply = function (compiler) {
  var self = this

  compiler.plugin('emit', function (compilation, cb) {
    const primus = new Primus(http.createServer(), self.options.primusOptions)
    const clientLib = primus.library()
    const filename = self.options.filename.replace('[hash]', compilation.hash)
    const source = self.options.minify
      ? uglify.minify(clientLib, { fromString: true })
      : clientLib

    compilation.assets[filename] = {
      source: function() {
        return source.code
      },
      size: function() {
        return source.code.length
      }
    }

    cb(null)
  })

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, cb) {
      const filename = self.options.filename.replace('[hash]', compilation.hash)
      const scriptTag = `<script type="text/javascript" src="${filename}"></script>`

      if (!htmlPluginData.plugin.options.inject || htmlPluginData.plugin.options.inject === 'head') {
        htmlPluginData.html = htmlPluginData.html.replace('</head>', scriptTag + '</head>')
      } else {
        htmlPluginData.html = htmlPluginData.html.replace('</body>', scriptTag + '</body>')
      }

      cb(null, htmlPluginData)
    })
  })
}

module.exports = PrimusWebpackPlugin
