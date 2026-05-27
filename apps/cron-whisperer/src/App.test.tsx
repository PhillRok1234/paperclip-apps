import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the headline', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/cron whisperer/i);
  });

  it('converts the default NL input to cron', () => {
    render(<App />);
    expect(screen.getByTestId('cron-out')).toHaveTextContent('0 9 * * 1,2,3,4,5');
  });

  it('updates cron output when NL input changes', () => {
    render(<App />);
    const input = screen.getByLabelText(/Describe a schedule/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'every 15 minutes' } });
    expect(screen.getByTestId('cron-out')).toHaveTextContent('*/15 * * * *');
  });

  it('shows a friendly error for unrecognised NL', () => {
    render(<App />);
    const input = screen.getByLabelText(/Describe a schedule/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'twice in a blue moon' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/don't understand/i);
  });
});
