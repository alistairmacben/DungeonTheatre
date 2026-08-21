// A dev harness for the creation flow — no backend, no auth.
//
// The same reason #solo exists: a component that has never been rendered is a
// hypothesis, not a feature. This lets the wizard be clicked through and its
// live numbers checked without a signed-in Discord session, which the real
// flow requires and this harness cannot obtain.

import { loadContent } from '@engine'
import { CreateCharacter } from './ui/CreateCharacter'

export function CreatePreview(): React.JSX.Element {
  const content = loadContent()
  return (
    <div className="relative h-full w-full bg-ink">
      <CreateCharacter
        content={content}
        characterId="preview-character"
        campaignId="preview-campaign"
        suggestedName="Test Character"
        onSubmit={async (character) => {
          // eslint-disable-next-line no-console
          console.log('would submit:', character)
          return undefined
        }}
      />
    </div>
  )
}
