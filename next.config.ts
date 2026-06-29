import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // A stray lockfile in a parent directory makes Next infer the wrong workspace
  // root; pin it to this project so build traces (and Vercel) are correct.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
