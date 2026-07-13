package com.vishal.replay.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entity representing historical market data (candlestick/klines) for market replay.
 */
@Entity
@Table(name = "replay_market_data")
public class ReplayMarketData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Trading symbol (e.g., BTC, ETH)
     */
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    /**
     * Candle interval (e.g., 1m, 5m, 1h, 1d)
     */
    @Column(name = "`interval`", nullable = false, length = 10)
    private String interval;

    /**
     * Open time in milliseconds since epoch
     */
    @Column(name = "open_time", nullable = false)
    private Long openTime;

    /**
     * Close time in milliseconds since epoch
     */
    @Column(name = "close_time", nullable = false)
    private Long closeTime;

    /**
     * Open price
     */
    @Column(name = "open_price", nullable = false)
    private Double openPrice;

    /**
     * High price
     */
    @Column(name = "high_price", nullable = false)
    private Double highPrice;

    /**
     * Low price
     */
    @Column(name = "low_price", nullable = false)
    private Double lowPrice;

    /**
     * Close price
     */
    @Column(name = "close_price", nullable = false)
    private Double closePrice;

    /**
     * Volume
     */
    @Column(name = "volume", nullable = false)
    private Double volume;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getInterval() {
        return interval;
    }

    public void setInterval(String interval) {
        this.interval = interval;
    }

    public Long getOpenTime() {
        return openTime;
    }

    public void setOpenTime(Long openTime) {
        this.openTime = openTime;
    }

    public Long getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(Long closeTime) {
        this.closeTime = closeTime;
    }

    public Double getOpenPrice() {
        return openPrice;
    }

    public void setOpenPrice(Double openPrice) {
        this.openPrice = openPrice;
    }

    public Double getHighPrice() {
        return highPrice;
    }

    public void setHighPrice(Double highPrice) {
        this.highPrice = highPrice;
    }

    public Double getLowPrice() {
        return lowPrice;
    }

    public void setLowPrice(Double lowPrice) {
        this.lowPrice = lowPrice;
    }

    public Double getClosePrice() {
        return closePrice;
    }

    public void setClosePrice(Double closePrice) {
        this.closePrice = closePrice;
    }

    public Double getVolume() {
        return volume;
    }

    public void setVolume(Double volume) {
        this.volume = volume;
    }
}