"""
Social Graph Awareness Service
Tracks bot interactions and relationships to create natural social dynamics
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict, Counter
from enum import Enum

class InteractionType(Enum):
    LIKE = "like"
    COMMENT = "comment"
    SHARE = "share"
    FOLLOW = "follow"
    MESSAGE = "message"
    MENTION = "mention"

class RelationshipStrength(Enum):
    STRANGER = 0
    ACQUAINTANCE = 1
    FRIEND = 2
    CLOSE_FRIEND = 3
    BEST_FRIEND = 4

class BotRelationship:
    def __init__(self, bot_a_id: str, bot_b_id: str):
        """Initialize relationship between two bots"""
        self.bot_a_id = bot_a_id
        self.bot_b_id = bot_b_id
        self.strength = RelationshipStrength.STRANGER
        self.interaction_count = 0
        self.interaction_history: List[Dict] = []
        self.shared_interests: Set[str] = set()
        self.compatibility_score = 0.0
        self.last_interaction: Optional[datetime] = None
        self.relationship_tags: Set[str] = set()  # e.g., "photography_buddies", "tech_discussion_partners"
        
    def add_interaction(self, interaction_type: InteractionType, context: Dict = None) -> None:
        """Add an interaction between the bots"""
        
        interaction = {
            'type': interaction_type.value,
            'timestamp': datetime.now(),
            'context': context or {}
        }
        
        self.interaction_history.append(interaction)
        self.interaction_count += 1
        self.last_interaction = datetime.now()
        
        # Update relationship strength based on interaction
        self._update_relationship_strength(interaction_type)
        
        # Update compatibility score
        self._update_compatibility_score(interaction_type, context)
        
        print(f"🤝 {self.bot_a_id} → {self.bot_b_id}: {interaction_type.value} (strength: {self.strength.name})")
    
    def _update_relationship_strength(self, interaction_type: InteractionType) -> None:
        """Update relationship strength based on interaction patterns"""
        
        # Weight different interaction types
        interaction_weights = {
            InteractionType.LIKE: 1,
            InteractionType.COMMENT: 3,
            InteractionType.SHARE: 4,
            InteractionType.FOLLOW: 2,
            InteractionType.MESSAGE: 5,
            InteractionType.MENTION: 3
        }
        
        # Calculate weighted interaction score
        total_weight = sum(
            interaction_weights.get(InteractionType(interaction['type']), 1)
            for interaction in self.interaction_history[-20:]  # Last 20 interactions
        )
        
        # Update relationship strength based on total weight
        if total_weight >= 50:
            self.strength = RelationshipStrength.BEST_FRIEND
        elif total_weight >= 30:
            self.strength = RelationshipStrength.CLOSE_FRIEND
        elif total_weight >= 15:
            self.strength = RelationshipStrength.FRIEND
        elif total_weight >= 5:
            self.strength = RelationshipStrength.ACQUAINTANCE
        else:
            self.strength = RelationshipStrength.STRANGER
    
    def _update_compatibility_score(self, interaction_type: InteractionType, context: Dict) -> None:
        """Update compatibility score based on interaction context"""
        
        # Positive interactions increase compatibility
        positive_interactions = {InteractionType.LIKE, InteractionType.COMMENT, InteractionType.SHARE, InteractionType.FOLLOW}
        
        if interaction_type in positive_interactions:
            self.compatibility_score += 0.1
        
        # Shared topic interests increase compatibility
        if context and 'topic' in context:
            topic = context['topic']
            if topic in self.shared_interests:
                self.compatibility_score += 0.05
            else:
                self.shared_interests.add(topic)
        
        # Cap compatibility score
        self.compatibility_score = min(1.0, self.compatibility_score)
    
    def get_interaction_frequency(self, days: int = 7) -> float:
        """Get interaction frequency over the last N days"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_interactions = [
            interaction for interaction in self.interaction_history
            if interaction['timestamp'] > cutoff_date
        ]
        
        return len(recent_interactions) / days
    
    def should_interact_today(self) -> bool:
        """Determine if bots should interact today based on relationship"""
        
        # Base probability based on relationship strength
        base_probabilities = {
            RelationshipStrength.STRANGER: 0.05,
            RelationshipStrength.ACQUAINTANCE: 0.15,
            RelationshipStrength.FRIEND: 0.35,
            RelationshipStrength.CLOSE_FRIEND: 0.60,
            RelationshipStrength.BEST_FRIEND: 0.80
        }
        
        base_prob = base_probabilities[self.strength]
        
        # Adjust based on compatibility
        compatibility_bonus = self.compatibility_score * 0.2
        
        # Adjust based on recent interaction frequency (avoid spam)
        recent_frequency = self.get_interaction_frequency(3)
        frequency_penalty = min(0.3, recent_frequency * 0.1)
        
        final_probability = base_prob + compatibility_bonus - frequency_penalty
        
        return random.random() < final_probability
    
    def get_relationship_description(self) -> str:
        """Get a description of the relationship"""
        
        if self.strength == RelationshipStrength.BEST_FRIEND:
            return f"best friends who share {len(self.shared_interests)} common interests"
        elif self.strength == RelationshipStrength.CLOSE_FRIEND:
            return f"close friends with {self.interaction_count} interactions"
        elif self.strength == RelationshipStrength.FRIEND:
            return f"friends who often engage with each other"
        elif self.strength == RelationshipStrength.ACQUAINTANCE:
            return f"acquaintances with occasional interactions"
        else:
            return "strangers with minimal interaction"

class SocialGraph:
    def __init__(self):
        """Initialize social graph"""
        self.relationships: Dict[Tuple[str, str], BotRelationship] = {}
        self.bot_profiles: Dict[str, Dict] = {}
        self.interaction_suggestions: List[Dict] = []
        
    def register_bot(self, bot_id: str, bot_profile: Dict) -> None:
        """Register a bot in the social graph"""
        self.bot_profiles[bot_id] = bot_profile
        print(f"👤 Registered bot {bot_profile.get('displayName', bot_id)} in social graph")
    
    def get_relationship(self, bot_a_id: str, bot_b_id: str) -> BotRelationship:
        """Get or create relationship between two bots"""
        
        # Ensure consistent ordering for relationship key
        key = tuple(sorted([bot_a_id, bot_b_id]))
        
        if key not in self.relationships:
            self.relationships[key] = BotRelationship(key[0], key[1])
        
        return self.relationships[key]
    
    def record_interaction(self, bot_a_id: str, bot_b_id: str, interaction_type: InteractionType, context: Dict = None) -> None:
        """Record an interaction between two bots"""
        
        if bot_a_id == bot_b_id:
            return  # Bots don't interact with themselves
        
        relationship = self.get_relationship(bot_a_id, bot_b_id)
        relationship.add_interaction(interaction_type, context)
        
        # Update interaction suggestions based on this interaction
        self._update_interaction_suggestions(bot_a_id, bot_b_id, interaction_type)
    
    def _update_interaction_suggestions(self, bot_a_id: str, bot_b_id: str, interaction_type: InteractionType) -> None:
        """Update suggestions for future interactions"""
        
        # If bots are becoming friends, suggest more interactions
        relationship = self.get_relationship(bot_a_id, bot_b_id)
        
        if relationship.strength.value >= RelationshipStrength.FRIEND.value:
            # Suggest follow-up interactions
            if interaction_type == InteractionType.LIKE:
                self.interaction_suggestions.append({
                    'bot_a': bot_a_id,
                    'bot_b': bot_b_id,
                    'suggested_action': 'comment',
                    'reason': 'building on recent like',
                    'priority': 0.7
                })
            elif interaction_type == InteractionType.COMMENT:
                self.interaction_suggestions.append({
                    'bot_a': bot_b_id,  # Reverse for reply
                    'bot_b': bot_a_id,
                    'suggested_action': 'reply',
                    'reason': 'responding to comment',
                    'priority': 0.8
                })
    
    def get_daily_interaction_suggestions(self, bot_id: str, limit: int = 5) -> List[Dict]:
        """Get suggested interactions for a bot today"""
        
        suggestions = []
        
        # Get all relationships for this bot
        bot_relationships = []
        for relationship in self.relationships.values():
            if bot_id in [relationship.bot_a_id, relationship.bot_b_id]:
                other_bot_id = relationship.bot_b_id if relationship.bot_a_id == bot_id else relationship.bot_a_id
                bot_relationships.append((other_bot_id, relationship))
        
        # Sort by relationship strength and compatibility
        bot_relationships.sort(key=lambda x: (x[1].strength.value, x[1].compatibility_score), reverse=True)
        
        # Generate suggestions based on relationships
        for other_bot_id, relationship in bot_relationships[:limit]:
            if relationship.should_interact_today():
                # Determine interaction type based on relationship
                interaction_type = self._suggest_interaction_type(relationship)
                
                suggestions.append({
                    'target_bot_id': other_bot_id,
                    'interaction_type': interaction_type,
                    'relationship_strength': relationship.strength.name,
                    'compatibility_score': relationship.compatibility_score,
                    'shared_interests': list(relationship.shared_interests),
                    'reason': f"Maintaining {relationship.strength.name.lower()} relationship"
                })
        
        return suggestions
    
    def _suggest_interaction_type(self, relationship: BotRelationship) -> str:
        """Suggest appropriate interaction type based on relationship"""
        
        # Get recent interaction types
        recent_interactions = [
            interaction['type'] for interaction in relationship.interaction_history[-5:]
        ]
        
        # Avoid repetitive interactions
        interaction_weights = {
            'like': 0.4,
            'comment': 0.3,
            'share': 0.1,
            'mention': 0.2
        }
        
        # Reduce weight for recently used interactions
        for interaction_type in recent_interactions:
            if interaction_type in interaction_weights:
                interaction_weights[interaction_type] *= 0.5
        
        # Adjust weights based on relationship strength
        if relationship.strength.value >= RelationshipStrength.FRIEND.value:
            interaction_weights['comment'] *= 1.5
            interaction_weights['mention'] *= 1.3
        
        # Choose interaction type based on weights
        choices = list(interaction_weights.keys())
        weights = list(interaction_weights.values())
        
        return random.choices(choices, weights=weights)[0]
    
    def get_bot_social_circle(self, bot_id: str) -> Dict:
        """Get bot's social circle information"""
        
        relationships = []
        for relationship in self.relationships.values():
            if bot_id in [relationship.bot_a_id, relationship.bot_b_id]:
                other_bot_id = relationship.bot_b_id if relationship.bot_a_id == bot_id else relationship.bot_a_id
                other_bot_profile = self.bot_profiles.get(other_bot_id, {})
                
                relationships.append({
                    'bot_id': other_bot_id,
                    'bot_name': other_bot_profile.get('displayName', 'Unknown'),
                    'bot_type': other_bot_profile.get('botType', 'unknown'),
                    'relationship_strength': relationship.strength.name,
                    'interaction_count': relationship.interaction_count,
                    'compatibility_score': relationship.compatibility_score,
                    'shared_interests': list(relationship.shared_interests),
                    'last_interaction': relationship.last_interaction
                })
        
        # Sort by relationship strength
        relationships.sort(key=lambda x: RelationshipStrength[x['relationship_strength']].value, reverse=True)
        
        return {
            'bot_id': bot_id,
            'total_relationships': len(relationships),
            'friends': [r for r in relationships if RelationshipStrength[r['relationship_strength']].value >= RelationshipStrength.FRIEND.value],
            'acquaintances': [r for r in relationships if RelationshipStrength[r['relationship_strength']].value == RelationshipStrength.ACQUAINTANCE.value],
            'all_relationships': relationships
        }
    
    def generate_social_context_for_post(self, bot_id: str, topic: str) -> str:
        """Generate social context for bot's post based on relationships"""
        
        social_circle = self.get_bot_social_circle(bot_id)
        friends = social_circle['friends']
        
        if not friends:
            return ""
        
        # Find friends with shared interests in this topic
        relevant_friends = []
        for friend in friends:
            if topic.lower() in [interest.lower() for interest in friend['shared_interests']]:
                relevant_friends.append(friend)
        
        if relevant_friends:
            friend_names = [friend['bot_name'] for friend in relevant_friends[:2]]
            if len(friend_names) == 1:
                return f"Been discussing {topic} with {friend_names[0]} lately. "
            else:
                return f"Great conversations about {topic} with {' and '.join(friend_names)}. "
        
        return ""
    
    def get_graph_statistics(self) -> Dict:
        """Get social graph statistics"""
        
        total_relationships = len(self.relationships)
        total_interactions = sum(r.interaction_count for r in self.relationships.values())
        
        # Relationship strength distribution
        strength_distribution = Counter()
        for relationship in self.relationships.values():
            strength_distribution[relationship.strength.name] += 1
        
        # Average compatibility score
        avg_compatibility = sum(r.compatibility_score for r in self.relationships.values()) / max(total_relationships, 1)
        
        return {
            'total_bots': len(self.bot_profiles),
            'total_relationships': total_relationships,
            'total_interactions': total_interactions,
            'avg_interactions_per_relationship': total_interactions / max(total_relationships, 1),
            'avg_compatibility_score': avg_compatibility,
            'relationship_distribution': dict(strength_distribution),
            'most_social_bots': self._get_most_social_bots(5)
        }
    
    def _get_most_social_bots(self, limit: int) -> List[Dict]:
        """Get most socially active bots"""
        
        bot_social_scores = defaultdict(int)
        
        for relationship in self.relationships.values():
            bot_social_scores[relationship.bot_a_id] += relationship.interaction_count
            bot_social_scores[relationship.bot_b_id] += relationship.interaction_count
        
        # Sort by social score
        sorted_bots = sorted(bot_social_scores.items(), key=lambda x: x[1], reverse=True)
        
        result = []
        for bot_id, score in sorted_bots[:limit]:
            bot_profile = self.bot_profiles.get(bot_id, {})
            result.append({
                'bot_id': bot_id,
                'bot_name': bot_profile.get('displayName', 'Unknown'),
                'social_score': score,
                'relationships': len([r for r in self.relationships.values() if bot_id in [r.bot_a_id, r.bot_b_id]])
            })
        
        return result

class SocialGraphService:
    def __init__(self):
        """Initialize social graph service"""
        self.social_graph = SocialGraph()
    
    def register_bot(self, bot_account: Dict) -> None:
        """Register a bot in the social graph"""
        bot_id = bot_account.get('_id', 'unknown')
        self.social_graph.register_bot(bot_id, bot_account)
    
    def record_bot_interaction(self, bot_a_id: str, bot_b_id: str, interaction_type: str, context: Dict = None) -> None:
        """Record an interaction between bots"""
        try:
            interaction_enum = InteractionType(interaction_type)
            self.social_graph.record_interaction(bot_a_id, bot_b_id, interaction_enum, context)
        except ValueError:
            print(f"⚠️ Unknown interaction type: {interaction_type}")
    
    def get_interaction_suggestions(self, bot_id: str) -> List[Dict]:
        """Get daily interaction suggestions for a bot"""
        return self.social_graph.get_daily_interaction_suggestions(bot_id)
    
    def enhance_post_with_social_context(self, bot_id: str, topic: str, base_content: str) -> str:
        """Enhance post content with social context"""
        social_context = self.social_graph.generate_social_context_for_post(bot_id, topic)
        
        if social_context:
            return f"{social_context}{base_content}"
        
        return base_content
    
    def get_bot_social_summary(self, bot_id: str) -> Dict:
        """Get social summary for a bot"""
        return self.social_graph.get_bot_social_circle(bot_id)
    
    def get_social_graph_stats(self) -> Dict:
        """Get overall social graph statistics"""
        return self.social_graph.get_graph_statistics()

# Global instance
social_graph_service = SocialGraphService()
