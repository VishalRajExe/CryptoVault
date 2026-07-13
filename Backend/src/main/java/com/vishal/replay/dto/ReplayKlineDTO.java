package com.vishal.replay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single candlestick (OHLCV) for market data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReplayKlineDTO {
    /** Open time of the candle (milliseconds since epoch) */
    private Long openTime;
    /** Open price */
    private Double openPrice;
    /** High price */
    private Double highPrice;
    /** Low price */
    private Double lowPrice;
    /** Close price */
    private Double closePrice;
    /** Trading volume */
    private Double volume;
}