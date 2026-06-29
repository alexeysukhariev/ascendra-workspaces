import { z } from 'zod';
import type { TemplateInput } from '@/lib/api/types';

/**
 * Client-side validation for the template form. Mirrors the server-side checks
 * in the MSW handler. Tools are entered as a comma/newline separated string and
 * normalised to an array on submit.
 */
export const templateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(40, 'Keep the name under 40 characters'),
  baseImage: z
    .string()
    .trim()
    .min(2, 'Base image is required')
    .regex(
      /^[a-z0-9][a-z0-9._:-]*$/i,
      'Use a slug-like image name, e.g. ubuntu-22.04',
    ),
  vcpu: z.coerce
    .number({ message: 'vCPU is required' })
    .int('Must be a whole number')
    .min(1, 'At least 1 vCPU')
    .max(64, 'At most 64 vCPU'),
  memoryGb: z.coerce
    .number({ message: 'Memory is required' })
    .int('Must be a whole number')
    .min(1, 'At least 1 GB')
    .max(512, 'At most 512 GB'),
  diskGb: z.coerce
    .number({ message: 'Disk is required' })
    .int('Must be a whole number')
    .min(10, 'At least 10 GB')
    .max(4000, 'At most 4000 GB'),
  toolsText: z.string().optional(),
});

export type TemplateFormValues = z.input<typeof templateFormSchema>;

/** Parse the free-text tools field into a clean string array. */
export function parseTools(text: string | undefined): string[] {
  if (!text) return [];
  return Array.from(
    new Set(
      text
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}

/** Map validated form values to the API payload. */
export function toTemplateInput(
  values: z.output<typeof templateFormSchema>,
): TemplateInput {
  return {
    name: values.name,
    baseImage: values.baseImage,
    vcpu: values.vcpu,
    memoryGb: values.memoryGb,
    diskGb: values.diskGb,
    preinstalledTools: parseTools(values.toolsText),
  };
}
