import client from './client';

export const getCoinList = (page = 0) =>
  client.get('/coins', { params: { page } }).then((r) => r.data);

export const getMarketChart = (coinId, days = 7) =>
  client.get(`/coins/${coinId}/chart`, { params: { days } }).then((r) => r.data);

export const searchCoins = (q) =>
  client.get('/coins/search', { params: { q } }).then((r) => r.data);

export const getTop50 = () => client.get('/coins/top50').then((r) => r.data);

export const getTrendingCoins = () => client.get('/coins/trading').then((r) => r.data);

export const getCoinDetails = (coinId) =>
  client.get(`/coins/details/${coinId}`).then((r) => r.data);
