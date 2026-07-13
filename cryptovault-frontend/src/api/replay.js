import api from './client';

// Market Data API
export const getReplaySymbols = async () => {
  const { data } = await api.get('/api/replay/m/symbols');
  return data;
};

export const getReplayKlines = async (symbol, interval, startTime, endTime, limit = 500, offset = 0) => {
  const params = { interval, limit, offset };
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;
  const { data } = await api.get(`/api/replay/m/${symbol}/klines`, { params });
  return data;
};

// Session Management API
export const createReplaySession = async (payload) => {
  // Uses URL parameters for creation based on controller signature
  const params = new URLSearchParams({
    name: payload.name,
    description: payload.description,
    symbol: payload.symbol,
    timeframe: payload.timeframe,
    startTime: payload.startTime,
    endTime: payload.endTime,
    initialBalance: payload.initialBalance,
    replaySpeed: payload.replaySpeed
  });
  const { data } = await api.post(`/api/replay/sessions?${params.toString()}`);
  return data;
};

export const getReplaySessions = async () => {
  const { data } = await api.get('/api/replay/sessions');
  return data;
};

export const getReplaySession = async (sessionId) => {
  const { data } = await api.get(`/api/replay/sessions/${sessionId}`);
  return data;
};

export const startReplaySession = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/start`);
  return data;
};

export const pauseReplaySession = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/pause`);
  return data;
};

export const resumeReplaySession = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/resume`);
  return data;
};

export const stopReplaySession = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/stop`);
  return data;
};

export const resetReplaySession = async (sessionId) => {
  const { data } = await api.post(`/api/replay/sessions/${sessionId}/reset`);
  return data;
};

export const deleteReplaySession = async (sessionId) => {
  await api.delete(`/api/replay/sessions/${sessionId}`);
};

// Controls API
export const updateReplaySpeed = async (sessionId, speed) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/speed?replaySpeed=${speed}`);
  return data;
};

export const nextReplayCandle = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/next`);
  return data;
};

export const prevReplayCandle = async (sessionId) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/previous`);
  return data;
};

export const jumpReplayToDate = async (sessionId, targetTime) => {
  const { data } = await api.put(`/api/replay/sessions/${sessionId}/jump/date?targetTime=${targetTime}`);
  return data;
};

// Virtual Trading API
export const placeReplayOrder = async (sessionId, payload) => {
  // payload: { symbol, quantity, orderType, price }
  const { data } = await api.post(`/api/replay/sessions/${sessionId}/orders`, payload);
  return data;
};

export const getReplayOrders = async (sessionId) => {
  const { data } = await api.get(`/api/replay/sessions/${sessionId}/orders`);
  return data;
};

// Portfolio & Wallet API
export const getReplayPortfolio = async (sessionId) => {
  const { data } = await api.get(`/api/replay/sessions/${sessionId}/portfolio`);
  return data;
};

export const getReplayWallet = async (sessionId) => {
  const { data } = await api.get(`/api/replay/sessions/${sessionId}/wallet`);
  return data;
};

// Analytics API
export const getReplayPerformance = async (sessionId) => {
  const { data } = await api.get(`/api/replay/sessions/${sessionId}/performance`);
  return data;
};
