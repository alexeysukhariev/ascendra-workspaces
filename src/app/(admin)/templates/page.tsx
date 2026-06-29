'use client';

import { useState } from 'react';
import { Cpu, HardDrive, Layers, MemoryStick, Pencil, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { TemplateFormDialog } from '@/components/domain/template-form-dialog';
import { EmptyState, ErrorState } from '@/components/domain/states';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplates } from '@/lib/api/hooks';
import type { VMTemplate } from '@/lib/api/types';
import { computeHourlyCost } from '@/lib/utils/cost';
import { formatCurrency, formatGb } from '@/lib/utils/format';

export default function TemplatesPage() {
  const templates = useTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VMTemplate | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(template: VMTemplate) {
    setEditing(template);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Reusable VM profiles. Editing a template re-prices VMs provisioned from it."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New template
          </Button>
        }
      />

      {templates.isLoading && !templates.data ? (
        <TemplatesSkeleton />
      ) : templates.isError ? (
        <ErrorState
          message={templates.error.message}
          onRetry={() => templates.refetch()}
          isRetrying={templates.isFetching}
        />
      ) : !templates.data || templates.data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No templates yet"
          description="Create your first template to let developers provision workspaces."
          action={
            <Button onClick={openCreate}>
              <Plus /> New template
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.data.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="type-headline">{template.name}</CardTitle>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {template.baseImage}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(template)}
                  aria-label={`Edit ${template.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {template.description && (
                  <p className="type-footnote text-muted-foreground">
                    {template.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Cpu className="size-3.5" /> {template.vcpu} vCPU
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MemoryStick className="size-3.5" />{' '}
                    {formatGb(template.memoryGb)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="size-3.5" /> {formatGb(template.diskGb)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {template.preinstalledTools.length > 0 ? (
                    template.preinstalledTools.map((tool) => (
                      <Badge key={tool} variant="secondary">
                        {tool}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No preinstalled tools
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  <Separator className="mb-3" />
                  <p className="text-xs text-muted-foreground">
                    ~{formatCurrency(
                      computeHourlyCost({
                        vcpu: template.vcpu,
                        memoryGb: template.memoryGb,
                        diskGb: template.diskGb,
                      }),
                    )}
                    /hr while running
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
      />
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
