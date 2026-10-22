export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (typeof err.message === 'string' && err.message.startsWith('Upload JPG')) return res.status(400).json({ message: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Each product image must be 5 MB or smaller' });
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Upload up to five images using the images field' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'That id is not valid' });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already in use` });
  }

  if (
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 600 &&
    typeof err.message === 'string'
  ) {
    console.error(err);
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
};
