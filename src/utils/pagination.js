function buildQueryOptions(req) {
  const page = Math.max(parseInt(req.query.page || '1'), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '12'), 1), 100);
  const skip = (page - 1) * limit;
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    sort = {};
    req.query.sort.split(',').forEach((key) => {
      if (!key) return;
      sort[key.replace('-', '')] = key.startsWith('-') ? -1 : 1;
    });
  }
  return { page, limit, skip, sort };
}

module.exports = { buildQueryOptions };