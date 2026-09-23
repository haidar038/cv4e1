'use no memo'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import type { PolishMode } from '../../ai'
import { useMicrocopy } from '../form/useMicrocopy'
import { aiStore, resolvePolishRequest, startPolishRequest } from '../store/ai-store'
import type { PolishScope } from '../store/ai-store'
import { documentStore } from '../store/document-store'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import type { AiProviderId } from './consent-store'
import type { BulletSectionKey } from './bullet-generator'

/**
 * Which text this panel polishes: the summary field or one bullet row.
 * The panel never holds the text in state — it reads the live value from
 * the DocumentStore at event time (Task 18 stale-closure class).
 */
export type PolishTarget =
  | {
      readonly kind: 'bullet'
      readonly section: BulletSectionKey
      readonly itemIndex: number
      /** 1-based bullet row position. */
      readonly position: number
    }
  | { readonly kind: 'summary' }

export interface PolishSuggestionsPanelProps {
  readonly target: PolishTarget
  /** Field/row display label (e.g. "Ringkasan" or "Poin pencapaian 2"). */
  readonly label: string
  /** Current text; the request is built from the value at click time. */
  readonly text: string
  /** Replaces the target text with the approved polish. */
  readonly onApply: (text: string) => void
  /** Escape closes the panel; the trigger owns focus restoration and state. */
  readonly onRequestClose: () => void
}

const GROQ_POLICY_URL = 'https://groq.com/privacy-policy'
const POLISH_MODES: readonly PolishMode[] = ['id', 'en', 'translate-en']

function providerDisplayName(providerId: AiProviderId): string {
  return providerId === 'groq' ? 'Groq' : 'OpenAI-compatible'
}

function targetKey(target: PolishTarget): string {
  return target.kind === 'summary'
    ? 'summary'
    : `${target.section}:${target.itemIndex}:${target.position}`
}

/**
 * Reads the target's live text from the DocumentStore at event time — never
 * from a captured render prop. Event-handler closures can observe
 * permanently stale render state in the production build (Task 18
 * incident); the store read is always fresh because editors commit every
 * keystroke.
 */
function readLiveText(target: PolishTarget): string {
  const document = documentStore.getState().document
  if (document === undefined || document === null) return ''
  if (target.kind === 'summary') return document.basics.summary ?? ''
  const items = document.sections[target.section]
  return items?.[target.itemIndex]?.highlights?.[target.position - 1] ?? ''
}

/**
 * C2 polish preview panel (Task 20, FR-401/AC-401-a/b, FR-408).
 *
 * Opted out of React Compiler memoization like the bullet panel (Task 19):
 * the async generate handler reads input state, and unit/jsdom tests
 * cannot catch a production-only stale closure — the e2e spec on the
 * production build is the regression gate for this file.
 *
 * Suggestion, not mutation: the panel only reads the target's current text
 * and renders the candidate plus its `changes` preview. `ResumeDocument`
 * changes exclusively through the parent's `onApply`, called only from the
 * Apply button. The orchestrator (`./polish-text`, lazy-loaded on first
 * request) never touches document state either. Static fallback carries
 * guidance only (its text is the input verbatim), so no Apply is offered.
 */
export function PolishSuggestionsPanel({
  target,
  label,
  text,
  onApply,
  onRequestClose,
}: PolishSuggestionsPanelProps) {
  const pack = useMicrocopy()
  const polishStatus = useStore(aiStore, (s) => s.polishStatus)
  const polishSuggestion = useStore(aiStore, (s) => s.polishSuggestion)
  const polishSource = useStore(aiStore, (s) => s.polishSource)
  const polishErrorCode = useStore(aiStore, (s) => s.polishErrorCode)
  const [mode, setMode] = useState<PolishMode>('id')
  const [consentFor, setConsentFor] = useState<AiProviderId | null>(null)
  // Event-time truth for async continuations: a production-memoized handler
  // may capture stale render state (Task 18 incident), but a ref read at
  // call time is always fresh. State above stays for rendering only.
  const modeRef = useRef<PolishMode>('id')
  const consentForRef = useRef<AiProviderId | null>(null)

  const key = targetKey(target)
  const trimmedText = text.trim()

  const modeLabel = (candidate: PolishMode): string =>
    candidate === 'id'
      ? pack.aiPolish.modeIdLabel
      : candidate === 'en'
        ? pack.aiPolish.modeEnLabel
        : pack.aiPolish.modeTranslateLabel

  const generate = async (): Promise<void> => {
    const liveText = readLiveText(target).trim()
    if (liveText === '') return
    const scope: PolishScope = { target: key, text: liveText }
    startPolishRequest(scope)
    // Lazy: the provider transport, prompts, and validation stay out of the
    // initial chunk (performance-budget.md §1 — the 200 KB advisory debt).
    const { requestPolishSuggestion, selectPolishProviderId } = await import('./polish-text')
    const outcome = await requestPolishSuggestion({ text: scope.text, mode: modeRef.current })
    resolvePolishRequest(outcome, scope)
    // Fail-closed consent: without a grant the orchestrator sent nothing and
    // fell back. Offer the dialog once; declining keeps the static fallback.
    if (outcome.errorCode === 'consent-declined') {
      const selected = selectPolishProviderId()
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
    const { selectPolishProviderId } = await import('./polish-text')
    if (selectPolishProviderId() !== providerId) return
    await generate()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
    }
  }

  const note =
    polishStatus === 'loading'
      ? pack.aiPolish.loadingNote
      : polishErrorCode === 'consent-declined'
        ? pack.aiPolish.consentNote
        : polishErrorCode === 'provider-unavailable'
          ? pack.aiPolish.unconfiguredNote
          : polishErrorCode !== null
            ? pack.aiPolish.errorNote
            : polishSource === 'static'
              ? pack.aiPolish.staticNote
              : pack.aiPolish.readyNote

  // Static fallback never rewrites (text is the input verbatim), so its
  // checklist is guidance to apply by hand — no Apply button. Only a live
  // model candidate mutates through Apply (FR-401).
  const canApply =
    polishStatus === 'ready' &&
    polishSource === 'ai' &&
    polishSuggestion !== null &&
    polishSuggestion.text !== ''

  return (
    <div
      role="group"
      aria-label={`${pack.aiPolish.panelTitle} ${label}`}
      className="flex flex-col gap-2"
      data-slot="polish-suggestions"
      onKeyDown={onKeyDown}
    >
      <p className="px-1 text-muted-foreground">{pack.aiPolish.hint}</p>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm">{pack.aiPolish.modeLabel}</legend>
        {POLISH_MODES.map((candidate) => (
          <label key={candidate} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`ai-polish-mode-${key}`}
              value={candidate}
              checked={mode === candidate}
              onChange={() => {
                modeRef.current = candidate
                setMode(candidate)
              }}
            />
            {modeLabel(candidate)}
          </label>
        ))}
      </fieldset>
      <div>
        <Button
          type="button"
          size="sm"
          disabled={trimmedText === '' || polishStatus === 'loading'}
          onClick={() => void generate()}
        >
          {pack.aiPolish.generateAction}
        </Button>
      </div>
      {trimmedText === '' && (
        <p className="px-1 text-muted-foreground">{pack.aiPolish.emptyInputNote}</p>
      )}
      {polishStatus !== 'idle' && (
        <p role="status" className="px-1 text-muted-foreground">
          {polishStatus === 'loading' ? pack.aiPolish.loadingNote : note}
        </p>
      )}
      {polishStatus === 'ready' && polishSuggestion !== null && (
        <div className="flex flex-col gap-1 border p-2">
          {polishSource === 'ai' && <p className="text-sm">{polishSuggestion.text}</p>}
          {polishSuggestion.changes.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {polishSuggestion.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          )}
          {polishSuggestion.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-muted-foreground">
              {polishSuggestion.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {canApply && (
            <div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`${pack.aiPolish.applyAction} ${label}`}
                onClick={() => {
                  // Store-fresh read: the candidate text is taken at event
                  // time, never from a captured render (Task 18 class).
                  const current = aiStore.getState().polishSuggestion
                  if (current === null || current.text === '') return
                  onApply(current.text)
                  onRequestClose()
                }}
              >
                {pack.aiPolish.applyAction}
              </Button>
            </div>
          )}
        </div>
      )}
      <ConsentDialog
        open={consentFor !== null}
        request={{
          providerName: consentFor === null ? '' : providerDisplayName(consentFor),
          dataFields: [pack.aiConsent.dataFieldsListPolish],
          ...(consentFor === 'groq' ? { policyUrl: GROQ_POLICY_URL } : {}),
        }}
        onGrant={() => void retryAfterGrant()}
        onDecline={() => setConsentFor(null)}
      />
    </div>
  )
}
