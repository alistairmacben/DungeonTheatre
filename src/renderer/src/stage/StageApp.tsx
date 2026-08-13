import { assetUrl } from '@shared/assets'
import { StageView } from '@stage-ui/StageView'
import { useSnapshot } from '../shared/useSnapshot'
import { useDiceFeed } from '../shared/useDiceFeed'

/** The DM's stage window. Art comes off local disk over the asset:// scheme. */
export function StageApp(): React.JSX.Element {
  return <StageView snapshot={useSnapshot()} resolveAsset={assetUrl} roll={useDiceFeed()} />
}
