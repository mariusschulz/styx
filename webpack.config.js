const path = require("path");

module.exports = {
  entry: "./src/browser.ts",

  output: {
    path: path.resolve(__dirname, "dist/browser"),
    filename: "styx.js"
  },

  resolve: {
    extensions: [".js", ".ts"]
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, "src"),
        use: "ts-loader"
      }
    ]
  }
};
