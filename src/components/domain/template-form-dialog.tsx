'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTemplate, useUpdateTemplate } from '@/lib/api/hooks';
import type { VMTemplate } from '@/lib/api/types';
import {
  templateFormSchema,
  toTemplateInput,
  type TemplateFormValues,
} from '@/lib/validation/template';
import { cn } from '@/lib/utils';

const EMPTY: TemplateFormValues = {
  name: '',
  baseImage: '',
  vcpu: 2,
  memoryGb: 8,
  diskGb: 50,
  toolsText: '',
};

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog is in edit mode. */
  template?: VMTemplate;
}) {
  const isEdit = Boolean(template);
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: EMPTY,
  });

  // Sync form values when opening or switching the target template.
  useEffect(() => {
    if (!open) return;
    if (template) {
      reset({
        name: template.name,
        baseImage: template.baseImage,
        vcpu: template.vcpu,
        memoryGb: template.memoryGb,
        diskGb: template.diskGb,
        toolsText: template.preinstalledTools.join(', '),
      });
    } else {
      reset(EMPTY);
    }
  }, [open, template, reset]);

  const onSubmit = handleSubmit((values) => {
    const input = toTemplateInput(templateFormSchema.parse(values));
    const onDone = () => onOpenChange(false);
    if (isEdit && template) {
      update.mutate({ id: template.id, input }, { onSuccess: onDone });
    } else {
      create.mutate(input, { onSuccess: onDone });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit template' : 'New template'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the base image, resources and preinstalled tools.'
              : 'Define a reusable VM profile developers can provision from.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            id="name"
            label="Name"
            error={errors.name?.message}
            {...register('name')}
            placeholder="Backend Service"
          />
          <Field
            id="baseImage"
            label="Base image"
            error={errors.baseImage?.message}
            {...register('baseImage')}
            placeholder="ubuntu-22.04"
            className="font-mono"
          />

          <div className="grid grid-cols-3 gap-3">
            <Field
              id="vcpu"
              label="vCPU"
              type="number"
              error={errors.vcpu?.message}
              {...register('vcpu')}
            />
            <Field
              id="memoryGb"
              label="Memory (GB)"
              type="number"
              error={errors.memoryGb?.message}
              {...register('memoryGb')}
            />
            <Field
              id="diskGb"
              label="Disk (GB)"
              type="number"
              error={errors.diskGb?.message}
              {...register('diskGb')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="toolsText">Preinstalled tools</Label>
            <Input
              id="toolsText"
              placeholder="node@20, pnpm, docker"
              {...register('toolsText')}
            />
            <p className="text-xs text-muted-foreground">
              Comma or newline separated.
            </p>
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {mutation.error.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              {isEdit ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const Field = ({
  id,
  label,
  error,
  className,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
} & React.ComponentProps<typeof Input>) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(className)}
      {...props}
    />
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
        {error}
      </p>
    )}
  </div>
);
