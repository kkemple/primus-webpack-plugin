const EventEmitter = require('events');
const assert = require('assert');
const Primus = require('primus');
const uglify = require('uglify-js');

class PrimusWebpackPlugin {
  constructor(options) {
    this.options = Object.assign(
      {},
      {
        filename: 'primus-client.js',
        minify: false,
        primusOptions: {},
      },
      options
    );
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, cb) => {
      const primus = new Primus(new EventEmitter(), this.options.primusOptions);

      if (this.options.primusOptions.plugins) {
        this.options.primusOptions.plugins.forEach(plugin => {
          assert(plugin.name, 'Plugin must have name!');
          assert(plugin.plugin, 'Plugin must have plugin!');

          primus.plugin(plugin.name, plugin.plugin);
        });
      }

      const clientLib = primus.library();
      const filename = this.options.filename.replace(
        '[hash]',
        compilation.hash
      );
      const source = this.options.minify
        ? uglify.minify(clientLib, { fromString: true })
        : { code: clientLib };

      compilation.assets[filename] = {
        source() {
          return source.code;
        },
        size() {
          return source.code.length;
        },
      };

      primus.destroy();
      cb(null);
    });

    // if HtmlWebpackPlugin is being utilized, add our script to file
    compiler.plugin('compilation', compilation => {
      compilation.plugin(
        'html-webpack-plugin-before-html-processing',
        (htmlPluginData, cb) => {
          const filename = this.options.filename.replace(
            '[hash]',
            compilation.hash
          );
          const scriptTag = `<script type="text/javascript" src="/${filename}"></script>`;

          if (
            !htmlPluginData.plugin.options.inject ||
            htmlPluginData.plugin.options.inject === 'head'
          ) {
            htmlPluginData.html = htmlPluginData.html.replace(
              '</head>',
              scriptTag + '</head>'
            );
          } else {
            htmlPluginData.html = htmlPluginData.html.replace(
              '</body>',
              scriptTag + '</body>'
            );
          }

          cb(null, htmlPluginData);
        }
      );
    });
  }
}

module.exports = PrimusWebpackPlugin;
