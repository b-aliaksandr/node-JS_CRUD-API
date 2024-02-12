import { ServerResponse, IncomingMessage } from "http";

export const receiveBody = async (stream: any) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export const httpError = (res: ServerResponse<IncomingMessage> & { req: IncomingMessage; }, statusCode: number, message: string) => {
  res.statusCode = statusCode;
  res.end(`"${message}"`);
};
