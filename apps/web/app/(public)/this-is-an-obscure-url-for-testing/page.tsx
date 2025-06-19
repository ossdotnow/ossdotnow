import EarlySubmissionDialog from '@/components/submissions/early-submission-dialog';

export default function Page() {
  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden md:h-[calc(100vh-80px)]">
      <div className="relative z-10 mx-auto flex w-full flex-col items-center justify-center gap-8 overflow-hidden text-center">
        <div className="z-10 flex w-full max-w-lg flex-col items-center gap-12">
          <h1 className="z-10 text-2xl font-medium tracking-[-0.04em]">
            Super Secret Early Submission Page
          </h1>
          <EarlySubmissionDialog />
        </div>
      </div>
    </div>
  );
}
