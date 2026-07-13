package com.vishal.replay.repository;

import com.vishal.replay.model.ReplayTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for accessing replay trades.
 */
@Repository
public interface ReplayTradeRepository extends JpaRepository<ReplayTrade, Long> {

    /**
     * Find all trades for a given replay session, ordered by exit time ascending.
     *
     * @param sessionId the ID of the replay session
     * @return list of trades for the session, ordered by exit time
     */
    java.util.List<ReplayTrade> findByReplaySessionIdOrderByExitTimeAsc(Long sessionId);
}