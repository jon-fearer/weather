module.exports = {
    plugins: ['jest'],
    extends: [
      'airbnb',
      'airbnb/hooks',
    ],
    rules: {
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'import/no-extraneous-dependencies': 'off'
    },
    env: {
      'jest/globals': true,
    }
};
