package com.vishal.replay.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entity representing a completed trade in a replay session.
 * A trade is a round trip (e.g., buy then sell) for a given symbol.
 */
@Entity
@Table(name = "replay_trades")
public class ReplayTrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The replay session this trade belongs to */
    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private ReplaySession replaySession;

    /** Trading symbol (e.g., BTC, ETH) */
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    /** Entry time of the trade in milliseconds since epoch */
    @Column(name = "entry_time", nullable = false)
    private Long entryTime;

    /** Exit time of the trade in milliseconds since epoch */
    @Column(name = "exit_time", nullable = false)
    private Long exitTime;

    /** Entry price */
    @Column(name = "entry_price", nullable = false)
    private Double entryPrice;

    /** Exit price */
    @Column(name = "exit_price", nullable = false)
    private Double exitPrice;

    /** Quantity traded */
    @Column(name = "quantity", nullable = false)
    private Double quantity;

    /** Profit and loss in quote currency (e.g., USD) */
    @Column(name = "pnl", nullable = false)
    private Double pnl;

    /** Commission paid (optional) */
    @Column(name = "commission")
    private Double commission;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ReplaySession getReplaySession() {
        return replaySession;
    }

    public void setReplaySession(ReplaySession replaySession) {
        this.replaySession = replaySession;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Long getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(Long entryTime) {
        this.entryTime = entryTime;
    }

    public Long getExitTime() {
        return exitTime;
    }

    public void setExitTime(Long exitTime) {
        this.exitTime = exitTime;
    }

    public Double getEntryPrice() {
        return entryPrice;
    }

    public void setEntryPrice(Double entryPrice) {
        this.entryPrice = entryPrice;
    }

    public Double getExitPrice() {
        return exitPrice;
    }

    public void setExitPrice(Double exitPrice) {
        this.exitPrice = exitPrice;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getPnl() {
        return pnl;
    }

    public void setPnl(Double pnl) {
        this.pnl = pnl;
    }

    public Double getCommission() {
        return commission;
    }

    public void setCommission(Double commission) {
        this.commission = commission;
    }
}