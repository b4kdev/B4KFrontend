import { permanentRedirect } from 'next/navigation'

// Old address of the Home rows' See all lists (/explore/all/{row}): now /explore/{row}.
export default async function Page(props: { params: Promise<{ locale: string; row: string }> }) {
  const params = await props.params;
  permanentRedirect(`/${params.locale}/explore/${encodeURIComponent(params.row)}`)
}
