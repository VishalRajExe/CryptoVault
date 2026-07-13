import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as replayApi from '../api/replay';
import { useToast } from './ToastContext';

const ReplayContext = createContext();

export const useReplay = () => useContext(ReplayContext);

export const ReplayProvider = ({ children }) => {
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  
  // Replay Data
  const [replayCandles, setReplayCandles] = useState([]);
  const [replayWallet, setReplayWallet] = useState(null);
  const [replayPortfolio, setReplayPortfolio] = useState([]);
  const [replayOrders, setReplayOrders] = useState([]);
  const [replayPerformance, setReplayPerformance] = useState(null);

  const { push } = useToast();
  const pollIntervalRef = useRef(null);
  const activeSessionRef = useRef(activeSession);

  // Keep the ref updated with the latest activeSession state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Poll for updates while session is playing
  // Poll/refresh for updates
  const pollSessionData = useCallback(async (sessionObj) => {
    const targetSession = sessionObj || activeSessionRef.current;
    if (!targetSession) return;
    try {
      const [session, klines, wallet, portfolio, orders, perf] = await Promise.all([
        replayApi.getReplaySession(targetSession.id),
        replayApi.getReplayKlines(targetSession.symbol, targetSession.timeframe, 0, targetSession.currentTime, 500),
        replayApi.getReplayWallet(targetSession.id).catch(() => null),
        replayApi.getReplayPortfolio(targetSession.id).catch(() => []),
        replayApi.getReplayOrders(targetSession.id).catch(() => []),
        replayApi.getReplayPerformance(targetSession.id).catch(() => null)
      ]);
      setActiveSession(session);
      setReplayCandles(klines);
      if (wallet) setReplayWallet(wallet);
      if (portfolio) setReplayPortfolio(portfolio);
      if (orders) setReplayOrders(orders);
      if (perf) setReplayPerformance(perf);
    } catch (err) {
      console.error('Error polling replay session', err);
    }
  }, []);

  // Auto-advance candles when status is PLAYING
  useEffect(() => {
    if (isReplayMode && activeSession?.replayStatus === 'PLAYING') {
      const intervalMs = 1000 / (activeSession.replaySpeed || 1);
      const intervalId = setInterval(() => {
        replayApi.nextReplayCandle(activeSession.id)
          .then((updatedSession) => {
            // Guard against race conditions if session was paused while request was in flight
            if (activeSessionRef.current?.replayStatus === 'PLAYING') {
              setActiveSession(updatedSession);
              pollSessionData(updatedSession);
            }
          })
          .catch((err) => console.error('Error auto-advancing candle', err));
      }, intervalMs);
      return () => clearInterval(intervalId);
    }
  }, [isReplayMode, activeSession?.replayStatus, activeSession?.replaySpeed, activeSession?.id, pollSessionData]);

  const loadSession = async (session) => {
    try {
      let active = session;
      if (session.replayStatus === 'CREATED') {
        active = await replayApi.startReplaySession(session.id);
      } else if (session.replayStatus === 'PAUSED') {
        active = await replayApi.resumeReplaySession(session.id);
      }
      setActiveSession(active);
      setIsReplayMode(true);
      await pollSessionData(active);
      push(`Loaded Replay Session: ${active.name}`, 'success');
    } catch (err) {
      console.error('Failed to start/resume session in loadSession:', err);
      // Safe fallback: load session in current state
      setActiveSession(session);
      setIsReplayMode(true);
      await pollSessionData(session);
      push(`Loaded Replay Session: ${session.name}`, 'success');
    }
  };

  const exitReplayMode = () => {
    setIsReplayMode(false);
    setActiveSession(null);
    setReplayCandles([]);
    setReplayWallet(null);
    setReplayPortfolio([]);
    setReplayOrders([]);
    setReplayPerformance(null);
    push('Exited Replay Mode', 'info');
  };

  const executeControl = async (action, ...args) => {
    if (!activeSession) return;
    try {
      const res = await replayApi[action](activeSession.id, ...args);
      setActiveSession(res);
      await pollSessionData(res); // Force immediate refresh
      
      // Detail toast notifications for frontend pop ups
      if (action === 'pauseReplaySession') {
        push('Replay paused', 'info');
      } else if (action === 'resumeReplaySession') {
        push('Replay resumed', 'success');
      } else if (action === 'startReplaySession') {
        push('Replay started', 'success');
      } else if (action === 'nextReplayCandle') {
        push('Advanced 1 candle', 'info');
      } else if (action === 'prevReplayCandle') {
        push('Rewound 1 candle', 'info');
      } else if (action === 'updateReplaySpeed') {
        push(`Replay speed set to ${args[0]}x`, 'info');
      } else if (action === 'skipForward') {
        push(`Skipped forward ${args[0]} candles`, 'info');
      } else if (action === 'skipBackward') {
        push(`Skipped backward ${args[0]} candles`, 'info');
      }
    } catch (err) {
      push(err?.response?.data?.message || err.friendlyMessage || 'Action failed', 'error');
    }
  };

  // Virtual Trading wrapper
  const placeVirtualOrder = async (payload) => {
    if (!activeSession) return;
    try {
      await replayApi.placeReplayOrder(activeSession.id, payload);
      push(`Virtual ${payload.orderType} Order placed: ${payload.quantity} ${payload.symbol}!`, 'success');
      await pollSessionData();
    } catch (err) {
      push(err?.response?.data?.message || err.friendlyMessage || 'Order failed', 'error');
    }
  };

  const value = {
    isReplayMode,
    activeSession,
    replayCandles,
    replayWallet,
    replayPortfolio,
    replayOrders,
    replayPerformance,
    loadSession,
    exitReplayMode,
    executeControl,
    placeVirtualOrder
  };

  return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
};
