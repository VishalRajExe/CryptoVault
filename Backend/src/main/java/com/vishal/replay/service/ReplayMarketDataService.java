package com.vishal.replay.service;

import com.vishal.replay.model.ReplayMarketData;
import java.util.List;

/**
 * Service for accessing historical market data for market replay.
 */
public interface ReplayMarketDataService {

    /**
     * Get historical market data (OHLCV) for a symbol and interval within a time range.
     *
     * @param symbol Trading symbol (e.g., BTC, ETH)
     * @param interval Candle interval (e.g., 1m, 5m, 1h, 1d)
     * @param startTime Start time in milliseconds since epoch
     * @param endTime End time in milliseconds since epoch
     * @param limit Maximum number of records to return
     * @param offset Number of records to skip
     * @return List of market data ordered by openTime ascending
     */
    List<ReplayMarketData> getMarketData(String symbol, String interval, Long startTime, Long endTime, Integer limit, Integer offset);

    /**
     * Count historical market data records for a symbol and interval within a time range.
     *
     * @param symbol Trading symbol
     * @param interval Candle interval
     * @param startTime Start time in milliseconds since epoch
     * @param endTime End time in milliseconds since epoch
     * @return Count of records
     */
    Long countMarketData(String symbol, String interval, Long startTime, Long endTime);

    /**
     * Get the latest market data for a symbol and interval before a given time.
     *
     * @param symbol Trading symbol
     * @param interval Candle interval
     * @param endTime End time in milliseconds since epoch
     * @return Latest market data record or null if not found
     */
    ReplayMarketData getLatestMarketData(String symbol, String interval, Long endTime);

    /**
     * Get distinct symbols available in the market data table.
     *
     * @return List of distinct symbols
     */
    List<String> getDistinctSymbols();
}