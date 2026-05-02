import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function AppTile({ app, orgSlug }) {
  const navigate = useNavigate();
  const Icon = app.icon;

  const handleClick = () => {
    const target = app.href({ orgSlug });
    if (target.startsWith('http')) {
      window.location.href = target;
    } else {
      navigate(target);
    }
  };

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      className={cn(
        'group flex flex-col items-center gap-3 p-2 rounded-2xl',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
      )}
    >
      <div
        className={cn(
          'w-20 h-20 rounded-[22px] bg-gradient-to-br shadow-elevated',
          'flex items-center justify-center',
          'transition-shadow duration-200 group-hover:shadow-[0_12px_40px_rgba(0,113,227,0.35)]',
          app.accent || 'from-slate-600 to-slate-800'
        )}
      >
        <Icon className="w-9 h-9 text-white" strokeWidth={1.75} />
      </div>
      <div className="text-center">
        <div className="text-body-sm font-medium text-white">{app.name}</div>
        {app.tagline && (
          <div className="text-small text-white/40 mt-0.5">{app.tagline}</div>
        )}
      </div>
    </motion.button>
  );
}

export default AppTile;
