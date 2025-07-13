'use client';

import {
  Code2,
  Rocket,
  Users,
  Trophy,
  Sparkles,
  Heart,
  GitBranch,
  Zap,
} from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import Link from '@workspace/ui/components/link';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title: 'Launch Your Projects',
      description: 'Showcase your open source work and get discovered by the community',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Connect with Developers',
      description: 'Find collaborators, contributors, and like-minded builders',
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Earn Recognition',
      description: 'Get kudos and feedback from the community for your contributions',
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: 'Track Progress',
      description: "Monitor your project's growth with insights and analytics",
    },
  ];

  const values = [
    {
      icon: <Code2 className="h-5 w-5" />,
      title: 'Open Source First',
      description: 'We believe in the power of open collaboration',
      color: 'text-cyan-400',
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: 'Community Driven',
      description: 'Built by developers, for developers',
      color: 'text-emerald-400',
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Quality Over Quantity',
      description: 'Curated projects that make a difference',
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="px-6 pt-6">
      <div className="relative mx-auto min-h-screen max-w-[1080px]">
        <div
          className={`pointer-events-none fixed top-[calc(32px+65px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
            showShadow ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />

        <div className="space-y-16 py-12">
          <section className="space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-2 border-neutral-700 bg-neutral-800 ">
                <Zap className="mr-1 h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="text-cyan-400 animate-pulse">The Open Source Discovery Platform</span>
              </Badge>
              <h1 className="text-5xl font-semibold tracking-tight text-white">
                Where Great Projects
                <span className="block max-w-fit border-cyan-400 bg-gradient-to-r from-cyan-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Come to Life
                </span>
              </h1>
              <p className="max-w-4xl text-xl leading-relaxed text-neutral-400">
                oss.now is the premier platform for discovering, launching, and celebrating open
                source projects. We&apos;re building a community where developers can showcase their
                work, connect with contributors, and accelerate the growth of amazing software.
              </p>
            </div>
          </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            <p className="max-w-4xl text-lg leading-relaxed text-neutral-400">
              We exist to democratize open source discovery. Too many incredible projects remain
              hidden in the depths of GitHub and GitLab. We&apos;re changing that by creating a
              vibrant marketplace of ideas where quality projects get the visibility they deserve.
            </p>
          </div>
        </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white">What We Do</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-cyan-500/50 border shadow-sm flex flex-col gap-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-cyan-500/20 p-3 text-cyan-400 border border-cyan-600/20 border-2">
                      {feature.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="text-neutral-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Our Values</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {values.map((value, idx) => (
                <div
                  key={value.title}
                  className="space-y-3 border border-neutral-800 bg-neutral-900/30 p-6"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={
                        value.title === "Community Driven"
                          ? "text-emerald-400"
                          : "text-cyan-400"
                      }
                    >
                      {value.icon}
                    </div>
                    <h3 className="font-semibold text-white">{value.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-400">{value.description}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="border border-neutral-800 bg-neutral-900/50 p-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Launch?</h2>
            <p className="mb-6 text-lg text-neutral-300">
              Join thousands of developers already using OSS Dot Now to showcase their work
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/projects"
                  className="bg-cyan-500 px-6 py-3 font-medium text-black transition-colors hover:bg-cyan-600 text-center"
                >
                  Explore Projects
                </Link>
                <Link
                  href="/early-submission"
                  className="border border-neutral-700 bg-neutral-800 px-6 py-3 font-medium text-white transition-colors hover:bg-neutral-700 text-center"
                >
                  Submit Your Project
                </Link>
              </div>
            </div>
          </section>

          <section className="border-t border-neutral-800 pt-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
              <Code2 className="h-4 w-4" />
              <span>oss.now is proudly open source</span>
              <span>•</span>
              <Link
                href="https://github.com/ossdotnow/ossdotnow"
                className="text-cyan-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contribute on GitHub
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
