import { Zap } from 'lucide-react';
import { useCredits } from '@/contexts/CreditsContext';
import { cn } from '@/lib/utils';

interface CreditCostBadgeProps {
  skillType: string;
  className?: string;
}

/**
 * Shows the credit cost for a skill as a small inline badge.
 * Turns red when the user doesn't have enough credits.
 */
export function CreditCostBadge({ skillType, className }: CreditCostBadgeProps) {
  const { credits, getCost } = useCredits();
  const cost = getCost(skillType);

  if (!credits) return null;

  const remaining = credits.credits_limit - credits.credits_used;
  const canAfford = remaining >= cost;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
        canAfford
          ? 'bg-primary/10 text-primary/70'
          : 'bg-red-500/10 text-red-400',
        className,
      )}
      title={canAfford ? `This action costs ${cost} credit${cost !== 1 ? 's' : ''}` : 'Not enough credits'}
    >
      <Zap className="h-2.5 w-2.5" />
      {cost}
    </span>
  );
}

/**
 * Hook to check if user can afford a specific skill.
 */
export function useCanAfford(skillType: string): boolean {
  const { credits, getCost } = useCredits();
  if (!credits) return true; // Don't block if credits haven't loaded
  const cost = getCost(skillType);
  const remaining = credits.credits_limit - credits.credits_used;
  return remaining >= cost;
}
