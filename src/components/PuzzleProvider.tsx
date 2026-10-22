/**
 * PlyQuest — Puzzle Provider & Hooks
 *
 * Loads the corpus manifest once and exposes async puzzle access to components.
 * Hooks guard against stale responses so rapid navigation cannot render an
 * out-of-date puzzle.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PuzzleRecord } from '../types/puzzle';
import {
  loadManifest,
  loadPuzzlesByIds,
  getPuzzle,
  PuzzleManifest,
} from '../utils/puzzleStore';

interface PuzzleContextValue {
  manifest: PuzzleManifest | null;
  ready: boolean;
  error: string | null;
}

const PuzzleContext = createContext<PuzzleContextValue>({
  manifest: null,
  ready: false,
  error: null,
});

export const PuzzleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manifest, setManifest] = useState<PuzzleManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((loaded) => {
        if (!cancelled) setManifest(loaded);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PuzzleContext.Provider value={{ manifest, ready: manifest !== null, error }}>
      {children}
    </PuzzleContext.Provider>
  );
};

export function usePuzzleManifest(): PuzzleContextValue {
  return useContext(PuzzleContext);
}

export interface AsyncPuzzle {
  puzzle: PuzzleRecord | null;
  loading: boolean;
  /** True only when the id is absent from the published corpus. */
  notFound: boolean;
}

/** Loads a single puzzle, discarding responses from superseded requests. */
export function usePuzzle(id: string | undefined): AsyncPuzzle {
  const { manifest } = useContext(PuzzleContext);
  const [state, setState] = useState<AsyncPuzzle>({
    puzzle: null,
    loading: false,
    notFound: false,
  });
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!manifest || !id) {
      tokenRef.current += 1;
      setState({ puzzle: null, loading: false, notFound: false });
      return;
    }

    const token = (tokenRef.current += 1);
    setState({ puzzle: null, loading: true, notFound: false });

    getPuzzle(id)
      .then((record) => {
        if (token !== tokenRef.current) return;
        setState({ puzzle: record, loading: false, notFound: record === null });
      })
      .catch(() => {
        if (token !== tokenRef.current) return;
        setState({ puzzle: null, loading: false, notFound: true });
      });
  }, [manifest, id]);

  return state;
}

/** Loads several puzzles at once, discarding responses from superseded requests. */
export function usePuzzles(ids: string[]): { puzzles: PuzzleRecord[]; loading: boolean } {
  const { manifest } = useContext(PuzzleContext);
  const [puzzles, setPuzzles] = useState<PuzzleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef(0);
  const key = ids.join('|');

  useEffect(() => {
    if (!manifest || ids.length === 0) {
      tokenRef.current += 1;
      setPuzzles([]);
      setLoading(false);
      return;
    }

    const token = (tokenRef.current += 1);
    setLoading(true);

    loadPuzzlesByIds(ids)
      .then((records) => {
        if (token !== tokenRef.current) return;
        setPuzzles(records);
        setLoading(false);
      })
      .catch(() => {
        if (token !== tokenRef.current) return;
        setPuzzles([]);
        setLoading(false);
      });
    // `key` captures the id list; `ids` itself is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest, key]);

  return { puzzles, loading };
}
