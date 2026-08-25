import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GameShell, { type GameContext } from '@/components/GameShell';
import WhackGame from '@/components/games/WhackGame';
import type { GameMode } from '@/lib/gameConfig';
import { storage } from '@/lib/storage';
import { Zap } from 'lucide-react';

const TIMED_MODE: GameMode = {
  id: 'whack',
  label: 'Whack Attack',
  icon: Zap,
  color: 'text-primary',
  description: 'Whack fast for room points',
  rounds: 2,
  timePerRound: 2,
};

function MockGame({ round, timeLeft, addScore }: GameContext) {
  return (
    <div>
      <span data-testid="round">{round}</span>
      <span data-testid="time">{timeLeft}</span>
      <button onClick={() => addScore(10)}>hit</button>
    </div>
  );
}

function ComboGame({ score, combo, addScore, reportWrong }: GameContext) {
  return (
    <div>
      <span data-testid="combo-score">{score}</span>
      <span data-testid="combo-count">{combo}</span>
      <button onClick={() => addScore(100)}>correct</button>
      <button onClick={() => reportWrong()}>wrong</button>
    </div>
  );
}

function ResultsMarker() {
  return <div data-testid="results">results</div>;
}

function renderShell({ strictMode = true }: { strictMode?: boolean } = {}) {
  const tree = (
    <MemoryRouter initialEntries={['/play/whack']}>
      <Routes>
        <Route
          path="/play/whack"
          element={
            <GameShell mode={TIMED_MODE} arena={false}>
              {ctx => <WhackGame {...ctx} />}
            </GameShell>
          }
        />
        <Route path="/results" element={<ResultsMarker />} />
      </Routes>
    </MemoryRouter>
  );
  return render(strictMode ? <StrictMode>{tree}</StrictMode> : tree);
}

function renderMock() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/play/whack']}>
        <GameShell mode={TIMED_MODE} arena={false}>
          {ctx => <MockGame {...ctx} />}
        </GameShell>
      </MemoryRouter>
    </StrictMode>,
  );
}

describe('GameShell round timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances to the next round and resets the timer to full', () => {
    renderMock();
    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    expect(screen.getByTestId('round')).toHaveTextContent('1');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('time')).toHaveTextContent('1');
    act(() => vi.advanceTimersByTime(1000));

    // The clock must move to round 2 and reset the timer, never freeze at 0.
    expect(screen.getByTestId('round')).toHaveTextContent('2');
    expect(screen.getByTestId('time')).toHaveTextContent('2');
  });

  it('stops Whack Attack and reaches results when the final timer ends, even with an interleaved mole timer', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    // Run both full rounds (2s each) in 500ms ticks so the mole interval
    // (700ms) interleaves with the round clock exactly like the browser.
    for (let i = 0; i < 8; i++) {
      act(() => vi.advanceTimersByTime(500));
    }

    expect(screen.queryByText(/Round \d+\/2/)).not.toBeInTheDocument();
    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('reaches results even without StrictMode double-invocation', () => {
    renderShell({ strictMode: false });

    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    for (let i = 0; i < 4; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(screen.getByTestId('results')).toBeInTheDocument();
  });

  it('builds a combo with score multipliers and resets it on a wrong answer', () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/play/whack']}>
          <Routes>
            <Route
              path="/play/whack"
              element={
                <GameShell mode={TIMED_MODE} arena={false}>
                  {ctx => <ComboGame {...ctx} />}
                </GameShell>
              }
            />
            <Route path="/results" element={<ResultsMarker />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    // 100 then 100 * 1.15 = 115; 100 + 115 = 215, combo of 2.
    fireEvent.click(screen.getByRole('button', { name: 'correct' }));
    fireEvent.click(screen.getByRole('button', { name: 'correct' }));
    expect(screen.getByTestId('combo-score')).toHaveTextContent('215');
    expect(screen.getByTestId('combo-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('button', { name: 'wrong' }));
    expect(screen.getByTestId('combo-count')).toHaveTextContent('0');

    // A fresh hit restarts the streak at 1 (no multiplier yet).
    fireEvent.click(screen.getByRole('button', { name: 'correct' }));
    expect(screen.getByTestId('combo-score')).toHaveTextContent('315');
    expect(screen.getByTestId('combo-count')).toHaveTextContent('1');

    // Finish both rounds so the max combo is recorded to storage. Step in
    // 500ms increments so React flushes effects between timer ticks and the
    // round clock actually advances.
    for (let i = 0; i < 8; i++) {
      act(() => vi.advanceTimersByTime(500));
    }
    expect(screen.getByTestId('results')).toBeInTheDocument();
    expect(storage.getMaxCombo()).toBe(2);
  });
});
