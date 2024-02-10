export const receiveBody = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export const httpError = (res, statusCode, message) => {
  res.statusCode = statusCode;
  res.end(`"${message}"`);
};
