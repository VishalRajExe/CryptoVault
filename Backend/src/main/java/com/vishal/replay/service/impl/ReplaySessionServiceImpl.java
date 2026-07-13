package com.vishal.replay.service.impl;

import com.vishal.replay.model.ReplaySession;
import com.vishal.replay.repository.ReplaySessionRepository;
import com.vishal.replay.service.ReplaySessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * Implementation of ReplaySessionService.
 */
@Service
public class ReplaySessionServiceImpl implements ReplaySessionService {

    @Autowired
    private ReplaySessionRepository replaySessionRepository;

    @Autowired
    private com.vishal.replay.repository.ReplayPortfolioRepository replayPortfolioRepository;

    @Autowired
    private com.vishal.replay.repository.ReplayWalletRepository replayWalletRepository;

    @Autowired
    private com.vishal.replay.repository.ReplayOrderRepository replayOrderRepository;

    @Autowired
    private com.vishal.repository.CoinRepository coinRepository;

    @Autowired
    private com.vishal.replay.repository.ReplayTradeRepository replayTradeRepository;

    @Override
    public ReplaySession createSession(Long userId, String name, String description, String symbol, String timeframe, Long startTime, Long endTime, Double initialBalance, Double replaySpeed) {
        ReplaySession session = new ReplaySession();
        session.setUserId(userId);
        session.setName(name);
        session.setDescription(description);
        session.setSymbol(symbol);
        session.setTimeframe(timeframe);
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        // When creating a session, the current time is set to the start time (first candle)
        session.setCurrentTime(startTime);
        session.setReplaySpeed(replaySpeed);
        session.setReplayStatus(ReplaySession.ReplayStatus.CREATED);
        
        String quote = "USDT";
        if (symbol != null && symbol.contains("/")) {
            quote = symbol.substring(symbol.indexOf("/") + 1).toUpperCase();
        }
        session.setQuoteCurrency(quote);
        session.setInitialBalance(initialBalance);

        Long now = new Date().getTime();
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        
        ReplaySession savedSession = replaySessionRepository.save(session);

        // Initialize replay portfolio
        com.vishal.replay.model.ReplayPortfolio portfolio = new com.vishal.replay.model.ReplayPortfolio();
        portfolio.setReplaySession(savedSession);
        replayPortfolioRepository.save(portfolio);

        // Initialize replay wallet with initial balance
        com.vishal.replay.model.ReplayWallet wallet = new com.vishal.replay.model.ReplayWallet();
        wallet.setReplaySession(savedSession);
        wallet.setCurrency(quote);
        wallet.setBalance(initialBalance);
        wallet.setLockedBalance(0.0);
        wallet.setAveragePurchasePrice(1.0);
        replayWalletRepository.save(wallet);

        // Fetch historical candles from Binance for the session symbol and timeframe
        try {
            Long count = replayMarketDataRepository.countBySymbolAndIntervalAndOpenTimeBetween(symbol, timeframe, startTime, endTime);
            if (count == 0) {
                fetchAndSaveHistoricalData(symbol, timeframe, startTime, endTime);
            }
        } catch (Exception e) {
            System.err.println("Failed to seed market data: " + e.getMessage());
        }

        return savedSession;
    }

    @Override
    public ReplaySession getSessionById(Long sessionId, Long userId) {
        return replaySessionRepository.findByIdAndUserId(sessionId, userId);
    }

    @Override
    public java.util.List<ReplaySession> getSessionsByUserId(Long userId) {
        return replaySessionRepository.findByUserId(userId);
    }

    @Override
    public ReplaySession startSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            // Seed candles if missing (e.g., if session was created when fetching failed or before fetch logic was added)
            try {
                Long count = replayMarketDataRepository.countBySymbolAndIntervalAndOpenTimeBetween(
                        session.getSymbol(), session.getTimeframe(), session.getStartTime(), session.getEndTime());
                if (count == 0) {
                    fetchAndSaveHistoricalData(session.getSymbol(), session.getTimeframe(), session.getStartTime(), session.getEndTime());
                }
            } catch (Exception e) {
                System.err.println("Failed to seed market data on start: " + e.getMessage());
            }

            session.setReplayStatus(ReplaySession.ReplayStatus.PLAYING);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession pauseSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            session.setReplayStatus(ReplaySession.ReplayStatus.PAUSED);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession resumeSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            session.setReplayStatus(ReplaySession.ReplayStatus.PLAYING);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession stopSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            session.setReplayStatus(ReplaySession.ReplayStatus.STOPPED);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession resetSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            // Reset to initial state: current time set to start time, status to CREATED
            session.setCurrentTime(session.getStartTime());
            session.setReplayStatus(ReplaySession.ReplayStatus.CREATED);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteSession(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            // Delete portfolio
            try {
                com.vishal.replay.model.ReplayPortfolio portfolio = replayPortfolioRepository.findByReplaySessionId(sessionId);
                if (portfolio != null) {
                    replayPortfolioRepository.delete(portfolio);
                }
            } catch (Exception e) {
                System.err.println("Error deleting portfolio: " + e.getMessage());
            }

            // Delete wallets
            try {
                java.util.List<com.vishal.replay.model.ReplayWallet> wallets = replayWalletRepository.findByReplaySession_Id(sessionId);
                if (wallets != null && !wallets.isEmpty()) {
                    replayWalletRepository.deleteAll(wallets);
                }
            } catch (Exception e) {
                System.err.println("Error deleting wallets: " + e.getMessage());
            }

            // Delete orders
            try {
                java.util.List<com.vishal.replay.model.ReplayOrder> orders = replayOrderRepository.findByReplaySessionId(sessionId);
                if (orders != null && !orders.isEmpty()) {
                    replayOrderRepository.deleteAll(orders);
                }
            } catch (Exception e) {
                System.err.println("Error deleting orders: " + e.getMessage());
            }

            // Delete trades
            try {
                java.util.List<com.vishal.replay.model.ReplayTrade> trades = replayTradeRepository.findByReplaySessionIdOrderByExitTimeAsc(sessionId);
                if (trades != null && !trades.isEmpty()) {
                    replayTradeRepository.deleteAll(trades);
                }
            } catch (Exception e) {
                System.err.println("Error deleting trades: " + e.getMessage());
            }

            // Finally delete session itself
            replaySessionRepository.delete(session);
        }
    }

    @Override
    public ReplaySession updateReplaySpeed(Long sessionId, Long userId, Double replaySpeed) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            session.setReplaySpeed(replaySpeed);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    // Helper method to convert timeframe string to milliseconds
    private long getIntervalDurationInMillis(String timeframe) {
        if (timeframe == null || timeframe.isEmpty()) {
            return 0;
        }
        // Remove any whitespace
        timeframe = timeframe.trim().toLowerCase();
        // Extract the numeric part and the unit
        String unit = timeframe.replaceAll("[0-9]", "");
        String valueStr = timeframe.replaceAll("[^0-9]", "");
        long value = Long.parseLong(valueStr);
        switch (unit) {
            case "m": // minutes
                return value * 60 * 1000;
            case "h": // hours
                return value * 60 * 60 * 1000;
            case "d": // days
                return value * 24 * 60 * 60 * 1000;
            case "w": // weeks
                return value * 7 * 24 * 60 * 60 * 1000;
            case "M": // months (approx 30 days)
                return value * 30 * 24 * 60 * 60 * 1000;
            default:
                // Default to 1 minute if unknown
                return 60 * 1000;
        }
    }

    @Override
    public ReplaySession jumpToDate(Long sessionId, Long userId, Long targetTime) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long startTime = session.getStartTime();
            long endTime = session.getEndTime();
            // Clamp the target time to the session bounds
            long clampedTime = Math.max(startTime, Math.min(targetTime, endTime));
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession jumpToCandle(Long sessionId, Long userId, int candleIndex) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long startTime = session.getStartTime();
            long endTime = session.getEndTime();
            long intervalDuration = getIntervalDurationInMillis(session.getTimeframe());
            if (intervalDuration <= 0) {
                // Avoid division by zero or negative interval
                return session;
            }
            long targetTime = startTime + (candleIndex * intervalDuration);
            // Clamp to session bounds
            long clampedTime = Math.max(startTime, Math.min(targetTime, endTime));
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession previousCandle(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long currentTime = session.getCurrentTime();
            long startTime = session.getStartTime();
            long intervalDuration = getIntervalDurationInMillis(session.getTimeframe());
            if (intervalDuration <= 0) {
                return session;
            }
            long newTime = currentTime - intervalDuration;
            // Clamp to not go below startTime
            long clampedTime = Math.max(startTime, newTime);
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession nextCandle(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long currentTime = session.getCurrentTime();
            long endTime = session.getEndTime();
            long intervalDuration = getIntervalDurationInMillis(session.getTimeframe());
            if (intervalDuration <= 0) {
                return session;
            }
            long newTime = currentTime + intervalDuration;
            // Clamp to not go above endTime
            long clampedTime = Math.min(endTime, newTime);
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession restartReplay(Long sessionId, Long userId) {
        return resetSession(sessionId, userId);
    }

    @Override
    public ReplaySession skipForward(Long sessionId, Long userId, int skipCount) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long currentTime = session.getCurrentTime();
            long endTime = session.getEndTime();
            long intervalDuration = getIntervalDurationInMillis(session.getTimeframe());
            if (intervalDuration <= 0) {
                return session;
            }
            long newTime = currentTime + (skipCount * intervalDuration);
            // Clamp to not go above endTime
            long clampedTime = Math.min(endTime, newTime);
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Override
    public ReplaySession skipBackward(Long sessionId, Long userId, int skipCount) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            long currentTime = session.getCurrentTime();
            long startTime = session.getStartTime();
            long intervalDuration = getIntervalDurationInMillis(session.getTimeframe());
            if (intervalDuration <= 0) {
                return session;
            }
            long newTime = currentTime - (skipCount * intervalDuration);
            // Clamp to not go below startTime
            long clampedTime = Math.max(startTime, newTime);
            session.setCurrentTime(clampedTime);
            session.setUpdatedAt(new Date().getTime());
            return replaySessionRepository.save(session);
        }
        return null;
    }

    @Autowired
    private com.vishal.replay.repository.ReplayMarketDataRepository replayMarketDataRepository;

    private String normalizeSymbolForBinance(String symbol) {
        if (symbol == null || symbol.isEmpty()) {
            return "BTCUSDT";
        }
        String clean = symbol.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (clean.endsWith("USDT")) {
            return clean;
        }
        return clean + "USDT";
    }

    private void fetchAndSaveHistoricalData(String symbol, String timeframe, Long startTime, Long endTime) {
        String binanceSymbol = normalizeSymbolForBinance(symbol);
        String binanceInterval = timeframe;
        
        // Fetch up to 1000 candles starting from startTime
        String url = String.format("https://api.binance.com/api/v3/klines?symbol=%s&interval=%s&startTime=%d&limit=1000",
                binanceSymbol, binanceInterval, startTime);
        
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        try {
            // Find all existing openTimes for this range to prevent duplicate key errors
            org.springframework.data.domain.Page<com.vishal.replay.model.ReplayMarketData> existingPage = replayMarketDataRepository.findBySymbolAndIntervalAndOpenTimeBetweenOrderByOpenTimeAsc(
                    symbol, timeframe, startTime, endTime, org.springframework.data.domain.PageRequest.of(0, 10000));
            java.util.Set<Long> existingOpenTimes = new java.util.HashSet<>();
            if (existingPage != null) {
                for (com.vishal.replay.model.ReplayMarketData d : existingPage.getContent()) {
                    existingOpenTimes.add(d.getOpenTime());
                }
            }
            java.util.Set<Long> addedOpenTimes = new java.util.HashSet<>();

            org.springframework.http.ResponseEntity<Object[][]> response = restTemplate.getForEntity(url, Object[][].class);
            Object[][] data = response.getBody();
            if (data != null) {
                java.util.List<com.vishal.replay.model.ReplayMarketData> marketDataList = new java.util.ArrayList<>();
                for (Object[] kline : data) {
                    Long openTime = ((Number) kline[0]).longValue();
                    if (endTime != null && openTime > endTime) {
                        break;
                    }
                    if (existingOpenTimes.contains(openTime) || addedOpenTimes.contains(openTime)) {
                        continue; // Skip duplicates
                    }
                    addedOpenTimes.add(openTime);
                    
                    Double openPrice = Double.parseDouble(kline[1].toString());
                    Double highPrice = Double.parseDouble(kline[2].toString());
                    Double lowPrice = Double.parseDouble(kline[3].toString());
                    Double closePrice = Double.parseDouble(kline[4].toString());
                    Double volume = Double.parseDouble(kline[5].toString());
                    Long closeTime = ((Number) kline[6]).longValue();
                    
                    com.vishal.replay.model.ReplayMarketData marketData = new com.vishal.replay.model.ReplayMarketData();
                    marketData.setSymbol(symbol);
                    marketData.setInterval(timeframe);
                    marketData.setOpenTime(openTime);
                    marketData.setCloseTime(closeTime);
                    marketData.setOpenPrice(openPrice);
                    marketData.setHighPrice(highPrice);
                    marketData.setLowPrice(lowPrice);
                    marketData.setClosePrice(closePrice);
                    marketData.setVolume(volume);
                    
                    marketDataList.add(marketData);
                }
                if (!marketDataList.isEmpty()) {
                    replayMarketDataRepository.saveAll(marketDataList);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch historical klines from Binance: " + e.getMessage() + ". Generating synthetic candles fallback.");
            try {
                generateSyntheticCandles(symbol, timeframe, startTime, endTime);
            } catch (Exception ex) {
                System.err.println("Failed to generate synthetic candles fallback: " + ex.getMessage());
            }
        }
    }

    private void generateSyntheticCandles(String symbol, String timeframe, Long startTime, Long endTime) {
        long intervalDuration = getIntervalDurationInMillis(timeframe);
        if (intervalDuration <= 0) {
            intervalDuration = 15 * 60 * 1000; // Default to 15m
        }
        
        long count = 200; // Generate 200 realistic candles for replay
        double startPrice = 1.0;
        if (symbol.toUpperCase().startsWith("BTC")) {
            startPrice = 60000.0;
        } else if (symbol.toUpperCase().startsWith("ETH")) {
            startPrice = 3000.0;
        } else if (symbol.toUpperCase().startsWith("SOL")) {
            startPrice = 100.0;
        } else if (symbol.toUpperCase().startsWith("BNB")) {
            startPrice = 500.0;
        } else if (symbol.toUpperCase().startsWith("XRP")) {
            startPrice = 1.0;
        } else if (symbol.toUpperCase().startsWith("ADA")) {
            startPrice = 0.5;
        } else if (symbol.toUpperCase().startsWith("DOGE")) {
            startPrice = 0.1;
        }
        
        // Find existing to avoid database unique constraint violations
        org.springframework.data.domain.Page<com.vishal.replay.model.ReplayMarketData> existingPage = replayMarketDataRepository.findBySymbolAndIntervalAndOpenTimeBetweenOrderByOpenTimeAsc(
                symbol, timeframe, startTime, endTime, org.springframework.data.domain.PageRequest.of(0, 10000));
        java.util.Set<Long> existingOpenTimes = new java.util.HashSet<>();
        if (existingPage != null) {
            for (com.vishal.replay.model.ReplayMarketData d : existingPage.getContent()) {
                existingOpenTimes.add(d.getOpenTime());
            }
        }
        
        java.util.List<com.vishal.replay.model.ReplayMarketData> marketDataList = new java.util.ArrayList<>();
        double currentPrice = startPrice;
        long time = startTime;
        
        for (int i = 0; i < count; i++) {
            if (endTime != null && time > endTime) {
                break;
            }
            if (existingOpenTimes.contains(time)) {
                time += intervalDuration;
                continue;
            }
            
            double changePercent = (Math.random() - 0.5) * 0.015; // Max 0.75% change per candle
            double open = currentPrice;
            double close = currentPrice * (1 + changePercent);
            double high = Math.max(open, close) * (1 + Math.random() * 0.003);
            double low = Math.min(open, close) * (1 - Math.random() * 0.003);
            double volume = 50000.0 + Math.random() * 500000.0;
            
            com.vishal.replay.model.ReplayMarketData marketData = new com.vishal.replay.model.ReplayMarketData();
            marketData.setSymbol(symbol);
            marketData.setInterval(timeframe);
            marketData.setOpenTime(time);
            marketData.setCloseTime(time + intervalDuration - 1);
            marketData.setOpenPrice(open);
            marketData.setHighPrice(high);
            marketData.setLowPrice(low);
            marketData.setClosePrice(close);
            marketData.setVolume(volume);
            
            marketDataList.add(marketData);
            
            currentPrice = close;
            time += intervalDuration;
        }
        
        if (!marketDataList.isEmpty()) {
            replayMarketDataRepository.saveAll(marketDataList);
        }
    }

    public Double getReplayCurrentPrice(ReplaySession session) {
        com.vishal.replay.model.ReplayMarketData latest = replayMarketDataRepository.findTopBySymbolAndIntervalAndOpenTimeLessThanOrderByOpenTimeDesc(
                session.getSymbol(), session.getTimeframe(), session.getCurrentTime() + 1);
        if (latest != null) {
            return latest.getClosePrice();
        }
        return 0.0;
    }

    private com.vishal.model.Coin findCoinBySymbol(String symbol) {
        if (symbol == null) return null;
        String clean = symbol.toLowerCase().replaceAll("[^a-z0-9]", "");
        for (com.vishal.model.Coin c : coinRepository.findAll()) {
            if (c.getSymbol().equalsIgnoreCase(clean) || c.getId().equalsIgnoreCase(clean)) {
                return c;
            }
        }
        return null;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public com.vishal.replay.model.ReplayOrder placeOrder(Long sessionId, Long userId, String symbol, Double quantity, String orderSideStr, Double price) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found");
        }
        if (session.getReplayStatus() == ReplaySession.ReplayStatus.STOPPED) {
            throw new IllegalArgumentException("Session is stopped");
        }

        String baseCurrency = "BTC";
        String quoteCurrency = "USDT";
        if (symbol.contains("/")) {
            String[] parts = symbol.toUpperCase().split("/");
            baseCurrency = parts[0];
            quoteCurrency = parts[1];
        } else {
            baseCurrency = symbol.toUpperCase();
            quoteCurrency = session.getQuoteCurrency();
        }

        com.vishal.replay.model.ReplayOrder.ReplayOrderSide side = com.vishal.replay.model.ReplayOrder.ReplayOrderSide.valueOf(orderSideStr.toUpperCase());
        Double totalCost = quantity * price;

        com.vishal.replay.model.ReplayWallet quoteWallet = replayWalletRepository.findByReplaySession_IdAndCurrency(sessionId, quoteCurrency);
        com.vishal.replay.model.ReplayWallet baseWallet = replayWalletRepository.findByReplaySession_IdAndCurrency(sessionId, baseCurrency);

        if (side == com.vishal.replay.model.ReplayOrder.ReplayOrderSide.BUY) {
            if (quoteWallet == null || quoteWallet.getBalance() < totalCost) {
                throw new IllegalArgumentException("Insufficient balance in quote currency: " + quoteCurrency);
            }
            quoteWallet.setBalance(quoteWallet.getBalance() - totalCost);
            replayWalletRepository.save(quoteWallet);

            if (baseWallet == null) {
                baseWallet = new com.vishal.replay.model.ReplayWallet();
                baseWallet.setReplaySession(session);
                baseWallet.setCurrency(baseCurrency);
                baseWallet.setBalance(0.0);
                baseWallet.setLockedBalance(0.0);
                baseWallet.setAveragePurchasePrice(price);
            }
            Double newAvg = ((baseWallet.getBalance() * baseWallet.getAveragePurchasePrice()) + totalCost) / (baseWallet.getBalance() + quantity);
            baseWallet.setBalance(baseWallet.getBalance() + quantity);
            baseWallet.setAveragePurchasePrice(newAvg);
            replayWalletRepository.save(baseWallet);
        } else {
            if (baseWallet == null || baseWallet.getBalance() < quantity) {
                throw new IllegalArgumentException("Insufficient balance in base currency: " + baseCurrency);
            }
            Double entryPrice = baseWallet.getAveragePurchasePrice() != null ? baseWallet.getAveragePurchasePrice() : price;
            baseWallet.setBalance(baseWallet.getBalance() - quantity);
            replayWalletRepository.save(baseWallet);

            if (quoteWallet == null) {
                quoteWallet = new com.vishal.replay.model.ReplayWallet();
                quoteWallet.setReplaySession(session);
                quoteWallet.setCurrency(quoteCurrency);
                quoteWallet.setBalance(0.0);
                quoteWallet.setLockedBalance(0.0);
                quoteWallet.setAveragePurchasePrice(1.0);
            }
            quoteWallet.setBalance(quoteWallet.getBalance() + totalCost);
            replayWalletRepository.save(quoteWallet);

            // Record completed trade for performance analytics
            try {
                com.vishal.replay.model.ReplayTrade trade = new com.vishal.replay.model.ReplayTrade();
                trade.setReplaySession(session);
                trade.setSymbol(symbol);
                trade.setEntryTime(session.getStartTime());
                trade.setExitTime(session.getCurrentTime());
                trade.setEntryPrice(entryPrice);
                trade.setExitPrice(price);
                trade.setQuantity(quantity);
                trade.setPnl(totalCost - (quantity * entryPrice));
                trade.setCommission(0.0);
                replayTradeRepository.save(trade);
            } catch (Exception e) {
                System.err.println("Failed to record replay trade: " + e.getMessage());
            }
        }

        com.vishal.replay.model.ReplayOrder order = new com.vishal.replay.model.ReplayOrder();
        order.setReplaySession(session);
        order.setUserId(userId);
        order.setSymbol(symbol);
        order.setOrderSide(side);
        order.setOrderType(com.vishal.replay.domain.ReplayOrderType.MARKET);
        order.setPrice(price);
        order.setQuantity(quantity);
        order.setFilledQuantity(quantity);
        order.setAveragePrice(price);
        order.setOrderStatus(com.vishal.replay.model.ReplayOrder.ReplayOrderStatus.FILLED);
        
        Long now = new java.util.Date().getTime();
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        return replayOrderRepository.save(order);
    }

    @Override
    public java.util.List<com.vishal.replay.model.ReplayOrder> getOrders(Long sessionId, Long userId) {
        return replayOrderRepository.findByReplaySessionId(sessionId);
    }

    @Override
    public com.vishal.replay.model.ReplayWallet getWallet(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        if (session != null) {
            return replayWalletRepository.findByReplaySession_IdAndCurrency(sessionId, session.getQuoteCurrency());
        }
        return null;
    }

    @Override
    public java.util.List<java.util.Map<String, Object>> getPortfolio(Long sessionId, Long userId) {
        ReplaySession session = replaySessionRepository.findByIdAndUserId(sessionId, userId);
        java.util.List<java.util.Map<String, Object>> holdings = new java.util.ArrayList<>();
        if (session == null) {
            return holdings;
        }

        java.util.List<com.vishal.replay.model.ReplayWallet> wallets = replayWalletRepository.findByReplaySession_Id(sessionId);
        Double currentPrice = getReplayCurrentPrice(session);

        for (com.vishal.replay.model.ReplayWallet wallet : wallets) {
            if (wallet.getCurrency().equalsIgnoreCase(session.getQuoteCurrency())) {
                continue;
            }
            if (wallet.getBalance() <= 0) {
                continue;
            }

            java.util.Map<String, Object> holding = new java.util.HashMap<>();
            holding.put("id", wallet.getId());
            holding.put("quantity", wallet.getBalance());
            holding.put("buyPrice", wallet.getAveragePurchasePrice());

            java.util.Map<String, Object> coin = new java.util.HashMap<>();
            coin.put("symbol", wallet.getCurrency());
            
            com.vishal.model.Coin dbCoin = findCoinBySymbol(wallet.getCurrency());
            if (dbCoin != null) {
                coin.put("name", dbCoin.getName());
                coin.put("image", dbCoin.getImage());
            } else {
                coin.put("name", wallet.getCurrency() + " Coin");
                coin.put("image", "https://assets.coingecko.com/coins/images/1/large/bitcoin.png");
            }
            coin.put("currentPrice", currentPrice > 0 ? currentPrice : wallet.getAveragePurchasePrice());

            holding.put("coin", coin);
            holdings.add(holding);
        }
        return holdings;
    }
}