export const cols = (obj) => Object.keys(obj);
export const params = (obj) => Object.values(obj);
export const placeholders = (n, start = 1) => Array.from({ length: n }, (_, i) => `$${i + start}`).join(',');