import ProjectsPage from './projects-page';
import { Suspense } from 'react';

export default function Page() {
  return (
    <main className="px-6">
      <Suspense>
        <ProjectsPage />
      </Suspense>
    </main>
  );
}
