import SubmissionForm from '@/components/submissions/submission-form';
import { Suspense } from 'react';

export default function Page() {
  return (
    <div className="relative z-10 mx-auto mt-10 flex w-full flex-col items-center gap-8 overflow-hidden px-6 text-center">
      <div className="z-10 flex w-full max-w-lg flex-col items-center gap-12">
        <h1 className="z-10 text-2xl font-medium tracking-[-0.04em]">Early Submission Page</h1>
        <Suspense>
          <SubmissionForm earlySubmission={true} />
        </Suspense>
      </div>
    </div>
  );
}
