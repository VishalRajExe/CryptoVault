package com.vishal.replay.repository;

import com.vishal.replay.model.ReplaySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing replay sessions.
 */
@Repository
public interface ReplaySessionRepository extends JpaRepository<ReplaySession, Long> {

    /**
     * Find all replay sessions for a given user.
     *
     * @param userId The user ID
     * @return List of replay sessions for the user
     */
    java.util.List<ReplaySession> findByUserId(Long userId);

    /**
     * Find a replay session by its ID and user ID to ensure ownership.
     *
     * @param id The session ID
     * @param userId The user ID
     * @return The replay session if found and owned by the user, null otherwise
     */
    ReplaySession findByIdAndUserId(Long id, Long userId);
}