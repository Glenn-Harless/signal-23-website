import React from 'react';
import './Terms.css';

export const Terms: React.FC = () => {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>Signal-23</h1>

        <section>
          <h2>About</h2>
          <p>Signal-23 creates instrument racks and audio tools for Ableton Live.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            <a href="mailto:music@signal23.net">music@signal23.net</a>
          </p>
        </section>

        <section>
          <h2>Refund Policy</h2>
          <p>
            All digital product sales are final. If you experience technical issues
            with a purchase, please contact us and we'll work to resolve the problem.
          </p>
        </section>

        <section>
          <h2>Privacy</h2>
          <p>
            We collect only the information necessary to process your purchase.
            Payment processing is handled securely by Stripe. We do not sell or
            share your personal information.
          </p>
        </section>
      </div>
    </div>
  );
};
