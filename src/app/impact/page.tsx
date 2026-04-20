import { permanentRedirect } from 'next/navigation'

/** Impact content lives on `/about`; keep `/impact` for bookmarks with a permanent redirect. */
export default function ImpactPage() {
  permanentRedirect('/about')
}
