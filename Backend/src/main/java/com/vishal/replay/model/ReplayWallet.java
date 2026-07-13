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
 * Entity representing a replay wallet for storing virtual currency balances in a replay session.
 * Includes average purchase price for calculating unrealized PnL.
 */
@Entity
@Table(name = "replay_wallets")
public class ReplayWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Many wallets belong to one replay session */
    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private ReplaySession replaySession;

    /** Currency code (e.g., USD, BTC, ETH) */
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    /** Available balance (amount of currency) */
    @Column(name = "balance", nullable = false)
    private Double balance;

    /** Average purchase price of the currency in the quote currency (e.g., USD per BTC) */
    @Column(name = "average_purchase_price", nullable = false)
    private Double averagePurchasePrice;

    /** Locked balance (in open orders) */
    @Column(name = "locked_balance", nullable = false)
    private Double lockedBalance;

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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public Double getAveragePurchasePrice() {
        return averagePurchasePrice;
    }

    public void setAveragePurchasePrice(Double averagePurchasePrice) {
        this.averagePurchasePrice = averagePurchasePrice;
    }

    public Double getLockedBalance() {
        return lockedBalance;
    }

    public void setLockedBalance(Double lockedBalance) {
        this.lockedBalance = lockedBalance;
    }

    /**
     * Calculate the total cost in quote currency for the current balance.
     * @return balance * averagePurchasePrice
     */
    public Double getTotalCost() {
        return balance * averagePurchasePrice;
    }

    /**
     * Calculate the current value in quote currency given the current market price.
     * @param currentPrice current market price of the currency in quote currency
     * @return balance * currentPrice
     */
    public Double getCurrentValue(Double currentPrice) {
        return balance * currentPrice;
    }

    /**
     * Calculate the unrealized profit/loss in quote currency.
     * @param currentPrice current market price of the currency in quote currency
     * @return balance * (currentPrice - averagePurchasePrice)
     */
    public Double getUnrealizedPnl(Double currentPrice) {
        return balance * (currentPrice - averagePurchasePrice);
    }
}