// Shared errors and types

class UnsupportedSyntaxError extends Error {
  constructor(message, node) {
    super(message);
    this.name = 'UnsupportedSyntaxError';
    this.node = node;
  }
}

class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}

module.exports = {
  UnsupportedSyntaxError,
  ParseError
};
