import { permanentRedirect } from 'next/navigation'

// Old address of the Home rows' See all lists (/explore/all/{row}): now /explore/{row}.
export default function Page({ params }: { params: { locale: string; row: string } }) {
  permanentRedirect(`/${params.locale}/explore/${encodeURIComponent(params.row)}`)
}
