'use no memo'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMicrocopy } from '../form/useMicrocopy'
import { aiStore, resolveAchievementRequest, startAchievementRequest } from '../store/ai-store'
import type { AchievementScope } from '../store/ai-store'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import type { AiProviderId } from './consent-store'
import type { AchievementSectionKey } from './achievement-generator'

/**
 * C1b suggestion preview panel (unified flow, FR-401/AC-401-a/b, FR-408).
 *
 * One textarea takes the free-text achievement; one request returns 1–3
 * polished bullets. Candidates are appended as new rows only through the
 * parent's `onAppend` (one item per click) — never by this panel directly.
 *
 * Opted out of React Compiler memoization like the C1/C2 panels (Task 18
 * incident): async handlers read input state, and unit/jsdom tests cannot
 * catch a production-only stale closure — the e2e spec on the production
 * build is the regression gate for this file.
 */

export interface AchievementPanelProps {
  readonly section: AchievementSectionKey
  readonly sectionLabel: string
  readonly itemIndex: number
  /** Appends the approved suggestion as a new bullet row (FR-401 Apply). */
  readonly onAppend: (text: string) => void
  /** Escape closes the panel; the trigger owns focus restoration and state. */
  readonly onRequestClose: () => void
}

const GROQ_POLICY_URL = 'https://groq.com/privacy-policy'

function providerDisplayName(providerId: AiProviderId): string {
  return providerId === 'groq' ? 'Groq' : 'OpenAI-compatible'
}

export function AchievementPanel({
  section,
  sectionLabel,
  itemIndex,
  onAppend,
  onRequestClose,
}: AchievementPanelProps) {
  const pack = useMicrocopy()
  const achievementStatus = useStore(aiStore, (s) => s.achievementStatus)
  const achievementSuggestions = useStore(aiStore, (s) => s.achievementSuggestions)
  const achievementSource = useStore(aiStore, (s) => s.achievementSource)
  const achievementErrorCode = useStore(aiStore, (s) => s.achievementErrorCode)
  const [description, setDescription] = useState('')
  const [consentFor, setConsentFor] = useState<AiProviderId | null>(null)
  const [applied, setApplied] = useState<readonly number[]>([])
  // Event-time truth for async continuations: a production-memoized handler
  // may capture stale render state (Task 18 incident), but a ref read at
  // call time is always fresh. State above stays for rendering only.
  const descriptionRef = useRef('')
  const consentForRef = useRef<AiProviderId | null>(null)

  const trimmedDescription = description.trim()

  const generate = async (retryScope?: AchievementScope): Promise<void> => {
    const liveDescription = retryScope?.description ?? descriptionRef.current.trim()
    if (liveDescription === '') return
    const scope: AchievementScope = retryScope ?? {
      section,
      itemIndex,
      description: liveDescription,
    }
    startAchievementRequest(scope)
    // A new request supersedes previous candidates — applied marks reset
    // here in the event handler, never in an effect.
    setApplied([])
    // Lazy: the provider transport, prompts, and validation stay out of the
    // initial chunk (performance-budget.md §1 — the 200 KB advisory debt).
    const { requestAchievementBullets, selectAchievementProviderId } =
      await import('./achievement-generator')
    const outcome = await requestAchievementBullets({
      description: scope.description,
      section: scope.section,
      locale: 'id',
    })
    resolveAchievementRequest(outcome, scope)
    // Fail-closed consent: without a grant the orchestrator sent nothing and
    // fell back. Offer the dialog once; declining keeps the static fallback.
    if (outcome.errorCode === 'consent-declined') {
      const selected = selectAchievementProviderId()
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
    const { selectAchievementProviderId } = await import('./achievement-generator')
    if (selectAchievementProviderId() !== providerId) return
    await generate()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
    }
  }

  const applySuggestion = (index: number): void => {
    // Store-fresh read: the candidate text is taken at event time (Task 18 class).
    const current = aiStore.getState().achievementSuggestions[index]
    if (current === undefined || applied.includes(index)) return
    onAppend(current.text)
    setApplied((previous) => [...previous, index])
  }

  const visibleSuggestions = achievementSuggestions.filter((_, index) => !applied.includes(index))

  const note =
    achievementStatus === 'loading'
      ? pack.aiAchievement.loadingNote
      : achievementErrorCode === 'consent-declined'
        ? pack.aiAchievement.consentNote
        : achievementErrorCode === 'provider-unavailable'
          ? pack.aiAchievement.unconfiguredNote
          : achievementErrorCode === 'rate-limited'
            ? pack.aiAchievement.rateLimitedNote
            : achievementErrorCode === 'timeout'
              ? pack.aiAchievement.timeoutNote
              : achievementErrorCode !== null
                ? pack.aiAchievement.errorNote
                : achievementSource === 'static'
                  ? pack.aiAchievement.staticNote
                  : pack.aiAchievement.readyNote

  return (
    <div
      role="group"
      aria-label={`${pack.aiAchievement.panelTitle} ${sectionLabel}`}
      className="flex flex-col gap-2"
      data-slot="achievement-suggestions"
      onKeyDown={onKeyDown}
    >
      <p className="px-1 text-muted-foreground">{pack.aiAchievement.hint}</p>
      <div className="flex flex-col gap-2">
        <label htmlFor={`ai-achievement-${section}-${itemIndex}`} className="text-sm">
          {pack.aiAchievement.descriptionLabel}
        </label>
        <Textarea
          id={`ai-achievement-${section}-${itemIndex}`}
          placeholder={pack.aiAchievement.descriptionPlaceholder}
          value={description}
          onChange={(event) => {
            descriptionRef.current = event.target.value
            setDescription(event.target.value)
          }}
        />
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={trimmedDescription === '' || achievementStatus === 'loading'}
          onClick={() => void generate()}
        >
          {pack.aiAchievement.generateAction}
        </Button>
      </div>
      {trimmedDescription === '' && (
        <p className="px-1 text-muted-foreground">{pack.aiAchievement.emptyInputNote}</p>
      )}
      {achievementStatus !== 'idle' && (
        <p role="status" className="px-1 text-muted-foreground">
          {achievementStatus === 'loading' ? pack.aiAchievement.loadingNote : note}
        </p>
      )}
      {achievementStatus === 'ready' &&
        achievementSource === 'ai' &&
        visibleSuggestions.length > 0 && (
          <Alert>
            <AlertDescription>{pack.aiAchievement.aiGeneratedNote}</AlertDescription>
          </Alert>
        )}
      {achievementStatus === 'ready' && visibleSuggestions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {achievementSuggestions.map((suggestion, index) =>
            applied.includes(index) ? null : (
              <li key={index} className="flex flex-col gap-1 border p-2">
                <p className="text-sm font-medium">
                  {pack.aiAchievement.suggestionLabel} {index + 1}
                </p>
                <p className="text-sm">{suggestion.text}</p>
                {suggestion.rationale !== '' && (
                  <p className="px-0 text-muted-foreground">{suggestion.rationale}</p>
                )}
                {suggestion.warnings.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {suggestion.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`${pack.aiAchievement.applyAction} ${pack.aiAchievement.suggestionLabel} ${index + 1}`}
                    onClick={() => applySuggestion(index)}
                  >
                    {pack.aiAchievement.applyAction}
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
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
