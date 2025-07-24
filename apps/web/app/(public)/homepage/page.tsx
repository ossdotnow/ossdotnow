'use client';

import { Button } from '@workspace/ui/components/button';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

// Mock data for featured launches
const featuredLaunches = [
  {
    id: 1,
    name: 'Zeitworld',
    shortDescription: 'Ship websites faster.',
    longDescription: 'Ship better websites. Faster. Build and deploy with modern tools.',
    votes: '2.7K',
  },
  {
    id: 2,
    name: 'DevFlow',
    shortDescription: 'Code review tool.',
    longDescription: 'Streamline your code review process with AI-powered insights.',
    votes: '1.9K',
  },
  {
    id: 3,
    name: 'CloudSync',
    shortDescription: 'File synchronization.',
    longDescription: 'Seamless file synchronization across all your devices and platforms.',
    votes: '1.5K',
  },
  {
    id: 4,
    name: 'APIBuilder',
    shortDescription: 'Build APIs quickly.',
    longDescription: 'Build and deploy REST APIs quickly with visual interface and auto-docs.',
    votes: '1.2K',
  },
  {
    id: 5,
    name: 'DataViz',
    shortDescription: 'Data visualization.',
    longDescription: 'Create stunning data visualizations and interactive dashboards.',
    votes: '980',
  },
] as const;

export default function Homepage() {
  const [floatingTriangles, setFloatingTriangles] = useState<{ id: number; key: string }[]>([]);

  const handleVoteClick = (launchId: number) => {
    // Create multiple floating triangles
    const triangleCount = 1;
    const newTriangles = Array.from({ length: triangleCount }, (_, i) => ({
      id: launchId,
      key: `${launchId}-${Date.now()}-${i}`,
    }));

    setFloatingTriangles((prev) => [...prev, ...newTriangles]);

    // Remove triangles after animation completes
    setTimeout(() => {
      setFloatingTriangles((prev) =>
        prev.filter((triangle) => !newTriangles.some((newTri) => newTri.key === triangle.key)),
      );
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#101010] text-white">
      {/* Background image with color dodge blend mode */}
      <div
        className="absolute inset-0 -top-40 h-full w-full bg-center bg-no-repeat mix-blend-color-dodge"
        style={{
          backgroundImage: 'url(/sunshine1.png)',
          filter: 'blur(8px)',
          backgroundSize: 'contain',
        }}
      />
      {/* Hero Section */}
      <div className="mx-4 flex flex-col items-center justify-center pt-16 pb-10 text-center sm:mx-6">
        <div className="mx-auto max-w-[1080px]">
          <h1 className="mb-2 text-3xl font-medium tracking-[-0.03em] sm:mb-4 sm:text-5xl md:text-6xl">
            Open source it, right now.
          </h1>
          <p className="mx-auto mb-8 max-w-[320px] text-sm text-[#9f9f9f] sm:mb-12 sm:max-w-[480px] sm:text-base md:max-w-[640px] md:text-lg lg:max-w-[800px]">
            Discover open source projects that align with your{' '}
            <span className="sm:inline">skills—and actually need your help.</span>
          </p>

          <div className="flex justify-center">
            <Button
              className="max-w-fit rounded-none border border-[#404040] bg-transparent px-4 py-3 text-sm text-cyan-400 hover:border-neutral-400 hover:bg-neutral-900 sm:text-base md:px-7 md:py-6"
              asChild
            >
              <Link
                href="/submit"
                className="flex items-center justify-center gap-1"
                event="submit_project_click"
              >
                Start contributing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="mx-6 pb-8 sm:pb-12 lg:pb-16">
        <div className="mx-auto max-w-[1080px]">
          {/* Outer border container */}
          <div className="border border-[#404040] p-1 sm:p-2">
            {/* Inner border container */}
            <div className="border border-[#404040] bg-[#000000] p-4 sm:p-6 lg:p-8">
              <h2 className="mb-6 text-xl font-normal sm:mb-8 sm:text-2xl lg:text-3xl">
                Top products launching today
              </h2>

              <div className="mb-6 flex items-center gap-2 bg-gradient-to-r from-[#854e0e50] to-[#17171743] px-2 py-1 sm:mb-8">
                <div className="flex items-center gap-2 text-[#CA8A04]">
                  <Icons.star className="h-4 w-4 fill-current" />
                  <span className="text-xs font-medium sm:text-sm">FEATURED LAUNCH</span>
                </div>
              </div>

              <div className="space-y-0">
                {featuredLaunches.map((launch) => (
                  <div
                    key={launch.id}
                    className="flex items-center gap-2 border-b border-[#404040] py-4 last:border-b-0"
                  >
                    {/* Logo with diagonal stripes */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-gradient-to-br from-orange-400 to-yellow-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]"></div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white">{launch.name}</h3>
                      {/* Short description for small screens */}
                      <p className="text-sm text-nowrap text-neutral-400 sm:hidden">
                        {launch.shortDescription}
                      </p>
                      {/* Long description for larger screens */}
                      <p className="hidden text-sm text-nowrap text-neutral-400 sm:block">
                        {launch.longDescription}
                      </p>
                    </div>

                    {/* Vote button */}
                    <div className="relative shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVoteClick(launch.id)}
                        className="flex h-6 items-center gap-0.5 rounded border border-neutral-600 bg-transparent px-2 py-0.5 text-white transition-all duration-300 hover:bg-neutral-800 sm:h-8 sm:gap-1 sm:px-3 sm:py-1"
                      >
                        <span className="text-xs sm:text-sm">▲</span>
                        <span className="text-xs font-medium tabular-nums sm:text-sm">
                          {launch.votes}
                        </span>
                      </Button>

                      {/* Floating triangles */}
                      {floatingTriangles
                        .filter((triangle) => triangle.id === launch.id)
                        .map((triangle, index) => (
                          <div
                            key={triangle.key}
                            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 animate-[floatUp_1s_forwards]"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              left: `${50 + (index - 1) * 15}%`,
                            }}
                          >
                            <span className="text-xs text-cyan-400 sm:text-sm">▲</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center sm:mt-8">
                <Button
                  variant="ghost"
                  className="w-full rounded-none text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white sm:w-auto sm:text-base"
                  asChild
                >
                  <Link href="/launches" event="view_all_launches_click">
                    View all launches
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
