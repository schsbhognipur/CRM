import NodeCache from 'node-cache';

// Standard TTL of 5 minutes, check for expiration every 1 minute
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default cache;
