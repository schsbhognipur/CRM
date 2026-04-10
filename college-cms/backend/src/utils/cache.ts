import NodeCache from 'node-cache';

// TTL: 60 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default cache;
