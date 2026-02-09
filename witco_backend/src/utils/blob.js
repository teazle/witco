const { head, put } = require("@vercel/blob");

function isBlobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function blobPut(pathname, body, contentType) {
  if (!isBlobEnabled()) return null;
  return put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

async function blobHead(urlOrPathname) {
  if (!isBlobEnabled()) return null;
  return head(urlOrPathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

module.exports = {
  isBlobEnabled,
  blobPut,
  blobHead,
};

