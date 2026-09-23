'use no memo'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMicrocopy } from '../form/useMicrocopy'
import { aiStore, resolveBulletRequest, startBulletRequest } from '../store/ai-store'
import type { BulletScope } from '../store/ai-store'
import { documentStore } from '../store/document-store'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import type { AiProviderId } from './consent-store'
import { hasSessionCredentials } from './session-keys'
import type { BulletSectionKey } from './bullet-generator'

/**
 * C1 suggestion preview panel (Task 19, FR-401/AC-401-a/b, FR-408).
 *
 * Opted out of React Compiler memoization like AiSettings (Task 18
 * incident): the async generate handler below reads input state, and
 * unit/jsdom tests cannot catch a production-only stale closure — the e2e
 * spec on the production build is the regression gate for this file.
 *
 * Suggestion, not mutation: the panel only reads the row's current text and
 * renders candidates. `ResumeDocument` changes exclusively through the
 * parent's `onApply` (one item per click — AC-401-b), which the panel calls
 * only from an Apply button. The orchestrator (`./bullet-generator`,
 * lazy-loaded on first request) never touches document state either.
 */

export interface BulletSuggestionsPanelProps {
  readonly section: BulletSectionKey
  readonly sectionLabel: string
  /** Row display label (e.g. "Poin pencapaian 2") — keeps names unambiguous. */
  readonly rowLabel: string
  /** Current row text; the request is built from the value at click time. */
  readonly rawTask: string
  readonly itemIndex: number
  /** 1-based bullet row position. */
  readonly position: number
  /** Replaces this row's text with the approved suggestion. */
  readonly onApply: (text: string) => void
  /** Escape closes the panel; the trigger owns focus restoration and state. */
  readonly onRequestClose: () => void
}

const GROQ_POLICY_URL = 'https://groq.com/privacy-policy'

function providerDisplayName(providerId: AiProviderId): string {
  return providerId === 'groq' ? 'Groq' : 'OpenAI-compatible'
}

/**
 * Reads the row's live text from the DocumentStore at event time — never from
 * a captured render prop. Event-handler closures can observe permanently
 * stale render state in the production build (Task 18 incident); the store
 * read is always fresh because StringListEditor commits every keystroke.
 */
function readRowText(section: BulletSectionKey, itemIndex: number, position: number): string {
  const items = documentStore.getState().document?.sections[section]
  return items?.[itemIndex]?.highlights?.[position - 1] ?? ''
}

export function BulletSuggestionsPanel({
  section,
  sectionLabel,
  rowLabel,
  rawTask,
  itemIndex,
  position,
  onApply,
  onRequestClose,
}: BulletSuggestionsPanelProps) {
  const pack = useMicrocopy()
  const bulletStatus = useStore(aiStore, (s) => s.bulletStatus)
  const bulletSuggestions = useStore(aiStore, (s) => s.bulletSuggestions)
  const bulletSource = useStore(aiStore, (s) => s.bulletSource)
  const bulletErrorCode = useStore(aiStore, (s) => s.bulletErrorCode)
  const [targetRole, setTargetRole] = useState('')
  const [consentFor, setConsentFor] = useState<AiProviderId | null>(null)
  // Event-time truth for async continuations: a production-memoized handler
  // may capture stale render state (Task 18 incident), but a ref read at
  // call time is always fresh. State above stays for rendering only.
  const targetRoleRef = useRef('')
  const consentForRef = useRef<AiProviderId | null>(null)

  const trimmedRaw = rawTask.trim()
  // The static fallback has no model to steer, so the role field does
  // nothing without a stored key — FR-408 says so with a reason instead of
  // silently ignoring the input. Read at render (fresh every keystroke);
  // session-keys is already in the initial chunk via AiSettings.
  const roleFieldHonest =
    hasSessionCredentials('groq') || hasSessionCredentials('openai-compatible')

  const generate = async (retryScope?: BulletScope): Promise<void> => {
    const liveRaw = retryScope?.rawTask ?? readRowText(section, itemIndex, position).trim()
    if (liveRaw === '') return
    const scope: BulletScope = retryScope ?? { section, itemIndex, position, rawTask: liveRaw }
    startBulletRequest(scope)
    // Lazy: the provider transport, prompts, and validation stay out of the
    // initial chunk (performance-budget.md §1 — the 200 KB advisory debt).
    const { requestBulletSuggestions, selectBulletProviderId } = await import('./bullet-generator')
    const role = targetRoleRef.current.trim()
    const outcome = await requestBulletSuggestions({
      rawTask: scope.rawTask,
      section: scope.section,
      ...(role === '' ? {} : { targetRole: role }),
      locale: 'id',
    })
    resolveBulletRequest(outcome, scope)
    // Fail-closed consent: without a grant the orchestrator sent nothing and
    // fell back. Offer the dialog once; declining keeps the static fallback.
    if (outcome.errorCode === 'consent-declined') {
      const selected = selectBulletProviderId()
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
    const { selectBulletProviderId } = await import('./bullet-generator')
    if (selectBulletProviderId() !== providerId) return
    await generate()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
    }
  }

  const note =
    bulletStatus === 'loading'
      ? pack.aiBullets.loadingNote
      : bulletErrorCode === 'consent-declined'
        ? pack.aiBullets.consentNote
        : bulletErrorCode === 'provider-unavailable'
          ? pack.aiBullets.unconfiguredNote
          : bulletErrorCode === 'rate-limited'
            ? pack.aiBullets.rateLimitedNote
            : bulletErrorCode === 'timeout'
              ? pack.aiBullets.timeoutNote
              : bulletErrorCode !== null
                ? pack.aiBullets.errorNote
                : bulletSource === 'static'
                  ? pack.aiBullets.staticNote
                  : pack.aiBullets.readyNote

  return (
    <div
      role="group"
      aria-label={`${pack.aiBullets.panelTitle} ${sectionLabel} ${rowLabel}`}
      className="flex flex-col gap-2"
      data-slot="bullet-suggestions"
      onKeyDown={onKeyDown}
    >
      <p className="px-1 text-muted-foreground">{pack.aiBullets.hint}</p>
      <div className="flex flex-col gap-2">
        <label htmlFor={`ai-target-role-${section}-${itemIndex}-${position}`} className="text-sm">
          {pack.aiBullets.targetRoleLabel}
        </label>
        <Input
          id={`ai-target-role-${section}-${itemIndex}-${position}`}
          autoComplete="off"
          placeholder={pack.aiBullets.targetRolePlaceholder}
          value={targetRole}
          onChange={(event) => {
            targetRoleRef.current = event.target.value
            setTargetRole(event.target.value)
          }}
        />
        {!roleFieldHonest && pack.aiBullets.targetRoleOfflineNote !== '' && (
          <p className="px-1 text-muted-foreground">{pack.aiBullets.targetRoleOfflineNote}</p>
        )}
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={trimmedRaw === '' || bulletStatus === 'loading'}
          onClick={() => void generate()}
        >
          {pack.aiBullets.generateAction}
        </Button>
      </div>
      {trimmedRaw === '' && (
        <p className="px-1 text-muted-foreground">{pack.aiStatic.emptyInputNote}</p>
      )}
      {bulletStatus !== 'idle' && (
        <p role="status" className="px-1 text-muted-foreground">
          {bulletStatus === 'loading' ? pack.aiBullets.loadingNote : note}
        </p>
      )}
      {bulletStatus === 'ready' && bulletSuggestions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bulletSuggestions.map((suggestion, index) => (
            <li key={index} className="flex flex-col gap-1 border p-2">
              <p className="text-sm font-medium">
                {pack.aiBullets.suggestionLabel} {index + 1}
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
                  aria-label={`${pack.aiBullets.applyAction} ${pack.aiBullets.suggestionLabel} ${index + 1}`}
                  onClick={() => {
                    // Store-fresh read: the clicked position is stable, the
                    // candidate text is taken at event time (Task 18 class).
                    const current = aiStore.getState().bulletSuggestions[index]
                    if (current === undefined) return
                    onApply(current.text)
                    onRequestClose()
                  }}
                >
                  {pack.aiBullets.applyAction}
                </Button>
              </div>
            </li>
          ))}
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
