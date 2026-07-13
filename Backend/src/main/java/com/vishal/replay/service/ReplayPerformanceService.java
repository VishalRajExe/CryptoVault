package com.vishal.replay.service;

import com.vishal.replay.dto.ReplayPerformanceAnalyticsDTO;

/**
 * Service for calculating replay performance analytics.
 */
public interface ReplayPerformanceService {

    /**
     * Calculates performance analytics for a given replay session.
     *
     * @param sessionId the ID of the replay session
     * @return the performance analytics
     */
    ReplayPerformanceAnalyticsDTO calculatePerformance(Long sessionId);
}