package com.vishal.replay.dto;

import java.util.List;

/**
 * Data Transfer Object for replay performance analytics.
 */
public class ReplayPerformanceAnalyticsDTO {

    private double winRate;            // percentage
    private double lossRate;           // percentage
    private double roi;                // percentage
    private double profitFactor;
    private double averageRiskReward;
    private double largestWin;
    private double largestLoss;
    private double maxDrawdown;        // percentage
    private int totalTrades;
    private List<EquityPoint> equityCurve; // List of (timestamp, equity) points

    // Constructors, getters, setters

    public ReplayPerformanceAnalyticsDTO() {
    }

    public ReplayPerformanceAnalyticsDTO(double winRate, double lossRate, double roi, double profitFactor,
                                         double averageRiskReward, double largestWin, double largestLoss,
                                         double maxDrawdown, int totalTrades, List<EquityPoint> equityCurve) {
        this.winRate = winRate;
        this.lossRate = lossRate;
        this.roi = roi;
        this.profitFactor = profitFactor;
        this.averageRiskReward = averageRiskReward;
        this.largestWin = largestWin;
        this.largestLoss = largestLoss;
        this.maxDrawdown = maxDrawdown;
        this.totalTrades = totalTrades;
        this.equityCurve = equityCurve;
    }

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
    }

    public double getLossRate() {
        return lossRate;
    }

    public void setLossRate(double lossRate) {
        this.lossRate = lossRate;
    }

    public double getRoi() {
        return roi;
    }

    public void setRoi(double roi) {
        this.roi = roi;
    }

    public double getProfitFactor() {
        return profitFactor;
    }

    public void setProfitFactor(double profitFactor) {
        this.profitFactor = profitFactor;
    }

    public double getAverageRiskReward() {
        return averageRiskReward;
    }

    public void setAverageRiskReward(double averageRiskReward) {
        this.averageRiskReward = averageRiskReward;
    }

    public double getLargestWin() {
        return largestWin;
    }

    public void setLargestWin(double largestWin) {
        this.largestWin = largestWin;
    }

    public double getLargestLoss() {
        return largestLoss;
    }

    public void setLargestLoss(double largestLoss) {
        this.largestLoss = largestLoss;
    }

    public double getMaxDrawdown() {
        return maxDrawdown;
    }

    public void setMaxDrawdown(double maxDrawdown) {
        this.maxDrawdown = maxDrawdown;
    }

    public int getTotalTrades() {
        return totalTrades;
    }

    public void setTotalTrades(int totalTrades) {
        this.totalTrades = totalTrades;
    }

    public List<EquityPoint> getEquityCurve() {
        return equityCurve;
    }

    public void setEquityCurve(List<EquityPoint> equityCurve) {
        this.equityCurve = equityCurve;
    }

    /**
     * Inner class representing a point in the equity curve.
     */
    public static class EquityPoint {
        private long timestamp;
        private double equity;

        public EquityPoint() {
        }

        public EquityPoint(long timestamp, double equity) {
            this.timestamp = timestamp;
            this.equity = equity;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }

        public double getEquity() {
            return equity;
        }

        public void setEquity(double equity) {
            this.equity = equity;
        }
    }
}