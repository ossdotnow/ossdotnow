'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import Link from '@workspace/ui/components/link';
import { motion } from 'motion/react';

const MotionComponent = motion.create(TooltipTrigger);

export default function GitAvatars() {
  return (
    <motion.div
      className="bg-background group mt-8 flex items-center rounded-full border p-2 shadow-sm"
      whileHover="hover"
    >
      <div className="flex justify-center">
        {projects.map((project, index) => (
          <Tooltip key={project.name}>
            <MotionComponent
              initial={{ x: 0 }}
              style={{
                marginLeft: index === 0 ? '0rem' : '-0.6rem',
                height: '32px',
                width: '32px',
              }}
              variants={{
                hover: { marginLeft: '0.2rem', height: '36px', width: '36px' },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                event={`${project.name}_clicked`}
              >
                <img className="ring-background rounded-full ring-1" src={project.avatar} />
              </Link>
            </MotionComponent>
            <TooltipContent>
              <p>{project.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <motion.span
        className="text-muted-foreground pointer-events-none px-3 text-xs md:text-sm"
        initial={{ opacity: 1 }}
        variants={{
          hover: { opacity: 0.7 },
        }}
      >
        Join these awesome oss projects
      </motion.span>
    </motion.div>
  );
}

const projects = [
  {
    name: 'better-t-stack',
    url: 'https://github.com/AmanVarshney01/create-better-t-stack',
    avatar: 'https://avatars.githubusercontent.com/u/45312299',
  },
  {
    name: 'fumadocs',
    url: 'https://github.com/fuma-nama/fumadocs',
    avatar: 'https://avatars.githubusercontent.com/u/76240755',
  },
  {
    name: 'Autumn',
    url: 'https://github.com/useautumn/autumn',
    avatar: 'https://avatars.githubusercontent.com/u/194405912',
  },
  {
    name: 'CompAI',
    url: 'https://github.com/trycompai/comp',
    avatar: 'https://avatars.githubusercontent.com/u/195194844',
  },
  {
    name: 'Analog',
    url: 'https://github.com/analogdotnow/Analog',
    avatar: 'https://avatars.githubusercontent.com/u/212980245',
  },
  {
    name: 'better-auth',
    url: 'https://github.com/better-auth/better-auth',
    avatar: 'https://avatars.githubusercontent.com/u/163827765',
  },
];
