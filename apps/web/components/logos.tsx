'use client';

import Icons from '@/components/icons';
import Link from '@/components/link';

export function Logos() {
  return (
    <div className="z-10 mt-10 flex w-full max-w-lg flex-col items-center gap-6 sm:mt-20">
      <p className="z-10 text-sm font-medium uppercase tracking-wider text-[#494949]">
        Created by the people behind
      </p>
      <div className="z-10 flex items-center gap-8">
        <Link
          className="group z-10"
          href="https://0.email"
          target="_blank"
          event="clicked_zero_email_logo"
        >
          <Icons.zero className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
        <Link
          className="group z-10"
          href="https://witharc.co"
          target="_blank"
          event="clicked_with_arc_logo"
        >
          <Icons.arc className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
        <Link
          className="group z-10"
          href="https://x.com/cupolalabs"
          target="_blank"
          event="clicked_cupola_labs_logo"
        >
          <Icons.cupola className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
        <Link
          className="group z-10"
          href="https://analog.now"
          target="_blank"
          event="clicked_analog_now_logo"
        >
          <Icons.analog className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
        <Link
          className="group z-10"
          href="https://sword.so"
          target="_blank"
          event="clicked_sword_so_logo"
        >
          <Icons.sword className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
        <Link
          className="group z-10"
          href="https://x.com/usetesseract"
          target="_blank"
          event="clicked_tesseract_logo"
        >
          <Icons.tesseract className="z-10 h-6 w-6 fill-[#494949] transition-colors group-hover:fill-[#ffffff] sm:h-8 sm:w-8" />
        </Link>
      </div>
    </div>
  );
}
