// useStoryPhysics.ts - Physics simulation for floating story bubbles
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Story, StoryPosition, StoryBubbleState, PHYSICS_CONFIG } from '@/types/story';

export const useStoryPhysics = (stories: Story[]) => {
  const [bubbleStates, setBubbleStates] = useState<Map<string, StoryBubbleState>>(new Map());
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // Initialize bubble states for new stories
  useEffect(() => {
    setBubbleStates(prevStates => {
      const newStates = new Map(prevStates);
      
      stories.forEach(story => {
        if (!newStates.has(story._id)) {
          newStates.set(story._id, {
            position: { ...story.position },
            velocity: { ...story.position.velocity },
            isColliding: false,
            isDragging: false,
            lastUpdate: performance.now()
          });
        }
      });
      
      // Remove states for stories that no longer exist
      const storyIds = new Set(stories.map(s => s._id));
      for (const [id] of newStates) {
        if (!storyIds.has(id)) {
          newStates.delete(id);
        }
      }
      
      return newStates;
    });
  }, [stories.length]);

  // Check collision between two bubbles
  const checkCollision = useCallback((pos1: StoryPosition, pos2: StoryPosition, minDistance: number = 15) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < minDistance;
  }, []);

  // Apply physics forces
  const applyPhysics = useCallback((state: StoryBubbleState, deltaTime: number, allStates: Map<string, StoryBubbleState>) => {
    if (state.isDragging) return state; // Skip physics while dragging

    const dt = deltaTime * 0.001; // Convert to seconds
    let { position, velocity } = state;
    
    // Apply gravity (very subtle)
    velocity.y += PHYSICS_CONFIG.gravity * dt;
    
    // Apply friction
    velocity.x *= PHYSICS_CONFIG.friction;
    velocity.y *= PHYSICS_CONFIG.friction;
    
    // Collision detection and response
    let isColliding = false;
    for (const [otherId, otherState] of allStates) {
      if (otherState === state) continue;
      
      if (checkCollision(position, otherState.position)) {
        isColliding = true;
        
        if (PHYSICS_CONFIG.collision) {
          // Calculate collision response
          const dx = position.x - otherState.position.x;
          const dy = position.y - otherState.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            // Separate bubbles
            const overlap = 15 - distance;
            position.x += normalX * overlap * 0.5;
            position.y += normalY * overlap * 0.5;
            
            // Bounce effect
            const relativeVelocityX = velocity.x - otherState.velocity.x;
            const relativeVelocityY = velocity.y - otherState.velocity.y;
            const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;
            
            if (velocityAlongNormal > 0) continue; // Objects separating
            
            const restitution = PHYSICS_CONFIG.bounce;
            const impulse = -(1 + restitution) * velocityAlongNormal;
            
            velocity.x += impulse * normalX * 0.5;
            velocity.y += impulse * normalY * 0.5;
          }
        }
      }
    }
    
    // Magnetism effect (subtle attraction to center or other bubbles)
    if (PHYSICS_CONFIG.magnetism > 0) {
      const centerX = 50;
      const centerY = 50;
      const toCenterX = centerX - position.x;
      const toCenterY = centerY - position.y;
      const distanceToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
      
      if (distanceToCenter > 30) { // Only apply if far from center
        velocity.x += (toCenterX / distanceToCenter) * PHYSICS_CONFIG.magnetism * dt;
        velocity.y += (toCenterY / distanceToCenter) * PHYSICS_CONFIG.magnetism * dt;
      }
    }
    
    // Update position
    position.x += velocity.x * dt * 10; // Scale for reasonable movement
    position.y += velocity.y * dt * 10;
    
    // Boundary constraints (with bounce)
    const margin = 5;
    if (position.x < margin) {
      position.x = margin;
      velocity.x = Math.abs(velocity.x) * PHYSICS_CONFIG.bounce;
    } else if (position.x > 100 - margin) {
      position.x = 100 - margin;
      velocity.x = -Math.abs(velocity.x) * PHYSICS_CONFIG.bounce;
    }
    
    if (position.y < margin) {
      position.y = margin;
      velocity.y = Math.abs(velocity.y) * PHYSICS_CONFIG.bounce;
    } else if (position.y > 100 - margin) {
      position.y = 100 - margin;
      velocity.y = -Math.abs(velocity.y) * PHYSICS_CONFIG.bounce;
    }
    
    // Limit velocity to prevent runaway acceleration
    const maxVelocity = 50;
    const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (velocityMagnitude > maxVelocity) {
      velocity.x = (velocity.x / velocityMagnitude) * maxVelocity;
      velocity.y = (velocity.y / velocityMagnitude) * maxVelocity;
    }
    
    return {
      ...state,
      position: { ...position, velocity },
      velocity,
      isColliding,
      lastUpdate: performance.now()
    };
  }, [checkCollision]);

  // Physics simulation loop
  const simulatePhysics = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastUpdateRef.current;
    
    if (deltaTime >= 16) { // ~60fps
      setBubbleStates(prevStates => {
        const newStates = new Map();
        
        // Apply physics to all bubbles
        for (const [id, state] of prevStates) {
          const updatedState = applyPhysics(state, deltaTime, prevStates);
          newStates.set(id, updatedState);
        }
        
        return newStates;
      });
      
      lastUpdateRef.current = currentTime;
    }
    
    if (isRunningRef.current) {
      animationFrameRef.current = requestAnimationFrame(simulatePhysics);
    }
  }, [applyPhysics]);

  // Start physics simulation
  const startPhysicsSimulation = useCallback(() => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    lastUpdateRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(simulatePhysics);
  }, [simulatePhysics]);

  // Stop physics simulation
  const stopPhysicsSimulation = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Update bubble position (for external updates like dragging)
  const updateBubblePosition = useCallback((storyId: string, newPosition: StoryPosition) => {
    setBubbleStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(storyId);
      
      if (currentState) {
        newStates.set(storyId, {
          ...currentState,
          position: { ...newPosition },
          velocity: { ...newPosition.velocity },
          lastUpdate: performance.now()
        });
      }
      
      return newStates;
    });
  }, []);

  // Reset physics (useful for debugging or restarting)
  const resetPhysics = useCallback(() => {
    setBubbleStates(prevStates => {
      const newStates = new Map();
      
      for (const [id, state] of prevStates) {
        newStates.set(id, {
          ...state,
          velocity: { x: 0, y: 0 },
          isColliding: false,
          isDragging: false,
          lastUpdate: performance.now()
        });
      }
      
      return newStates;
    });
  }, []);

  // Add random impulse to bubbles (for fun interactions)
  const addRandomImpulse = useCallback((storyId?: string) => {
    setBubbleStates(prevStates => {
      const newStates = new Map(prevStates);
      
      const targetIds = storyId ? [storyId] : Array.from(newStates.keys());
      
      targetIds.forEach(id => {
        const state = newStates.get(id);
        if (state && !state.isDragging) {
          const impulseStrength = 20;
          const angle = Math.random() * Math.PI * 2;
          
          newStates.set(id, {
            ...state,
            velocity: {
              x: state.velocity.x + Math.cos(angle) * impulseStrength,
              y: state.velocity.y + Math.sin(angle) * impulseStrength
            }
          });
        }
      });
      
      return newStates;
    });
  }, []);

  // Set dragging state
  const setBubbleDragging = useCallback((storyId: string, isDragging: boolean) => {
    setBubbleStates(prevStates => {
      const newStates = new Map(prevStates);
      const state = newStates.get(storyId);
      
      if (state) {
        newStates.set(storyId, {
          ...state,
          isDragging,
          velocity: isDragging ? { x: 0, y: 0 } : state.velocity // Stop velocity when dragging starts
        });
      }
      
      return newStates;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPhysicsSimulation();
    };
  }, [stopPhysicsSimulation]);

  return {
    bubbleStates,
    updateBubblePosition,
    startPhysicsSimulation,
    stopPhysicsSimulation,
    resetPhysics,
    addRandomImpulse,
    setBubbleDragging
  };
};
