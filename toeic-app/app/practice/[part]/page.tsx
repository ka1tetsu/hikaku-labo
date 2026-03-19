import PracticeClient from '@/components/PracticeClient'

export function generateStaticParams() {
  return [5, 6, 7].map(id => ({ part: String(id) }))
}

export default function PracticePartPage({ params }: { params: { part: string } }) {
  return <PracticeClient partId={parseInt(params.part)} />
}
