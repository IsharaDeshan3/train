const apiKeyAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next(); // Bypass authentication entirely for automated tests
  }

  const apiKey = req.header('x-api-key');
  const validApiKey = process.env.SERVICE_API_KEY;

  if (process.env.NODE_ENV === 'development' && !validApiKey) {
    return next(); // Bypass in dev if not configured
  }

  if (!validApiKey) {
    console.warn("WARNING: SERVICE_API_KEY is not set. All API requests rejecting by default.");
    return res.status(500).json({ success: false, error: { message: "Server configuration error: Authentication not configured" } });
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized: Invalid API Key" } });
  }

  next();
};

module.exports = { apiKeyAuth };
