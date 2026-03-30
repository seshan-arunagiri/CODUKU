import React from 'react';
import './Badges.css';

const BADGE_LIST = [
  {
    id: 'week',
    name: "Seeker's Spark",
    icon: '⚡',
    criteria: 'Maintain a continuous coding streak for 7 days.',
    rarity: 'Common',
    color: '#fbbf24'
  },
  {
    id: 'month',
    name: "Marauder's Map",
    icon: '🗺️',
    criteria: 'Maintain a continuous coding streak for 30 days.',
    rarity: 'Rare',
    color: '#8b5cf6'
  },
  {
    id: 'year',
    name: "Elder Wand Mastery",
    icon: '🪄',
    criteria: 'Maintain a continuous coding streak for 365 days. The ultimate test of dedication.',
    rarity: 'Legendary',
    color: '#ef4444'
  },
  {
    id: 'top',
    name: "Triwizard Champion",
    icon: '🏆',
    criteria: 'Reach and hold the #1 Global Rank on the leaderboard. Only one can hold this at a time.',
    rarity: 'Mythic',
    color: '#d4af37'
  },
  {
    id: 'join',
    name: "Sorting Hat",
    icon: '🎩',
    criteria: 'Successfully register and be sorted into a House.',
    rarity: 'Common',
    color: '#10b981'
  }
];

export default function Badges() {
  return (
    <div className="badges-page">
      <div className="badges-hero card-glass">
        <h1 className="hero-title">Gallery of Achievement</h1>
        <p className="hero-subtitle">Master the magical arts and earn your place in history.</p>
      </div>

      <div className="badges-encyclopedia">
        {BADGE_LIST.map(badge => (
          <div key={badge.id} className="badge-details-card card-glass" style={{ '--badge-color': badge.color }}>
            <div className="badge-visual">
              <span className="badge-icon-lg">{badge.icon}</span>
              <div className="badge-glow" />
            </div>
            <div className="badge-content">
              <div className="badge-header">
                <h2 className="badge-name">{badge.name}</h2>
                <span className={`badge-rarity ${badge.rarity.toLowerCase()}`}>{badge.rarity}</span>
              </div>
              <p className="badge-criteria">{badge.criteria}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
