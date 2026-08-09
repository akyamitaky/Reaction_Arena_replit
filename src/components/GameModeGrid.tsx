import { motion } from 'framer-motion';
import { gameModes } from '@/lib/gameConfig';

export default function GameModeGrid() {
  return (
    <div className="mt-8 grid grid-cols-5 gap-2">
      {gameModes.map((item, i) => (
        <motion.div
          key={item.id}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.03 }}
        >
          <item.icon className={`w-5 h-5 ${item.color}`} />
          <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
