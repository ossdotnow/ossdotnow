import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ShieldCheck, Briefcase } from 'lucide-react';
import { ProjectWithRelations } from '@workspace/api';
import { cn } from '@workspace/ui/lib/utils';

const SPLIT_DISTANCE = 10;
const OVERLAP = 10;
const SIZE = 16;

export default function ProjectTicks({ project }: { project: ProjectWithRelations }) {
  const ticks = [
    {
      label: 'Verified',
      color: '#10B981',
      isActive: !!project.ownerId,
      icon: ShieldCheck,
    },
    {
      label: 'Hiring',
      color: '#3B82F6',
      isActive: !!project.isHiring,
      icon: Briefcase,
    },
  ];

  const activeTicks = ticks.filter((tick) => tick.isActive);

  return (
    <div className="group/ticks relative inline-flex">
      <div
        className="relative"
        style={{
          width: `${activeTicks.length * OVERLAP + SIZE - OVERLAP}px`,
          height: `${SIZE + 2}px`,
        }}
      >
        {activeTicks.map((tick, index) => {
          const IconComponent = tick.icon;
          return tick.isActive ? (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'absolute transition-all duration-300 ease-in-out',
                    'group-hover/ticks:[transform:translateX(var(--split-distance))]',
                    'bg-background p-1',
                  )}
                  style={
                    {
                      left: `${index * OVERLAP}px`,
                      borderRadius: '100%',
                      zIndex: activeTicks.length - index,
                      '--split-distance': `${index * SPLIT_DISTANCE}px`,
                    } as React.CSSProperties
                  }
                >
                  <IconComponent
                    className="drop-shadow-sm"
                    size={SIZE}
                    style={{ color: tick.color }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tick.label}</p>
              </TooltipContent>
            </Tooltip>
          ) : null;
        })}
      </div>
    </div>
  );
}
