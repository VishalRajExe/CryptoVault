package com.vishal.replay.repository;

import com.vishal.replay.model.ReplayOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing replay orders.
 */
@Repository
public interface ReplayOrderRepository extends JpaRepository<ReplayOrder, Long> {

    /**
     * Find all orders for a given session.
     *
     * @param sessionId The ID of the replay session
     * @return List of orders for the session
     */
    java.util.List<ReplayOrder> findByReplaySessionId(Long sessionId);

    /**
     * Find all open orders for a given session.
     * Open orders are those with status PENDING or PARTIALLY_FILLED.
     *
     * @param sessionId The ID of the replay session
     * @return List of open orders for the session
     */
    @Query("SELECT o FROM ReplayOrder o WHERE o.replaySession.id = :sessionId AND o.orderStatus IN ('PENDING', 'PARTIALLY_FILLED')")
    java.util.List<ReplayOrder> findOpenOrdersByReplaySessionId(@Param("sessionId") Long sessionId);
}