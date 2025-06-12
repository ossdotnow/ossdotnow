import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();

  return <div>page {id}</div>;
}
