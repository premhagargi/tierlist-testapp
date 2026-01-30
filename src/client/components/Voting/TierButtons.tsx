import { useEffect, useState } from 'react';
import type { Listing, Tier } from './types';

interface TierButtonsProps {
  tiers: Tier[];
  selectedListing: Listing;
  totalVotes: number;
  showResults: boolean;
  isVoting: boolean;
  votingTier: string | null;
  userVote: string | null;
  lastVotedTier: string | null;
  onVote: (tierName: string) => void;
  isExpired?: boolean;
}

const calculatePercentage = (tierVotes: number, totalVotes: number) => {
  if (!totalVotes || totalVotes <= 0) return 0;
  return Math.round((tierVotes / totalVotes) * 100);
};

const lightenColor = (hex: string, amount = 0.6) => {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex;
  const expanded =
    hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const num = parseInt(expanded.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};

export const TierButtons = ({
  tiers,
  selectedListing,
  totalVotes,
  showResults,
  isVoting,
  votingTier,
  userVote,
  lastVotedTier,
  onVote,
  isExpired,
}: TierButtonsProps) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [animateWidth, setAnimateWidth] = useState(false);

  useEffect(() => {
    if (showResults) {
      setAnimationKey((prev) => prev + 1);
      setAnimateWidth(true);
    } else {
      setAnimateWidth(false);
    }
  }, [showResults]);
  return (
    <div className="flex flex-col gap-2">
      {tiers.map((tier) => {
        const tierVotes = selectedListing.votes?.[tier.name] || 0;
        const percent = showResults ? calculatePercentage(tierVotes, totalVotes) : 0;
        const color = tier.color ?? tier.colour ?? '#ffffff';
        const lighterColor = lightenColor(color, 0.6);
        const barWidth = showResults && animateWidth ? `${percent}%` : '0%';

        return (
          <button
            key={tier.name}
            onClick={() => onVote(tier.name)}
            disabled={isVoting || !!userVote || isExpired}
            className={`relative hover:cursor-pointer w-full rounded-md px-3.5 py-2 flex items-center h-10 md:h-12 ${
              showResults ? 'justify-between' : 'justify-center'
            } font-semibold text-sm transition-transform duration-150 text-black shadow-none ${
              lastVotedTier === tier.name ? 'ring-2 ring-black/25' : ''
            } ${
              isExpired
                ? 'opacity-50 grayscale cursor-not-allowed'
                : isVoting || userVote
                  ? 'opacity-100 cursor-not-allowed'
                  : 'hover:-translate-y-0.5'
            }`}
            style={{ backgroundColor: showResults ? lighterColor : color, boxShadow: 'none' }}
          >
            {showResults && (
              <span
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
                key={`bar-${animationKey}`}
              >
                <span
                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                  style={{
                    width: barWidth,
                    backgroundColor: color,
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </span>
            )}

            <div
              className={`relative z-10 flex w-full items-center ${
                showResults ? 'justify-between' : 'justify-center'
              }`}
            >
              <div className="flex items-center gap-2 text-black">
                <span className="text-sm md:text-base text-black text-center">{tier.name}</span>
                {isVoting && votingTier === tier.name && !showResults && (
                  <span
                    className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
                    aria-label="Submitting"
                  />
                )}
              </div>

              {showResults && (
                <div className="flex items-end gap-1.5 text-xs md:text-sm leading-tight transition-all duration-500 ease-out text-black">
                  <span className="font-semibold">{percent}%</span>
                  <span className="text-[11px] md:text-[12px] font-semibold">{`(${tierVotes})`}</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
