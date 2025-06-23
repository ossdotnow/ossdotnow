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
        <Tooltip>
          <MotionComponent
            style={{ marginLeft: '0rem', height: '32px', width: '32px' }}
            variants={{
              hover: { marginLeft: '0rem', height: '36px', width: '36px' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Link
              href="https://github.com/AmanVarshney01/create-better-t-stack"
              target="_blank"
              rel="noreferrer noopener"
              event="better-t-stack_clicked"
            >
              <img
                className="ring-background rounded-full ring-1"
                src="https://avatars.githubusercontent.com/u/45312299"
              />
            </Link>
          </MotionComponent>
          <TooltipContent>
            <p>better-t-stack</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <MotionComponent
            initial={{ x: 0 }}
            style={{ marginLeft: '-0.6rem', height: '32px', width: '32px' }}
            variants={{
              hover: { marginLeft: '0.2rem', height: '36px', width: '36px' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Link
              href="https://github.com/fuma-nama/fumadocs"
              target="_blank"
              rel="noreferrer noopener"
              event="fumadocs_clicked"
            >
              <img
                className="ring-background rounded-full ring-1"
                src="https://avatars.githubusercontent.com/u/76240755"
              />
            </Link>
          </MotionComponent>
          <TooltipContent>
            <p>fumadocs</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <MotionComponent
            initial={{ x: 0 }}
            style={{ marginLeft: '-0.6rem', height: '32px', width: '32px' }}
            variants={{
              hover: { marginLeft: '0.2rem', height: '36px', width: '36px' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Link
              href="https://github.com/useautumn/autumn"
              target="_blank"
              rel="noreferrer noopener"
              event="autumn_clicked"
            >
              <img
                className="ring-background rounded-full ring-1"
                src="https://avatars.githubusercontent.com/u/194405912"
              />
            </Link>
          </MotionComponent>
          <TooltipContent>
            <p>Autumn</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <MotionComponent
            initial={{ x: 0 }}
            style={{ marginLeft: '-0.6rem', height: '32px', width: '32px' }}
            variants={{
              hover: { marginLeft: '0.2rem', height: '36px', width: '36px' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Link
              href="https://github.com/trycompai/comp"
              target="_blank"
              rel="noreferrer noopener"
              event="compai_clicked"
            >
              <img
                className="ring-background rounded-full ring-1"
                src="https://avatars.githubusercontent.com/u/195194844"
              />
            </Link>
          </MotionComponent>
          <TooltipContent>
            <p>CompAI</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <motion.span
        className="text-muted-foreground px-3 text-sm"
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
