import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, onRatingChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || rating) >= star;
        
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRatingChange?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            whileTap={!readonly ? { scale: 0.9 } : undefined}
            whileHover={!readonly ? { scale: 1.2 } : undefined}
            className="focus:outline-none transition-transform"
          >
            <Star
              className={`${sizeClasses[size]} transition-colors duration-200 ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-warm-200'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
