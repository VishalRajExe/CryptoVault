package com.vishal.replay.repository;

import com.vishal.replay.model.ReplayMarketData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for accessing historical market data for market replay.
 */
@Repository
public interface ReplayMarketDataRepository extends org.springframework.data.jpa.repository.JpaRepository<ReplayMarketData, Long> {

    /**
     * Find market data by symbol and interval within a time range with pagination.
     *
     * @param symbol Trading symbol (e.g., BTC, ETH)
     * @param interval Candle interval (e.g., 1m, 5m, etc.)
     * @param startTime Start time in milliseconds since epoch
     * @param endTime End time in milliseconds since epoch
     * @param pageable Pagination and sorting information
     * @return Page of market data ordered by openTime ascending
     */
    Page<ReplayMarketData> findBySymbolAndIntervalAndOpenTimeBetweenOrderByOpenTimeAsc(
            String symbol, String interval, Long startTime, Long endTime, Pageable pageable);

    /**
     * Count market data records for symbol and interval within a time range.
     *
     * @param symbol Trading symbol
     * @param interval Candle interval
     * @param startTime Start time in milliseconds
     * @param endTime End time in milliseconds
     * @return Count of records
     */
    Long countBySymbolAndIntervalAndOpenTimeBetween(String symbol, String interval, Long startTime, Long endTime);

    /**
     * Find the latest market data for a symbol and interval before a given time.
     *
     * @param symbol Trading symbol
     * @param interval Candle interval
     * @param endTime End time in milliseconds
     * @return Latest market data record or null if not found
     */
    ReplayMarketData findTopBySymbolAndIntervalAndOpenTimeLessThanOrderByOpenTimeDesc(
            String symbol, String interval, Long endTime);

    /**
     * Get distinct symbols from the market data table.
     *
     * @return List of distinct symbols
     */
    @Query("SELECT DISTINCT r.symbol FROM ReplayMarketData r")
    List<String> findDistinctSymbol();
}