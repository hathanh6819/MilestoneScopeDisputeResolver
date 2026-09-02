import { createHash } from 'node:crypto';
import { createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';

const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) throw new Error('Invalid contract address');
const client = createClient({ chain: studionet });
const [schema, code, protocol, counts, accounting] = await Promise.all([
  client.getContractSchema(address), client.getContractCode(address),
  client.readContract({ address, functionName: 'get_protocol', args: [], jsonSafeReturn: true }),
  client.readContract({ address, functionName: 'get_counts', args: [], jsonSafeReturn: true }),
  client.readContract({ address, functionName: 'get_accounting', args: [], jsonSafeReturn: true }),
]);
const rawCode = typeof code === 'string' ? code : JSON.stringify(code);
const source = rawCode.startsWith('0x') ? Buffer.from(rawCode.slice(2), 'hex')
  : rawCode.startsWith('#') ? Buffer.from(rawCode, 'utf8') : Buffer.from(rawCode, 'base64');
const sha256 = createHash('sha256').update(source).digest('hex');
const methods = schema?.methods || {};
console.log(JSON.stringify({ address, sha256, sourceBytes: source.length, protocol, counts, accounting,
  codeEncoding: rawCode.startsWith('0x') ? 'hex' : rawCode.startsWith('#') ? 'source' : 'base64',
  rawCodeLength: rawCode.length, methodCount: Object.keys(methods).length,
  methodNames: Object.keys(methods).sort() }, null, 2));
