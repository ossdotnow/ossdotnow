export default function ContributorsLoading() {
  return (
    <div className="mx-auto mt-6 max-w-[1080px] px-6 py-8">
      <div className="space-y-6 border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="flex items-center justify-center space-x-3">
          <h1 className="text-2xl font-normal text-white">Meet our contributors</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="animate-pulse border border-neutral-700 bg-neutral-800/20 p-3">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-neutral-700"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-neutral-700"></div>
                  <div className="h-2 w-12 bg-neutral-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
