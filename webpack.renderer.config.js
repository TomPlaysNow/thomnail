const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  plugins: [new (require('./build/license-notices-plugin'))()],
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
