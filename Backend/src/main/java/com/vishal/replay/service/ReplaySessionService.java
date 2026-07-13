package com.vishal.replay.service;

import com.vishal.replay.model.ReplaySession;
import java.util.List;

/**
 * Service for managing replay sessions.
 */
public interface ReplaySessionService {

    /**
     * Create a new replay session.
     *
     * @param userId The ID of the user creating the session
     * @param name   The name of the session
     * @param description The description of the session
     * @param symbol The trading symbol
     * @param timeframe The timeframe
     * @param startTime The start time of the replay in milliseconds since epoch
     * @param endTime The end time of the replay in milliseconds since epoch
     * @param initialBalance The initial virtual balance for the session
     * @param replaySpeed The initial replay speed (e.g., 1.0 for 1x)
     * @return The created replay session
     */
    ReplaySession createSession(Long userId, String name, String description, String symbol, String timeframe, Long startTime, Long endTime, Double initialBalance, Double replaySpeed);

    /**
     * Get a replay session by its ID, ensuring it belongs to the user.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @return The replay session if found and owned by the user, null otherwise
     */
    ReplaySession getSessionById(Long sessionId, Long userId);

    /**
     * Get all replay sessions for a given user.
     *
     * @param userId The ID of the user
     * @return List of replay sessions for the user
     */
    java.util.List<ReplaySession> getSessionsByUserId(Long userId);

    /**
     * Start a replay session.
     *
     * @param sessionId The ID of the session to start
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession startSession(Long sessionId, Long userId);

    /**
     * Pause a replay session.
     *
     * @param sessionId The ID of the session to pause
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession pauseSession(Long sessionId, Long userId);

    /**
     * Resume a paused replay session.
     *
     * @param sessionId The ID of the session to resume
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession resumeSession(Long sessionId, Long userId);

    /**
     * Stop a replay session.
     *
     * @param sessionId The ID of the session to stop
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession stopSession(Long sessionId, Long userId);

    /**
     * Reset a replay session to its initial state.
     *
     * @param sessionId The ID of the session to reset
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession resetSession(Long sessionId, Long userId);

    /**
     * Delete a replay session.
     *
     * @param sessionId The ID of the session to delete
     * @param userId The ID of the user (for authorization)
     */
    void deleteSession(Long sessionId, Long userId);

    /**
     * Update the replay speed of a session.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @param replaySpeed The new replay speed
     * @return The updated replay session
     */
    ReplaySession updateReplaySpeed(Long sessionId, Long userId, Double replaySpeed);

    /**
     * Jump to a specific date/time in the replay.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @param targetTime The target time in milliseconds since epoch
     * @return The updated replay session
     */
    ReplaySession jumpToDate(Long sessionId, Long userId, Long targetTime);

    /**
     * Jump to a specific candle index in the replay.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @param candleIndex The zero-based index of the candle to jump to
     * @return The updated replay session
     */
    ReplaySession jumpToCandle(Long sessionId, Long userId, int candleIndex);

    /**
     * Move to the previous candle in the replay.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession previousCandle(Long sessionId, Long userId);

    /**
     * Move to the next candle in the replay.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession nextCandle(Long sessionId, Long userId);

    /**
     * Restart the replay from the beginning.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @return The updated replay session
     */
    ReplaySession restartReplay(Long sessionId, Long userId);

    /**
     * Skip forward by a specified number of candles.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @param skipCount The number of candles to skip forward
     * @return The updated replay session
     */
    ReplaySession skipForward(Long sessionId, Long userId, int skipCount);

    /**
     * Skip backward by a specified number of candles.
     *
     * @param sessionId The ID of the session
     * @param userId The ID of the user (for authorization)
     * @param skipCount The number of candles to skip backward
     * @return The updated replay session
     */
    ReplaySession skipBackward(Long sessionId, Long userId, int skipCount);

    /** Virtual Trading Methods */
    com.vishal.replay.model.ReplayOrder placeOrder(Long sessionId, Long userId, String symbol, Double quantity, String orderSide, Double price);
    
    java.util.List<com.vishal.replay.model.ReplayOrder> getOrders(Long sessionId, Long userId);
    
    java.util.List<java.util.Map<String, Object>> getPortfolio(Long sessionId, Long userId);
    
    com.vishal.replay.model.ReplayWallet getWallet(Long sessionId, Long userId);
}