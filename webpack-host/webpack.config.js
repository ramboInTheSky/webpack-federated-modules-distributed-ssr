const path = require("path");

const { ESBuildMinifyPlugin } = require("esbuild-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
// const FederatedStatsPlugin = require("webpack-federated-stats-plugin");
const nodeExternals = require("webpack-node-externals");
// const { StatsWriterPlugin } = require("webpack-stats-plugin");
const packageJsonDeps = require("./package.json").dependencies

/**
 * @type {webpack.Configuration}
 */
const clientConfig = {
  entry: { app: ["./src/index.jsx"] },
  output: {
    path: path.resolve("./public/build"),
  },
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: "esbuild-loader",
          options: {
            loader: "jsx",
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    // new StatsWriterPlugin({
    //   filename: "stats.json",
    //   stats: { all: true },
    // }),
    // new FederatedStatsPlugin({
    //   filename: "federation-stats.json",
    // }),
    new webpack.container.ModuleFederationPlugin({
      name: "webpackHost",
      filename: "remote-entry.js",
      remotes: {
        webpackRemote:
          "webpackRemote@http://localhost:3001/static/container.js",
      },
      shared: {
        ...packageJsonDeps,
        react: {
          singleton: true,
          eager: true,
          requiredVersion: packageJsonDeps.react,
        },
        "react-dom": {
          singleton: true,
          eager: true,
          requiredVersion: packageJsonDeps["react-dom"],
        },
      },
    }),
  ],
  optimization: {
    minimizer: [new ESBuildMinifyPlugin({})],
  },
};

/**
 * @type {webpack.Configuration}
 */
const serverConfig = {
  target: "node",
  entry: { app: "./src/components/app.jsx" },
  output: {
    path: path.resolve("./dist"),
    library: { type: "commonjs" },
  },
  externals: [nodeExternals()],
  externalsPresets: { node: true },
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: "esbuild-loader",
          options: {
            loader: "jsx",
          },
        },
      },
      {
        test: /\.css$/,
        use: {
          loader: "css-loader",
          options: {
            modules: {
              exportOnlyLocals: true,
            },
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: "webpackHost",
      filename: "remote-entry.js",
      library: { type: "commonjs" },
      remotes: {
        webpackRemote:
          "webpackRemote@http://localhost:3001/static/container.js",
      },
      shared: {
        ...packageJsonDeps,
        react: {
          singleton: true,
          eager: true,
          requiredVersion: packageJsonDeps.react,
        },
      },
    }),
  ],
  optimization: {
    minimize: false,
  },
};

module.exports = [clientConfig, serverConfig];
