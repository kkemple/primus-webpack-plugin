# PrimusWebpackPlugin

### Build client side Primus script and add to build assets 📦⚡

## Introduction
[Primus](https://github.com/primus/primus) is a socket wrapper implementation that requires a built client library. The client library also needs to match the configuration of the server side implementation. Primus handles this by exposing `primus.library()` which returns the client library as a string.

This is problematic in applications that bundle and dynamically generate client assets. It is also problematic because unless you want to serve the client script directly from your websocket server (not a great approach IMO) you need to prebuild and package the client script anyway.

This plugin allows you to pass in your Primus options and then adds the client library to your Webpack build assets.

> If HtmlWebpackPlugin is being used it will also add the asset to the output HTML :tada:

## Usage

Install PrimusWebpackPlugin:

```shell
npm install --save-dev primus-webpack-plugin
```

With Yarn:

```shell
yarn add -D primus-webpack-plugin
```

In webpack.config.js:

```shell
const PrimusWebpackPlugin = require('primus-webpack-plugin')

...

new PrimusWebpackPlugin({
  filename: 'primus-client.[hash].js',
  minify: true,
  primusOptions: {
    transformer: 'uws',
    parser: {
      encoder: function (data, fn) {
        fn(null, JSON.stringify(data))
      },
      decoder: function (data, fn) {
        fn(null, JSON.parse(data))
      }
    }
  }
})
```

Options:

Name                | Description                               | Default
--------------------|-------------------------------------------|---------------
filename            | Name of generated file                    | `primus-client.js`
minify              | Whether or not to minify the file         | `false`
primusOptions       | Options for the Primus Server             | `{}`

> https://github.com/primus/primus#getting-started

## Caveats

`primus.library()` generates a UMDish style file but it doesn't seem to work being bundled with Webpack, instead a global `Primus` constructor is added. If you want to `require/import` Primus you will need to [shim](https://github.com/webpack/docs/wiki/shimming-modules#plugin-provideplugin) it in your Webpack config.
