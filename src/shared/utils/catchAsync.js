module.exports = (fn) => {
  return (req, res, next) => {
    // Garante que qualquer erro (síncrono ou assíncrono) vá para o next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};