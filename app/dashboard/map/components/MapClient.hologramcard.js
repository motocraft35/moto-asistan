
import { motion } from 'framer-motion';

const HologramCard = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 100,
        width: 200,
        height: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 10,
        boxShadow: 10,
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Typography variant="h6" color="inherit">
          Hologram Kart
        </Typography>
      </motion.div>
    </div>
  );
};

export default HologramCard;