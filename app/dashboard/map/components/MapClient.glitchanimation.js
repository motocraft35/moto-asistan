
import { motion } from 'framer-motion';

const CyberGlitchAnimation = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
};

export default CyberGlitchAnimation;