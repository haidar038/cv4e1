'use no memo'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMicrocopy } from '../form/useMicrocopy'
import { documentStore } from '../store/document-store'
import { aiStore, resolveTailoringRequest, startTailoringRequest } from '../store/ai-store'
import type { TailoringScope } from '../store/ai-store'
import type { SectionKey } from '../../core/view-models'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import type { AiProviderId } from './consent-store'

/**
 * T3b tailoring review panel (FR-601/602/603, FR-408).
 *
 * One textarea takes the pasted job ad; one request returns the keyword
 * gap analysis for the section. The result is read-only review — this
 * panel has no Apply path by design: a gap list never mutates the draft
 * (FR-602 holds structurally, not just by convention).
 *
 * Opted out of React Compiler memoization like the C1/C1b/C2 panels (Task
 * 18 incident): async handlers read input state, and unit/jsdom tests
 * cannot catch a production-only stale closure — the e2e spec on the
 * production build is the regression gate for this file.
 */

export interface TailoringPanelProps {
  readonly section: SectionKey
  readonly sectionLabel: string
  /** Escape closes the panel; the trigger owns focus restoration and state. */
  readonly onRequestClose: () => void
}

const GROQ_POLICY_URL = 'https://groq.com/privacy-policy'

function providerDisplayName(providerId: AiProviderId): string {
  return providerId === 'groq' ? 'Groq' : 'OpenAI-compatible'
}

export function TailoringPanel({ section, sectionLabel, onRequestClose }: TailoringPanelProps) {
  const pack = useMicrocopy()
  const tailoringStatus = useStore(aiStore, (s) => s.tailoringStatus)
  const tailoringResult = useStore(aiStore, (s) => s.tailoringResult)
  const tailoringSource = useStore(aiStore, (s) => s.tailoringSource)
  const tailoringErrorCode = useStore(aiStore, (s) => s.tailoringErrorCode)
  const [jobDescription, setJobDescription] = useState('')
  const [consentFor, setConsentFor] = useState<AiProviderId | null>(null)
  // Event-time truth for async continuations: a production-memoized handler
  // may capture stale render state (Task 18 incident), but a ref read at
  // call time is always fresh. State above stays for rendering only.
  const jdRef = useRef('')
  const consentForRef = useRef<AiProviderId | null>(null)

  const trimmedJd = jobDescription.trim()

  const generate = async (retryScope?: TailoringScope): Promise<void> => {
    const liveJd = retryScope?.jobDescription ?? jdRef.current.trim()
    if (liveJd === '') return
    // Store-fresh document read: the excerpt is built at event time, never
    // from a render-captured snapshot.
    const document = documentStore.getState().document
    if (document === null) return
    const scope: TailoringScope = retryScope ?? { section, jobDescription: liveJd }
    startTailoringRequest(scope)
    // Lazy: the orchestrator, prompts, and validation stay out of the
    // initial chunk (performance-budget.md §1 — the 200 KB advisory debt).
    const { requestTailoring, selectTailoringProviderId } = await import('./tailoring-generator')
    const outcome = await requestTailoring({
      jobDescription: scope.jobDescription,
      section: scope.section,
      locale: 'id',
      document,
    })
    resolveTailoringRequest(
      { result: outcome.result, source: outcome.source, errorCode: outcome.errorCode },
      scope,
    )
    // Fail-closed consent: without a grant the orchestrator sent nothing and
    // fell back. Offer the dialog once; declining keeps the static fallback.
    if (outcome.errorCode === 'consent-declined') {
      const selected = selectTailoringProviderId()
      if (selected !== null) {
        consentForRef.current = selected
        setConsentFor(selected)
      }
    }
  }

  const retryAfterGrant = async (): Promise<void> => {
    const providerId = consentForRef.current
    consentForRef.current = null
    setConsentFor(null)
    if (providerId === null) return
    consentStore.getState().grant(providerId)
    const { selectTailoringProviderId } = await import('./tailoring-generator')
    if (selectTailoringProviderId() !== providerId) return
    await generate()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
    }
  }

  const note =
    tailoringStatus === 'loading'
      ? pack.aiTailoring.loadingNote
      : tailoringErrorCode === 'consent-declined'
        ? pack.aiTailoring.consentNote
        : tailoringErrorCode === 'provider-unavailable'
          ? pack.aiTailoring.unconfiguredNote
          : tailoringErrorCode === 'rate-limited'
            ? pack.aiTailoring.rateLimitedNote
            : tailoringErrorCode === 'timeout'
              ? pack.aiTailoring.timeoutNote
              : tailoringErrorCode !== null
                ? pack.aiTailoring.errorNote
                : tailoringSource === 'static'
                  ? pack.aiTailoring.staticNote
                  : pack.aiTailoring.readyNote

  const hasContent =
    tailoringResult !== null &&
    (tailoringResult.matchedKeywords.length > 0 ||
      tailoringResult.unsupportedKeywords.length > 0 ||
      tailoringResult.sectionsToStrengthen.length > 0 ||
      tailoringResult.clarifyingQuestions.length > 0)

  return (
    <div
      role="group"
      aria-label={`${pack.aiTailoring.panelTitle} ${sectionLabel}`}
      className="flex flex-col gap-2"
      data-slot="tailoring-result"
      onKeyDown={onKeyDown}
    >
      <p className="px-1 text-muted-foreground">{pack.aiTailoring.hint}</p>
      <div className="flex flex-col gap-2">
        <label htmlFor={`ai-tailoring-${section}`} className="text-sm">
          {pack.aiTailoring.jdLabel}
        </label>
        <Textarea
          id={`ai-tailoring-${section}`}
          placeholder={pack.aiTailoring.jdPlaceholder}
          value={jobDescription}
          onChange={(event) => {
            jdRef.current = event.target.value
            setJobDescription(event.target.value)
          }}
        />
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={trimmedJd === '' || tailoringStatus === 'loading'}
          onClick={() => void generate()}
        >
          {pack.aiTailoring.generateAction}
        </Button>
      </div>
      {trimmedJd === '' && (
        <p className="px-1 text-muted-foreground">{pack.aiTailoring.emptyInputNote}</p>
      )}
      {tailoringStatus !== 'idle' && (
        <p role="status" className="px-1 text-muted-foreground">
          {tailoringStatus === 'loading' ? pack.aiTailoring.loadingNote : note}
        </p>
      )}
      {tailoringStatus === 'ready' && tailoringSource === 'ai' && hasContent && (
        <Alert>
          <AlertDescription>{pack.aiTailoring.aiGeneratedNote}</AlertDescription>
        </Alert>
      )}
      {tailoringStatus === 'ready' && !hasContent && (
        <p className="px-1 text-muted-foreground">{pack.aiTailoring.emptyInputNote}</p>
      )}
      {tailoringStatus === 'ready' && tailoringResult !== null && hasContent && (
        <div className="flex flex-col gap-2">
          {tailoringResult.matchedKeywords.length > 0 && (
            <section aria-label={pack.aiTailoring.matchedLabel}>
              <h4 className="text-sm font-medium">{pack.aiTailoring.matchedLabel}</h4>
              <ul className="list-disc pl-5 text-sm">
                {tailoringResult.matchedKeywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            </section>
          )}
          {tailoringResult.unsupportedKeywords.length > 0 && (
            <section aria-label={pack.aiTailoring.unsupportedLabel}>
              <h4 className="text-sm font-medium">{pack.aiTailoring.unsupportedLabel}</h4>
              <ul className="list-disc pl-5 text-sm">
                {tailoringResult.unsupportedKeywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            </section>
          )}
          {tailoringResult.sectionsToStrengthen.length > 0 && (
            <section aria-label={pack.aiTailoring.sectionsLabel}>
              <h4 className="text-sm font-medium">{pack.aiTailoring.sectionsLabel}</h4>
              <ul className="list-disc pl-5 text-sm">
                {tailoringResult.sectionsToStrengthen.map((key) => (
                  <li key={key}>{pack.sections[key]}</li>
                ))}
              </ul>
            </section>
          )}
          {tailoringResult.clarifyingQuestions.length > 0 && (
            <section aria-label={pack.aiTailoring.questionsLabel}>
              <h4 className="text-sm font-medium">{pack.aiTailoring.questionsLabel}</h4>
              <ul className="list-disc pl-5 text-sm">
                {tailoringResult.clarifyingQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>
          )}
          {tailoringResult.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-muted-foreground">
              {tailoringResult.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ConsentDialog
        open={consentFor !== null}
        request={{
          providerName: consentFor === null ? '' : providerDisplayName(consentFor),
          dataFields: [pack.aiConsent.dataFieldsList],
          ...(consentFor === 'groq' ? { policyUrl: GROQ_POLICY_URL } : {}),
        }}
        onGrant={() => void retryAfterGrant()}
        onDecline={() => setConsentFor(null)}
      />
    </div>
  )
}
