'use client';

import { Code2, Rocket, Users, Trophy, Sparkles, Heart, GitBranch, Zap } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Card } from '@workspace/ui/components/card';
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
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: 'Community Driven',
      description: 'Built by developers, for developers',
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Quality Over Quantity',
      description: 'Curated projects that make a difference',
    },
  ];

  return (
    <div className="relative mx-auto min-h-screen max-w-[1080px]">
      <div
        className={`pointer-events-none fixed top-[calc(32px+65px)] z-10 h-10 w-full bg-gradient-to-b from-[#101010] to-transparent transition-all duration-300 ${
          showShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed top-0 right-0 left-0 z-10 h-[32px] bg-[#101010]" />

      <div className="space-y-16 py-12">
        {/* Hero Section */}
        <section className="space-y-6">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-2">
              <Zap className="mr-1 h-3 w-3" />
              The Open Source Discovery Platform
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Where Great Projects
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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

        {/* Mission Section */}
        <section className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            <p className="max-w-4xl text-lg leading-relaxed text-neutral-300">
              We exist to democratize open source discovery. Too many incredible projects remain
              hidden in the depths of GitHub and GitLab. We&apos;re changing that by creating a
              vibrant marketplace of ideas where quality projects get the visibility they deserve.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">What We Offer</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="rounded-none border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700"
              >
                <div className="flex items-start space-x-4">
                  <div className="rounded-none bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 text-blue-400">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-neutral-400">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Our Values</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map((value, index) => (
              <div
                key={index}
                className="space-y-3 rounded-none border border-neutral-800 bg-neutral-900/30 p-6"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400">{value.icon}</div>
                  <h3 className="font-semibold text-white">{value.title}</h3>
                </div>
                <p className="text-sm text-neutral-400">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Join CTA */}
        <section className="rounded-none bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Launch?</h2>
          <p className="mb-6 text-lg text-neutral-300">
            Join thousands of developers already using OSS Dot Now to showcase their work
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/projects"
              className="rounded-none bg-white px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
            >
              Explore Projects
            </Link>
            <Link
              href="/early-submission"
              className="rounded-none border border-neutral-700 bg-neutral-800 px-6 py-3 font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Submit Your Project
            </Link>
          </div>
        </section>

        {/* Open Source Notice */}
        <section className="border-t border-neutral-800 pt-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
            <Code2 className="h-4 w-4" />
            <span>oss.now is proudly open source</span>
            <span>•</span>
            <a
              href="https://github.com/ossdotnow/ossdotnow"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute on GitHub
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
