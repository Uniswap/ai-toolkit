const { NxWebpackPlugin } = require('@nx/webpack');
const { join } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/slack-oauth-backend'),
  },
  plugins: [
    new NxWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
  // Exclude node_modules from the bundle for Node.js apps
  externals: [nodeExternals()],
  externalsPresets: { node: true },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.app.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
  optimization: {
    minimize: false, // Will be overridden by production config
  },
  performance: {
    hints: false,
  },
};
