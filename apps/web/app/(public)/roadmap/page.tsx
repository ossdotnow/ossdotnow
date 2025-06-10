import Image from 'next/image';

const roadmap = [
  {
    title: 'Waitlist',
    description: 'a waitlist for early birds',
    status: 'done',
  },
  {
    title: 'Core Features',
    description: 'submitting, finding, claiming projects',
    status: 'in progress',
  },
  {
    title: 'Social Features',
    description: 'for users to connect with each other',
    status: 'not started',
  },
];

export default function RoadmapPage() {
  return (
    <div className="mt-16 flex h-[calc(100vh-(65px+64px))]">
      <div className="border-border relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-8 border border-b-0">
        <Image
          src="/roadmap-background.png"
          alt=""
          aria-hidden="true"
          width={960}
          height={860}
          className="pointer-events-none absolute top-0 z-0 h-full w-full object-cover object-center opacity-70 mix-blend-screen"
        />
        <div className="z-10 mt-0 flex flex-col items-start gap-12 sm:-mt-16">
          <div className="font-mono">
            <h1 className="mb-12 pl-5 font-sans text-3xl font-normal text-white">roadmap</h1>

            <ul className="flex flex-col gap-10 text-left">
              {roadmap.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <div
                    className={`mt-[11px] h-2 w-2 flex-shrink-0 rounded-full ${
                      item.status === 'done'
                        ? 'bg-green-500'
                        : item.status === 'in progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    }`}
                  ></div>
                  <div>
                    <h2 className="text-lg font-normal text-white">{item.title}</h2>
                    <p className="text-muted-foreground">{item.description}</p>
                    <p
                      className={`${
                        item.status === 'done'
                          ? 'text-green-500'
                          : item.status === 'in progress'
                            ? 'text-blue-500'
                            : 'text-muted-foreground/80'
                      }`}
                    >
                      {item.status}
                    </p>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <div
                  className={`mt-[11px] h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-blue-500`}
                ></div>
                <div>
                  <h2 className="text-muted-foreground text-lg font-normal">
                    more to be announced soon
                  </h2>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
