// Shared helper: runs a filtered, sorted, paginated query.
// Returns { items, total, page, pages }.
export async function listing(Model, filter, req, { sort = '-createdAt', populate } = {}) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  let query = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

// Turns user text into a safe, case-insensitive regex for searching.
export const searchRegex = (text) =>
  new RegExp(String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
