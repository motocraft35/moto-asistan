
import { motion } from 'framer-motion';

const ScanningOverlay = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 243, 255, 0.5)',
        opacity: 0.5,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 2 }}
      />
    </div>
  );
};

export default ScanningOverlay;