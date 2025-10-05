import React, { useState } from 'react';
import ButterflyBackground from './components/ButterflyBackground';
import BirthdayCard from './components/BirthdayCard';
import BirthdayCake from './components/BirthdayCake';
import './birthday-styles.css';

function App() {
  const [cardOpen, setCardOpen] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [butterfliesFlying, setButterfliesFlying] = useState(false);

  const handleCardOpen = () => {
    setCardOpen(true);
  };

  const handleCardComplete = () => {
    setCardComplete(true);
  };

  const handleCakeAnimation = () => {
    // Additional celebration effects can be added here
    console.log('Cake animation completed!');
  };

  const handleCordPull = () => {
    setButterfliesFlying(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ButterflyBackground isFlying={butterfliesFlying} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        {!cardComplete && (
          <div className="birthday-experience">
            <BirthdayCard 
              isOpen={cardOpen}
              onCardOpen={handleCardOpen}
              onCardComplete={handleCardComplete}
              onCordPull={handleCordPull}
            />
          </div>
        )}
        
        {cardComplete && (
          <div className="cake-section">
            <BirthdayCake onAnimationComplete={handleCakeAnimation} />
          </div>
        )}
      </div>

      <div className="footer-text">
        Made with 💖 for Gayathri's special day
      </div>
    </div>
  );
}

export default App;
