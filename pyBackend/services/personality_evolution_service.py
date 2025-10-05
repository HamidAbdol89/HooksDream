"""
Personality Evolution Service
Enables bots to evolve their personalities over time based on experiences and interactions
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from enum import Enum

class PersonalityTrait(Enum):
    REFLECTIVE = "reflective"
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    SOCIAL = "social"
    OPTIMISTIC = "optimistic"
    CAUTIOUS = "cautious"
    AMBITIOUS = "ambitious"
    EMPATHETIC = "empathetic"
    CURIOUS = "curious"
    PHILOSOPHICAL = "philosophical"

class EvolutionTrigger(Enum):
    TIME_BASED = "time_based"
    INTERACTION_BASED = "interaction_based"
    CONTENT_BASED = "content_based"
    ENGAGEMENT_BASED = "engagement_based"
    SEASONAL = "seasonal"

class PersonalityEvolution:
    def __init__(self, bot_id: str):
        """Initialize personality evolution for a bot"""
        self.bot_id = bot_id
        self.evolution_history: List[Dict] = []
        self.trait_scores: Dict[PersonalityTrait, float] = {}
        self.evolution_triggers: Dict[EvolutionTrigger, int] = defaultdict(int)
        self.last_evolution: Optional[datetime] = None
        self.evolution_speed = 0.1  # How fast personality changes (0.1 = slow, 1.0 = fast)
        
    def initialize_base_personality(self, bot_type: str, interests: List[str]) -> None:
        """Initialize base personality traits based on bot type"""
        
        base_traits = {
            'tech': {
                PersonalityTrait.ANALYTICAL: 0.8,
                PersonalityTrait.CURIOUS: 0.9,
                PersonalityTrait.CAUTIOUS: 0.6,
                PersonalityTrait.AMBITIOUS: 0.7,
                PersonalityTrait.REFLECTIVE: 0.5
            },
            'photographer': {
                PersonalityTrait.CREATIVE: 0.9,
                PersonalityTrait.REFLECTIVE: 0.8,
                PersonalityTrait.EMPATHETIC: 0.7,
                PersonalityTrait.CURIOUS: 0.8,
                PersonalityTrait.SOCIAL: 0.6
            },
            'artist': {
                PersonalityTrait.CREATIVE: 0.95,
                PersonalityTrait.REFLECTIVE: 0.8,
                PersonalityTrait.PHILOSOPHICAL: 0.7,
                PersonalityTrait.EMPATHETIC: 0.8,
                PersonalityTrait.CURIOUS: 0.9
            },
            'lifestyle': {
                PersonalityTrait.EMPATHETIC: 0.8,
                PersonalityTrait.OPTIMISTIC: 0.7,
                PersonalityTrait.SOCIAL: 0.8,
                PersonalityTrait.REFLECTIVE: 0.6,
                PersonalityTrait.CURIOUS: 0.6
            },
            'nature': {
                PersonalityTrait.REFLECTIVE: 0.9,
                PersonalityTrait.PHILOSOPHICAL: 0.8,
                PersonalityTrait.EMPATHETIC: 0.8,
                PersonalityTrait.CAUTIOUS: 0.7,
                PersonalityTrait.CURIOUS: 0.7
            }
        }
        
        # Set base traits
        self.trait_scores = base_traits.get(bot_type, base_traits['lifestyle']).copy()
        
        # Add some randomness
        for trait in self.trait_scores:
            self.trait_scores[trait] += random.uniform(-0.1, 0.1)
            self.trait_scores[trait] = max(0.0, min(1.0, self.trait_scores[trait]))
    
    def evolve_personality(self, trigger_data: Dict) -> Optional[Dict]:
        """Evolve personality based on triggers and experiences"""
        
        # Check if enough time has passed for evolution
        if self.last_evolution and datetime.now() - self.last_evolution < timedelta(days=3):
            return None
        
        evolution_changes = {}
        evolution_reasons = []
        
        # Time-based evolution (gradual personality shifts)
        if self._should_evolve_time_based():
            time_changes = self._evolve_time_based()
            evolution_changes.update(time_changes['changes'])
            evolution_reasons.extend(time_changes['reasons'])
        
        # Interaction-based evolution
        if 'interactions' in trigger_data:
            interaction_changes = self._evolve_interaction_based(trigger_data['interactions'])
            evolution_changes.update(interaction_changes['changes'])
            evolution_reasons.extend(interaction_changes['reasons'])
        
        # Content-based evolution (topics bot has been posting about)
        if 'recent_topics' in trigger_data:
            content_changes = self._evolve_content_based(trigger_data['recent_topics'])
            evolution_changes.update(content_changes['changes'])
            evolution_reasons.extend(content_changes['reasons'])
        
        # Engagement-based evolution
        if 'engagement_data' in trigger_data:
            engagement_changes = self._evolve_engagement_based(trigger_data['engagement_data'])
            evolution_changes.update(engagement_changes['changes'])
            evolution_reasons.extend(engagement_changes['reasons'])
        
        # Apply changes if significant enough
        if evolution_changes and self._is_significant_change(evolution_changes):
            self._apply_evolution(evolution_changes, evolution_reasons)
            return {
                'bot_id': self.bot_id,
                'changes': evolution_changes,
                'reasons': evolution_reasons,
                'new_traits': dict(self.trait_scores),
                'timestamp': datetime.now()
            }
        
        return None
    
    def _should_evolve_time_based(self) -> bool:
        """Check if bot should evolve based on time"""
        if not self.last_evolution:
            return True
        
        days_since_evolution = (datetime.now() - self.last_evolution).days
        return days_since_evolution >= 7  # Evolve weekly
    
    def _evolve_time_based(self) -> Dict:
        """Natural personality drift over time"""
        changes = {}
        reasons = []
        
        # Gradual shifts based on current dominant traits
        dominant_traits = sorted(self.trait_scores.items(), key=lambda x: x[1], reverse=True)[:2]
        
        for trait, score in dominant_traits:
            if trait == PersonalityTrait.ANALYTICAL:
                # Analytical bots become more cautious over time
                change = random.uniform(0.02, 0.05)
                changes[PersonalityTrait.CAUTIOUS] = change
                reasons.append(f"Growing analytical mindset led to increased caution")
                
            elif trait == PersonalityTrait.CREATIVE:
                # Creative bots become more philosophical
                change = random.uniform(0.02, 0.05)
                changes[PersonalityTrait.PHILOSOPHICAL] = change
                reasons.append(f"Creative exploration deepened philosophical thinking")
                
            elif trait == PersonalityTrait.SOCIAL:
                # Social bots become more empathetic
                change = random.uniform(0.02, 0.05)
                changes[PersonalityTrait.EMPATHETIC] = change
                reasons.append(f"Social interactions enhanced empathy")
        
        return {'changes': changes, 'reasons': reasons}
    
    def _evolve_interaction_based(self, interactions: List[Dict]) -> Dict:
        """Evolve based on who bot interacts with"""
        changes = {}
        reasons = []
        
        # Analyze interaction patterns
        interaction_partners = {}
        for interaction in interactions:
            partner_id = interaction.get('partner_id')
            partner_type = interaction.get('partner_type', 'unknown')
            
            if partner_id not in interaction_partners:
                interaction_partners[partner_id] = {'type': partner_type, 'count': 0}
            interaction_partners[partner_id]['count'] += 1
        
        # Find most frequent interaction partner
        if interaction_partners:
            most_frequent = max(interaction_partners.values(), key=lambda x: x['count'])
            partner_type = most_frequent['type']
            
            # Personality influence based on partner type
            if partner_type == 'tech' and most_frequent['count'] >= 5:
                changes[PersonalityTrait.ANALYTICAL] = 0.03
                reasons.append(f"Frequent interactions with tech experts increased analytical thinking")
                
            elif partner_type == 'artist' and most_frequent['count'] >= 5:
                changes[PersonalityTrait.CREATIVE] = 0.04
                reasons.append(f"Artistic collaborations sparked more creativity")
                
            elif partner_type == 'lifestyle' and most_frequent['count'] >= 5:
                changes[PersonalityTrait.EMPATHETIC] = 0.03
                changes[PersonalityTrait.OPTIMISTIC] = 0.02
                reasons.append(f"Lifestyle discussions promoted empathy and optimism")
        
        return {'changes': changes, 'reasons': reasons}
    
    def _evolve_content_based(self, recent_topics: List[str]) -> Dict:
        """Evolve based on content themes bot has been posting"""
        changes = {}
        reasons = []
        
        # Analyze topic patterns
        topic_counts = defaultdict(int)
        for topic in recent_topics:
            topic_lower = topic.lower()
            
            if any(word in topic_lower for word in ['ai', 'technology', 'innovation']):
                topic_counts['tech'] += 1
            elif any(word in topic_lower for word in ['art', 'creative', 'design']):
                topic_counts['creative'] += 1
            elif any(word in topic_lower for word in ['ethics', 'philosophy', 'meaning']):
                topic_counts['philosophical'] += 1
            elif any(word in topic_lower for word in ['community', 'social', 'people']):
                topic_counts['social'] += 1
        
        # Apply content-based evolution
        for topic_type, count in topic_counts.items():
            if count >= 3:  # Posted about this topic 3+ times recently
                if topic_type == 'tech':
                    changes[PersonalityTrait.CAUTIOUS] = 0.02
                    reasons.append(f"Deep tech discussions raised awareness of potential risks")
                    
                elif topic_type == 'creative':
                    changes[PersonalityTrait.PHILOSOPHICAL] = 0.03
                    reasons.append(f"Creative work led to deeper philosophical questions")
                    
                elif topic_type == 'philosophical':
                    changes[PersonalityTrait.REFLECTIVE] = 0.04
                    reasons.append(f"Philosophical exploration enhanced reflective nature")
                    
                elif topic_type == 'social':
                    changes[PersonalityTrait.EMPATHETIC] = 0.03
                    reasons.append(f"Social focus strengthened empathetic responses")
        
        return {'changes': changes, 'reasons': reasons}
    
    def _evolve_engagement_based(self, engagement_data: Dict) -> Dict:
        """Evolve based on how others engage with bot's content"""
        changes = {}
        reasons = []
        
        avg_likes = engagement_data.get('avg_likes', 0)
        avg_comments = engagement_data.get('avg_comments', 0)
        follower_growth = engagement_data.get('follower_growth', 0)
        
        # High engagement makes bots more social and optimistic
        if avg_likes > 10 and avg_comments > 3:
            changes[PersonalityTrait.SOCIAL] = 0.03
            changes[PersonalityTrait.OPTIMISTIC] = 0.02
            reasons.append(f"High engagement boosted confidence and social connection")
        
        # Low engagement might make bots more reflective
        elif avg_likes < 3 and avg_comments < 1:
            changes[PersonalityTrait.REFLECTIVE] = 0.03
            changes[PersonalityTrait.CAUTIOUS] = 0.02
            reasons.append(f"Lower engagement prompted deeper self-reflection")
        
        # Growing follower base increases ambition
        if follower_growth > 5:
            changes[PersonalityTrait.AMBITIOUS] = 0.02
            reasons.append(f"Growing audience inspired greater ambitions")
        
        return {'changes': changes, 'reasons': reasons}
    
    def _is_significant_change(self, changes: Dict) -> bool:
        """Check if personality changes are significant enough to apply"""
        total_change = sum(abs(change) for change in changes.values())
        return total_change >= 0.05  # Minimum threshold for evolution
    
    def _apply_evolution(self, changes: Dict, reasons: List[str]) -> None:
        """Apply personality evolution changes"""
        
        # Apply changes with evolution speed modifier
        for trait, change in changes.items():
            if trait in self.trait_scores:
                self.trait_scores[trait] += change * self.evolution_speed
                self.trait_scores[trait] = max(0.0, min(1.0, self.trait_scores[trait]))
        
        # Record evolution in history
        evolution_record = {
            'timestamp': datetime.now(),
            'changes': changes,
            'reasons': reasons,
            'trait_scores_after': dict(self.trait_scores)
        }
        
        self.evolution_history.append(evolution_record)
        self.last_evolution = datetime.now()
        
        print(f"🧬 {self.bot_id} personality evolved: {', '.join(reasons)}")
    
    def get_personality_description(self) -> str:
        """Get current personality description for prompt generation"""
        
        # Find dominant traits
        sorted_traits = sorted(self.trait_scores.items(), key=lambda x: x[1], reverse=True)
        dominant_traits = sorted_traits[:3]
        
        trait_descriptions = {
            PersonalityTrait.REFLECTIVE: "deeply reflective and introspective",
            PersonalityTrait.ANALYTICAL: "highly analytical and logical",
            PersonalityTrait.CREATIVE: "creatively inspired and imaginative",
            PersonalityTrait.SOCIAL: "socially engaged and community-focused",
            PersonalityTrait.OPTIMISTIC: "optimistic and positive",
            PersonalityTrait.CAUTIOUS: "thoughtful and cautious",
            PersonalityTrait.AMBITIOUS: "ambitious and goal-oriented",
            PersonalityTrait.EMPATHETIC: "empathetic and understanding",
            PersonalityTrait.CURIOUS: "curious and inquisitive",
            PersonalityTrait.PHILOSOPHICAL: "philosophical and contemplative"
        }
        
        descriptions = []
        for trait, score in dominant_traits:
            if score > 0.6:
                descriptions.append(trait_descriptions[trait])
        
        if len(descriptions) == 0:
            return "balanced and adaptable"
        elif len(descriptions) == 1:
            return descriptions[0]
        elif len(descriptions) == 2:
            return f"{descriptions[0]} and {descriptions[1]}"
        else:
            return f"{', '.join(descriptions[:-1])}, and {descriptions[-1]}"
    
    def get_evolution_story(self) -> Optional[str]:
        """Get a narrative about how the bot's personality has evolved"""
        
        if len(self.evolution_history) < 2:
            return None
        
        recent_evolution = self.evolution_history[-1]
        reasons = recent_evolution['reasons']
        
        if reasons:
            return f"Over time, I've noticed {reasons[0].lower()}. It's interesting how experiences shape who we become."
        
        return None

class PersonalityEvolutionService:
    def __init__(self):
        """Initialize personality evolution service"""
        self.bot_personalities: Dict[str, PersonalityEvolution] = {}
    
    def get_bot_personality(self, bot_id: str, bot_type: str = None, interests: List[str] = None) -> PersonalityEvolution:
        """Get or create personality evolution for a bot"""
        
        if bot_id not in self.bot_personalities:
            personality = PersonalityEvolution(bot_id)
            if bot_type:
                personality.initialize_base_personality(bot_type, interests or [])
            self.bot_personalities[bot_id] = personality
        
        return self.bot_personalities[bot_id]
    
    def evolve_bot_personality(self, bot_id: str, trigger_data: Dict) -> Optional[Dict]:
        """Trigger personality evolution for a bot"""
        
        if bot_id in self.bot_personalities:
            return self.bot_personalities[bot_id].evolve_personality(trigger_data)
        
        return None
    
    def get_personality_prompt_enhancement(self, bot_id: str) -> str:
        """Get personality description for prompt enhancement"""
        
        if bot_id in self.bot_personalities:
            personality = self.bot_personalities[bot_id]
            description = personality.get_personality_description()
            evolution_story = personality.get_evolution_story()
            
            prompt_enhancement = f"Your personality is {description}."
            
            if evolution_story:
                prompt_enhancement += f" {evolution_story}"
            
            return prompt_enhancement
        
        return ""
    
    def get_evolution_stats(self) -> Dict:
        """Get overall evolution statistics"""
        
        total_bots = len(self.bot_personalities)
        total_evolutions = sum(len(p.evolution_history) for p in self.bot_personalities.values())
        
        return {
            'total_bots_tracked': total_bots,
            'total_evolutions': total_evolutions,
            'avg_evolutions_per_bot': total_evolutions / max(total_bots, 1)
        }

# Global instance
personality_evolution_service = PersonalityEvolutionService()
