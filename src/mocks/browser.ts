import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Browser-side MSW worker. Started once on the client (see MswProvider). */
export const worker = setupWorker(...handlers);
