package com.vishal.replay.repository;

import com.vishal.replay.model.ReplayWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing replay wallets.
 */
@Repository
public interface ReplayWalletRepository extends JpaRepository<ReplayWallet, Long> {

    /**
     * Find all wallets for a given replay session.
     *
     * @param sessionId The ID of the replay session
     * @return List of replay wallets for the session
     */
    java.util.List<ReplayWallet> findByReplaySession_Id(Long sessionId);

    /**
     * Find a wallet by session ID and currency.
     *
     * @param sessionId The ID of the replay session
     * @param currency  The currency code (e.g., USD, BTC)
     * @return The replay wallet if found, null otherwise
     */
    ReplayWallet findByReplaySession_IdAndCurrency(Long sessionId, String currency);
}