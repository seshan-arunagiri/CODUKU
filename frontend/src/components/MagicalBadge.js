import React from 'react';
import './MagicalBadge.css';

const ICON_MAP = {
  'week':  '⚡',
  'month': '🗺️',
  'year':  '🪄',
  'top':   '🏆',
  'join':  '🎩'
};

const COLOR_MAP = {
  'week':  '#fbbf24',
  'month': '#8b5cf6',
  'year':  '#ef4444',
  'top':   '#d4af37',
  'join':  '#10b981'
};

const NAME_MAP = {
  'week': "Seeker's Spark",
  'month': "Marauder's Map",
  'year': "Elder Wand Mastery",
  'top': "Triwizard Champion",
  'join': "Sorting Hat"
};

export default function MagicalBadge({ type, size = 'sm', showName = false }) {
  const icon = ICON_MAP[type] || '✨';
  const color = COLOR_MAP[type] || '#fff';
  const name = NAME_MAP[type] || 'Achievement';

  return (
    <div className={`magical-badge-wrap ${size}`} title={name}>
      <div className="badge-shield" style={{ '--badge-theme': color }}>
        <div className="badge-inner-ring">
          <div className="badge-core">
            <span className="badge-symbol">{icon}</span>
          </div>
        </div>
        <div className="badge-flare" />
      </div>
      {showName && <span className="badge-label-text">{name}</span>}
    </div>
  );
}
