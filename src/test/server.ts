import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

/** Node-side MSW server for hook/integration tests. */
export const server = setupServer(...handlers);
