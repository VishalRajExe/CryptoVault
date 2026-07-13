package com.vishal.replay.controller;

import com.vishal.replay.dto.ReplayKlineDTO;
import com.vishal.replay.model.ReplayMarketData;
import com.vishal.replay.service.ReplayMarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for retrieving historical market data for market replay.
 * Provides endpoints to get OHLCV candle data and available symbols for replay purposes.
 */
@RestController
@RequestMapping("/api/replay/m")
public class ReplayMarketDataController {

    @Autowired
    private ReplayMarketDataService replayMarketDataService;

    /**
     * Get available symbols for market replay.
     *
     * @return List of distinct symbols available in the market data table
     */
    @GetMapping("/symbols")
    public ResponseEntity<List<String>> getSymbols() {
        List<String> symbols = replayMarketDataService.getDistinctSymbols();
        return ResponseEntity.ok(symbols);
    }

    /**
     * Get historical candlestick (OHLCV) data for a symbol and interval.
     *
     * @param symbol Trading symbol (e.g., BTC, ETH)
     * @param interval Candle interval (e.g., 1m, 5m, 15m, 1h, 4h, 1d)
     * @param startTime Start time in milliseconds since epoch (optional)
     * @param endTime End time in milliseconds since epoch (optional)
     * @param limit Maximum number of candles to return (optional, default 500)
     * @param offset Number of candles to skip (optional, default 0)
     * @return List of candlestick data ordered by open time ascending
     */
    @GetMapping("/{symbol}/klines")
    public ResponseEntity<List<ReplayKlineDTO>> getKlines(
            @PathVariable String symbol,
            @RequestParam String interval,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "500") Integer limit,
            @RequestParam(defaultValue = "0") Integer offset) {

        // Validate interval
        if (!isValidInterval(interval)) {
            return ResponseEntity.badRequest().build();
        }

        // If endTime is not provided, use current time
        if (endTime == null) {
            endTime = System.currentTimeMillis();
        }

        // If startTime is not provided, we rely on limit and offset from the endTime backwards?
        // But our service method uses absolute time range. We'll let the service handle the time range.
        // If startTime is not provided, we set it to 0 to get all data from the beginning?
        // However, that might be too much. Instead, we can set startTime to 0 and let limit/offset handle pagination from the start.
        // But note: the service method uses startTime and endTime as absolute boundaries.
        // We'll leave it as is: if startTime is null, we pass null to the service (which means no lower bound).
        // However, our repository method requires both startTime and endTime?
        // Looking at the repository method: findBySymbolAndIntervalAndOpenTimeBetweenOrderByOpenTimeAsc
        // It requires both startTime and endTime. So we must provide both.

        // If startTime is not provided, we cannot use the between query. We need to adjust.
        // Let's change the approach: if startTime is not provided, we set it to 0 (minimum possible time).
        // If endTime is not provided, we set it to Long.MAX_VALUE? But we already set endTime to current time if null.
        // Actually, we set endTime to current time above. So we only need to handle startTime.

        if (startTime == null) {
            startTime = 0L; // Assuming we want data from the beginning of time (or epoch)
        }

        // Convert symbol to uppercase as per our data storage convention
        String upperSymbol = symbol.toUpperCase();

        // Get market data from service
        List<ReplayMarketData> marketDataList = replayMarketDataService.getMarketData(
                upperSymbol,
                interval,
                startTime,
                endTime,
                limit,
                offset);

        // Convert entity list to DTO list
        List<ReplayKlineDTO> klines = marketDataList.stream()
                .map(data -> new ReplayKlineDTO(
                        data.getOpenTime(),
                        data.getOpenPrice(),
                        data.getHighPrice(),
                        data.getLowPrice(),
                        data.getClosePrice(),
                        data.getVolume()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(klines);
    }

    /**
     * Validate the interval string.
     * Supported intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
     * But for simplicity, we'll check against a set of allowed intervals.
     *
     * @param interval The interval string to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidInterval(String interval) {
        // We'll accept the same intervals as Binance for simplicity
        return switch (interval) {
            case "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M" -> true;
            default -> false;
        };
    }
}