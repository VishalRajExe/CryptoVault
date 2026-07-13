package com.vishal.replay.repository;

import com.vishal.replay.model.ReplayPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing replay portfolios.
 */
@Repository
public interface ReplayPortfolioRepository extends JpaRepository<ReplayPortfolio, Long> {

    /**
     * Find a portfolio by its session ID.
     *
     * @param sessionId The ID of the replay session
     * @return The replay portfolio if found, null otherwise
     */
    ReplayPortfolio findByReplaySessionId(Long sessionId);
}