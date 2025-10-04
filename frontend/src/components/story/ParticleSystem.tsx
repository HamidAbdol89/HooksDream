// ParticleSystem.tsx - Dynamic Particle Effects for Story Bubbles
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryPosition } from '@/types/story';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
  type: string;
}

interface ParticleSystemProps {
  type: 'sparkles' | 'bubbles' | 'stars' | 'hearts' | 'fire';
  intensity: number; // 1-10
  color: string;
  position?: StoryPosition;
  className?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  intensity,
  color,
  position,
  className = ''
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);

  // Particle configurations for different types
  const getParticleConfig = (particleType: string) => {
    switch (particleType) {
      case 'sparkles':
        return {
          count: Math.floor(intensity * 2),
          spawnRate: intensity * 0.1,
          life: 2000,
          size: { min: 2, max: 6 },
          velocity: { min: -20, max: 20 },
          gravity: -0.1,
          symbols: ['✨', '⭐', '💫', '🌟']
        };
      case 'bubbles':
        return {
          count: Math.floor(intensity * 3),
          spawnRate: intensity * 0.15,
          life: 3000,
          size: { min: 4, max: 12 },
          velocity: { min: -10, max: 10 },
          gravity: -0.05,
          symbols: ['🫧', '💧', '🔵', '⚪']
        };
      case 'stars':
        return {
          count: Math.floor(intensity * 1.5),
          spawnRate: intensity * 0.08,
          life: 4000,
          size: { min: 3, max: 8 },
          velocity: { min: -15, max: 15 },
          gravity: 0,
          symbols: ['⭐', '🌟', '✨', '💫']
        };
      case 'hearts':
        return {
          count: Math.floor(intensity * 2.5),
          spawnRate: intensity * 0.12,
          life: 2500,
          size: { min: 4, max: 10 },
          velocity: { min: -12, max: 12 },
          gravity: -0.08,
          symbols: ['❤️', '💖', '💕', '💗']
        };
      case 'fire':
        return {
          count: Math.floor(intensity * 4),
          spawnRate: intensity * 0.2,
          life: 1500,
          size: { min: 3, max: 9 },
          velocity: { min: -25, max: 25 },
          gravity: -0.15,
          symbols: ['🔥', '🧡', '🟠', '🟡']
        };
      default:
        return {
          count: intensity,
          spawnRate: intensity * 0.1,
          life: 2000,
          size: { min: 2, max: 6 },
          velocity: { min: -20, max: 20 },
          gravity: 0,
          symbols: ['✨']
        };
    }
  };

  const config = getParticleConfig(type);

  // Create a new particle
  const createParticle = (): Particle => {
    const centerX = position?.x || 50;
    const centerY = position?.y || 50;
    
    // Spawn particles in a circle around the story bubble
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 20; // 40-60px from center
    
    return {
      id: `particle-${particleIdRef.current++}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min) + config.velocity.min,
      vy: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min) + config.velocity.min,
      life: config.life,
      maxLife: config.life,
      size: config.size.min + Math.random() * (config.size.max - config.size.min),
      opacity: 1,
      color: color,
      type: config.symbols[Math.floor(Math.random() * config.symbols.length)]
    };
  };

  // Update particles physics
  const updateParticles = (deltaTime: number) => {
    setParticles(prevParticles => {
      const updatedParticles = prevParticles.map(particle => {
        // Update position
        const newX = particle.x + particle.vx * deltaTime * 0.001;
        const newY = particle.y + particle.vy * deltaTime * 0.001;
        
        // Apply gravity
        const newVy = particle.vy + config.gravity * deltaTime * 0.1;
        
        // Update life
        const newLife = particle.life - deltaTime;
        const lifeRatio = newLife / particle.maxLife;
        
        // Fade out as life decreases
        const newOpacity = Math.max(0, lifeRatio);
        
        return {
          ...particle,
          x: newX,
          y: newY,
          vy: newVy,
          life: newLife,
          opacity: newOpacity
        };
      });
      
      // Remove dead particles
      return updatedParticles.filter(particle => particle.life > 0);
    });
  };

  // Spawn new particles
  const spawnParticles = () => {
    setParticles(prevParticles => {
      if (prevParticles.length >= config.count) return prevParticles;
      
      const shouldSpawn = Math.random() < config.spawnRate;
      if (!shouldSpawn) return prevParticles;
      
      const newParticle = createParticle();
      return [...prevParticles, newParticle];
    });
  };

  // Animation loop
  const animate = (currentTime: number) => {
    const deltaTime = currentTime - lastUpdateRef.current;
    
    if (deltaTime >= 16) { // ~60fps
      updateParticles(deltaTime);
      spawnParticles();
      lastUpdateRef.current = currentTime;
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Start animation
  useEffect(() => {
    lastUpdateRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, type, position]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              opacity: particle.opacity
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              scale: { duration: 0.2 },
              x: { duration: 0 },
              y: { duration: 0 },
              opacity: { duration: 0 }
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              fontSize: `${particle.size}px`,
              color: particle.color,
              textShadow: `0 0 ${particle.size}px ${particle.color}`,
              filter: `brightness(${0.8 + particle.opacity * 0.4})`
            }}
          >
            {particle.type}
          </motion.div>
        ))}
      </AnimatePresence>
      
     
    </div>
  );
};
