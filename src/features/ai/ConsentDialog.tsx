import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMicrocopy } from '../form/useMicrocopy'

export interface ConsentRequest {
  readonly providerName: string
  readonly dataFields: readonly string[]
  readonly policyUrl?: string
}

interface ConsentDialogProps {
  readonly open: boolean
  readonly request: ConsentRequest
  readonly onGrant: () => void
  readonly onDecline: () => void
}

/**
 * Per-operation AI consent gate (Task 18, FR-402, AC-402-a).
 *
 * Controlled and reusable: Task 18 opens it from settings in review mode;
 * Task 19 opens it before the first send of an operation. Closing by any
 * path — decline button, Escape, backdrop, X — counts as declined: without
 * an explicit grant nothing may be sent. The caller owns the grant state.
 */
export function ConsentDialog({ open, request, onGrant, onDecline }: ConsentDialogProps) {
  const pack = useMicrocopy()
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDecline()
      }}
    >
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{pack.aiConsent.title}</DialogTitle>
          <DialogDescription>{pack.aiConsent.intro}</DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="font-medium">{pack.aiConsent.providerLabel}</dt>
            <dd>{request.providerName}</dd>
          </div>
          <div>
            <dt className="font-medium">{pack.aiConsent.dataLabel}</dt>
            <dd>
              <ul className="list-disc pl-5">
                {request.dataFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-medium">{pack.aiConsent.consequenceLabel}</dt>
            <dd>{pack.aiConsent.consequenceText}</dd>
          </div>
        </dl>
        {request.policyUrl !== undefined && (
          <a
            href={request.policyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
          >
            {pack.aiConsent.policyLabel}
          </a>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDecline}>
            {pack.aiConsent.declineAction}
          </Button>
          <Button type="button" onClick={onGrant}>
            {pack.aiConsent.grantAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
