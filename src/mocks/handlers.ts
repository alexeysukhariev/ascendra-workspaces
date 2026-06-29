import { delay, http, HttpResponse } from 'msw';
import {
  applyLifecycle,
  createTemplate,
  getFleetUtilization,
  getIdentity,
  getPolicy,
  getTemplates,
  getUsers,
  getUtilization,
  getVm,
  listVms,
  shouldInjectError,
  updateTemplate,
} from '@/lib/api/store';
import type { LifecycleAction, TemplateInput } from '@/lib/api/types';

/** Random artificial latency in the 300–800ms range. */
function latency(): Promise<void> {
  return delay(300 + Math.floor(Math.random() * 500));
}

function serverError(message = 'The mock server hiccupped. Please retry.') {
  return HttpResponse.json(
    { error: 'internal_error', message },
    { status: 500 },
  );
}

function notFound(message = 'Resource not found') {
  return HttpResponse.json({ error: 'not_found', message }, { status: 404 });
}

function badRequest(message: string) {
  return HttpResponse.json({ error: 'bad_request', message }, { status: 400 });
}

const ACTIONS: LifecycleAction[] = ['start', 'stop', 'restart'];

export const handlers = [
  // --- Identity / users / policy ---------------------------------------
  http.get('/api/identity', async () => {
    await latency();
    return HttpResponse.json(getIdentity());
  }),

  http.get('/api/users', async () => {
    await latency();
    if (shouldInjectError()) return serverError();
    return HttpResponse.json(getUsers());
  }),

  http.get('/api/policy', async () => {
    await latency();
    return HttpResponse.json(getPolicy());
  }),

  // --- VMs --------------------------------------------------------------
  http.get('/api/vms', async ({ request }) => {
    await latency();
    if (shouldInjectError()) return serverError();
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId') ?? undefined;
    return HttpResponse.json(listVms({ ownerId }));
  }),

  http.get('/api/vms/:id', async ({ params }) => {
    await latency();
    if (shouldInjectError()) return serverError();
    const vm = getVm(String(params.id));
    return vm ? HttpResponse.json(vm) : notFound('VM not found');
  }),

  http.get('/api/vms/:id/utilization', async ({ params }) => {
    await latency();
    if (shouldInjectError()) return serverError();
    const util = getUtilization(String(params.id));
    return util ? HttpResponse.json(util) : notFound('VM not found');
  }),

  http.post('/api/vms/:id/actions', async ({ params, request }) => {
    await latency();
    let body: { action?: string };
    try {
      body = (await request.json()) as { action?: string };
    } catch {
      return badRequest('Invalid JSON body');
    }
    const action = body.action as LifecycleAction | undefined;
    if (!action || !ACTIONS.includes(action)) {
      return badRequest(`"action" must be one of: ${ACTIONS.join(', ')}`);
    }
    const result = applyLifecycle(String(params.id), action);
    if (!result.ok) {
      // 409 conflict for an invalid transition, 404 if missing.
      const status = result.error === 'VM not found' ? 404 : 409;
      return HttpResponse.json(
        { error: 'conflict', message: result.error ?? 'Action failed' },
        { status },
      );
    }
    return HttpResponse.json(result.vm);
  }),

  // --- Fleet ------------------------------------------------------------
  http.get('/api/fleet/utilization', async () => {
    await latency();
    if (shouldInjectError()) return serverError();
    return HttpResponse.json(getFleetUtilization(new Date()));
  }),

  // --- Templates --------------------------------------------------------
  http.get('/api/templates', async () => {
    await latency();
    if (shouldInjectError()) return serverError();
    return HttpResponse.json(getTemplates());
  }),

  http.post('/api/templates', async ({ request }) => {
    await latency();
    const parsed = await parseTemplateBody(request);
    if ('error' in parsed) return badRequest(parsed.error);
    return HttpResponse.json(createTemplate(parsed.value), { status: 201 });
  }),

  http.put('/api/templates/:id', async ({ params, request }) => {
    await latency();
    const parsed = await parseTemplateBody(request);
    if ('error' in parsed) return badRequest(parsed.error);
    const updated = updateTemplate(String(params.id), parsed.value);
    return updated ? HttpResponse.json(updated) : notFound('Template not found');
  }),
];

/** Server-side validation mirror of the client form schema. */
async function parseTemplateBody(
  request: Request,
): Promise<{ value: TemplateInput } | { error: string }> {
  let body: Partial<TemplateInput>;
  try {
    body = (await request.json()) as Partial<TemplateInput>;
  } catch {
    return { error: 'Invalid JSON body' };
  }
  if (!body.name?.trim()) return { error: 'Name is required' };
  if (!body.baseImage?.trim()) return { error: 'Base image is required' };
  for (const field of ['vcpu', 'memoryGb', 'diskGb'] as const) {
    const v = body[field];
    if (typeof v !== 'number' || Number.isNaN(v) || v <= 0) {
      return { error: `${field} must be a positive number` };
    }
  }
  return {
    value: {
      name: body.name.trim(),
      baseImage: body.baseImage.trim(),
      vcpu: body.vcpu!,
      memoryGb: body.memoryGb!,
      diskGb: body.diskGb!,
      preinstalledTools: Array.isArray(body.preinstalledTools)
        ? body.preinstalledTools.filter((t) => typeof t === 'string' && t.trim())
        : [],
    },
  };
}
