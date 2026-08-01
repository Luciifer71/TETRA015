import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { RiskGauge } from '../components/molecules/RiskGauge';

describe('RiskGauge Component', () => {
  it('renders score and risk level badge correctly', () => {
    render(<RiskGauge score={88} level="HIGH" confidence={97.4} />);

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    expect(screen.getByText('97.4%')).toBeInTheDocument();
  });

  it('renders LOW risk badge for score below 35', () => {
    render(<RiskGauge score={12} level="LOW" />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('LOW RISK')).toBeInTheDocument();
  });
});
