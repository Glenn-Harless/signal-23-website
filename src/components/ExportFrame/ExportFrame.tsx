import React from 'react';
import type { AspectRatio } from '../../lib/exportSettings';
import './ExportFrame.css';

type ExportFrameProps = {
  aspect: AspectRatio;
  active: boolean;
  children: React.ReactNode;
};

const aspectClassByRatio: Record<AspectRatio, string> = {
  '9:16': 'export-frame-aspect-9-16',
  '16:9': 'export-frame-aspect-16-9',
  '1:1': 'export-frame-aspect-1-1',
  '4:5': 'export-frame-aspect-4-5',
};

export const ExportFrame: React.FC<ExportFrameProps> = ({ aspect, active, children }) => {
  if (!active) {
    return <div className="export-frame-normal">{children}</div>;
  }

  return (
    <div className="export-frame-active">
      <div className={`export-frame-canvas ${aspectClassByRatio[aspect]}`}>
        {children}
      </div>
    </div>
  );
};
