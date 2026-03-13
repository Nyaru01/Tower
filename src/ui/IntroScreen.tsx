import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const fadingStarted = useRef(false);

  useEffect(() => {
    // Play brand sound
    const brandAudio = new Audio('/sounds/brand-logo-intro.mp3');
    brandAudio.volume = 0.5;

    // Play shuffling sound
    const shuffleAudio = new Audio('/sounds/shuffling.mp3');
    shuffleAudio.volume = 0.4;

    const playSounds = async () => {
      try {
        await brandAudio.play();
        setTimeout(() => shuffleAudio.play().catch(e => console.error(e)), 500);
      } catch (err) {
        console.error("Audio play failed:", err);
      }
    };

    playSounds();

    return () => {
      brandAudio.pause();
      shuffleAudio.pause();
    };
  }, []);

  const handleVideoEnd = () => {
    if (fadingStarted.current) return;
    fadingStarted.current = true;
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="fixed inset-0 z-0 bg-black flex items-center justify-center overflow-hidden"
      >
        <motion.video
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
          onEnded={handleVideoEnd}
          className="w-full h-full object-contain mix-blend-screen contrast-125 relative z-10"
        />

        {/* Top Black Gradient */}
        <div
          className="absolute top-0 left-0 w-full h-[35vh] z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, black 15%, transparent 100%)' }}
        />

        {/* Bottom Black Gradient */}
        <div
          className="absolute bottom-0 left-0 w-full h-[35vh] z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, black 15%, transparent 100%)' }}
        />
      </motion.div>
    </motion.div>
  );
}
