// Share tokens are 32 url-safe characters; anything else can't be one, so
// skip the database lookup.
export const isShareToken = (token: string) => /^[A-Za-z0-9_-]{32}$/.test(token)
