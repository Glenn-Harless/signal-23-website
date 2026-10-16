const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const { listenHtmlPlugins, listenDevRewrites } = require('./scripts/listen-pages');
const { legalHtmlPlugins, legalDevRewrites } = require('./scripts/legal-pages');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    main: './src/index.tsx',
    // Lightweight standalone bundle for the static /listen/<slug> pages.
    listen: './src/listen.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: isProduction ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
    chunkFilename: isProduction ? 'assets/js/[name].[contenthash].chunk.js' : 'assets/js/[name].chunk.js',
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,  // Add TypeScript file handling
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'  // Add TypeScript preset
              ]
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        // Legal document markup imported as a string by the SPA fallback route.
        test: /\.content\.html$/,
        type: 'asset/source',
      },
      {
        test: /\.(mp3|wav)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      // Listen landing page analytics; empty string disables the Meta Pixel sink.
      'process.env.LISTEN_META_PIXEL_ID': JSON.stringify(process.env.LISTEN_META_PIXEL_ID || ''),
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ['main'],
    }),
    // One pre-rendered listen/<slug>/index.html per track in src/data/listenTracks.json.
    ...listenHtmlPlugins({
      template: './src/components/Listen/template.html',
      css: 'src/components/Listen/Listen.css',
    }),
    // Script-free legal pages (privacy policy) readable without JavaScript.
    ...legalHtmlPlugins({
      template: './src/components/Legal/template.html',
      css: 'src/components/Legal/Legal.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    port: 8080,
    host: '0.0.0.0',
    historyApiFallback: {
      // Serve the generated listen and legal pages at their pretty URLs; everything else falls back to the SPA.
      rewrites: [...listenDevRewrites(), ...legalDevRewrites()],
    },
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
