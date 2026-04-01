import React from 'react';

export default function HouseLogo({ house, size = 40 }) {
  // Map house name to logo paths in the public directory
  const getLogoPath = (houseName) => {
    switch (houseName?.toLowerCase()) {
      case 'gryffindor':
        return '/house_logos/gryffindor.png';
      case 'hufflepuff':
        return '/house_logos/hufflepuff.png';
      case 'ravenclaw':
        return '/house_logos/ravenclaw.png';
      case 'slytherin':
        return '/house_logos/slytherin.png';
      default:
        return null;
    }
  };

  const logoSrc = getLogoPath(house);

  if (!logoSrc) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          backgroundColor: '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size * 0.4
        }}
      >
        C
      </div>
    );
  }

  return (
    <img 
      src={logoSrc} 
      alt={`${house} Logo`} 
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain'
      }} 
    />
  );
}
