import React from 'react';
import './Standby.css';

interface StandbyProps {
  code: string;
  lines: string[];
}

// Holding page for a nav section whose content has not shipped yet.
export const Standby: React.FC<StandbyProps> = ({ code, lines }) => (
  <section className="standby" aria-labelledby="standby-code">
    <h1 id="standby-code" className="standby__code">{code}</h1>
    <p className="standby__status">TRANSMISSION PENDING</p>
    <ul className="standby__lines">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
    <a className="standby__contact" href="mailto:music@signal23.net">music@signal23.net</a>
  </section>
);
