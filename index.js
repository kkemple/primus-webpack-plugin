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
        'html-webpack-plugin-before-html-generation',
        (htmlPluginData, cb) => {
          const filename = this.options.filename.replace(
            '[hash]',
            compilation.hash
          );
          const publicPath = compilation.outputOptions.publicPath || "";

          // We are putting Primus script before other JavaScript files
          // because we are expecting other bundles to use Primus
          htmlPluginData.assets.js.unshift(`${publicPath}${filename}`)

          cb(null, htmlPluginData);
        }
      );
    });
  }
}

module.exports = PrimusWebpackPlugin;
