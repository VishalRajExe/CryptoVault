package com.vishal.replay.service.impl;

import com.vishal.replay.dto.ReplayPerformanceAnalyticsDTO;
import com.vishal.replay.model.ReplaySession;
import com.vishal.replay.model.ReplayTrade;
import com.vishal.replay.repository.ReplaySessionRepository;
import com.vishal.replay.repository.ReplayTradeRepository;
import com.vishal.replay.service.ReplayPerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Implementation of ReplayPerformanceService.
 */
@Service
public class ReplayPerformanceServiceImpl implements ReplayPerformanceService {

    @Autowired
    private ReplayTradeRepository replayTradeRepository;

    @Autowired
    private ReplaySessionRepository replaySessionRepository;

    @Override
    public ReplayPerformanceAnalyticsDTO calculatePerformance(Long sessionId) {
        // Retrieve the session to get initial balance and start time
        ReplaySession session = replaySessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            // Return empty/default analytics if session not found
            return new ReplayPerformanceAnalyticsDTO();
        }

        double initialBalance = session.getInitialBalance() != null ? session.getInitialBalance() : 0.0;
        long startTime = session.getStartTime() != null ? session.getStartTime() : 0L;

        // Retrieve all trades for the session, ordered by exit time ascending
        List<ReplayTrade> trades = replayTradeRepository.findByReplaySessionIdOrderByExitTimeAsc(sessionId);

        // If no trades, return zero/empty analytics
        if (trades == null || trades.isEmpty()) {
            List<ReplayPerformanceAnalyticsDTO.EquityPoint> equityCurve = new ArrayList<>();
            equityCurve.add(new ReplayPerformanceAnalyticsDTO.EquityPoint(startTime, initialBalance));
            return new ReplayPerformanceAnalyticsDTO(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, equityCurve);
        }

        // Separate winning and losing trades
        List<ReplayTrade> winningTrades = new ArrayList<>();
        List<ReplayTrade> losingTrades = new ArrayList<>();
        double totalProfit = 0.0;
        double totalLoss = 0.0; // will be positive number (absolute value)

        for (ReplayTrade trade : trades) {
            double pnl = trade.getPnl() != null ? trade.getPnl() : 0.0;
            if (pnl > 0) {
                winningTrades.add(trade);
                totalProfit += pnl;
            } else if (pnl < 0) {
                losingTrades.add(trade);
                totalLoss += Math.abs(pnl); // accumulate absolute loss
            }
            // pnl == 0: ignore for profit/loss sums
        }

        int totalTrades = trades.size();
        int winCount = winningTrades.size();
        int lossCount = losingTrades.size();

        double winRate = (totalTrades > 0) ? ((double) winCount / totalTrades) * 100.0 : 0.0;
        double lossRate = (totalTrades > 0) ? ((double) lossCount / totalTrades) * 100.0 : 0.0;

        double profitFactor = (totalLoss > 0) ? (totalProfit / totalLoss) : 0.0;

        double averageWin = (winCount > 0) ? (totalProfit / winCount) : 0.0;
        double averageLoss = (lossCount > 0) ? (totalLoss / lossCount) : 0.0;
        double averageRiskReward = (averageLoss > 0) ? (averageWin / averageLoss) : 0.0;

        double largestWin = winningTrades.stream()
                .mapToDouble(t -> t.getPnl() != null ? t.getPnl() : 0.0)
                .max()
                .orElse(0.0);

        double largestLoss = losingTrades.stream()
                .mapToDouble(t -> t.getPnl() != null ? t.getPnl() : 0.0)
                .min()
                .orElse(0.0); // most negative

        // Calculate ROI: (final equity - initial balance) / initial balance * 100%
        double finalEquity = initialBalance;
        for (ReplayTrade trade : trades) {
            finalEquity += (trade.getPnl() != null ? trade.getPnl() : 0.0);
        }
        double roi = (initialBalance > 0) ? ((finalEquity - initialBalance) / initialBalance) * 100.0 : 0.0;

        // Calculate equity curve and max drawdown
        List<ReplayPerformanceAnalyticsDTO.EquityPoint> equityCurve = new ArrayList<>();
        double runningEquity = initialBalance;
        double peakEquity = initialBalance;
        double maxDrawdown = 0.0;

        // Starting point
        equityCurve.add(new ReplayPerformanceAnalyticsDTO.EquityPoint(startTime, runningEquity));

        for (ReplayTrade trade : trades) {
            double pnl = trade.getPnl() != null ? trade.getPnl() : 0.0;
            long exitTime = trade.getExitTime() != null ? trade.getExitTime() : 0L;
            runningEquity += pnl;
            equityCurve.add(new ReplayPerformanceAnalyticsDTO.EquityPoint(exitTime, runningEquity));

            // Update peak equity
            if (runningEquity > peakEquity) {
                peakEquity = runningEquity;
            }

            // Calculate drawdown from peak
            double drawdown = (peakEquity - runningEquity) / peakEquity * 100.0;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Sort equity curve by timestamp (should already be sorted by trade exit time, but ensure)
        Collections.sort(equityCurve, Comparator.comparingLong(ReplayPerformanceAnalyticsDTO.EquityPoint::getTimestamp));

        return new ReplayPerformanceAnalyticsDTO(
                winRate,
                lossRate,
                roi,
                profitFactor,
                averageRiskReward,
                largestWin,
                Math.abs(largestLoss), // store as positive magnitude
                maxDrawdown,
                totalTrades,
                equityCurve
        );
    }
}