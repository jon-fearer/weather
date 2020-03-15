module.exports = {
    plugins: ['jest'],
    extends: [
      'airbnb',
      'airbnb/hooks',
    ],
    rules: {
      'no-underscore-dangle': 'off',
    },
    env: {
      'jest/globals': true,
    }
};
