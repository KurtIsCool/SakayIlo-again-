import fs from 'fs';
import path from 'path';

// Override global fetch to mock dataLoader.js in node context
global.fetch = async (url) => {
  // Extract filename from URL like `/src/data/ROUTE...`
  const filename = decodeURIComponent(url.split('/').pop());
  const filePath = path.join(process.cwd(), 'public/data', filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return {
      ok: true,
      json: async () => JSON.parse(data)
    };
  } catch (e) {
    return { ok: false, status: 404 };
  }
};
