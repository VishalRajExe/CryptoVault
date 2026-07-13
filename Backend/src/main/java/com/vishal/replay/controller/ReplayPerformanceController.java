package com.vishal.replay.controller;

import com.vishal.replay.dto.ReplayPerformanceAnalyticsDTO;
import com.vishal.replay.service.ReplayPerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for retrieving replay performance analytics.
 */
@RestController
@RequestMapping("/api/replay/sessions/{sessionId}/performance")
public class ReplayPerformanceController {

    @Autowired
    private ReplayPerformanceService replayPerformanceService;

    /**
     * Get performance analytics for a replay session.
     *
     * @param sessionId the ID of the replay session
     * @return the performance analytics
     */
    @GetMapping
    public ResponseEntity<ReplayPerformanceAnalyticsDTO> getPerformance(@PathVariable Long sessionId) {
        ReplayPerformanceAnalyticsDTO analytics = replayPerformanceService.calculatePerformance(sessionId);
        return ResponseEntity.ok(analytics);
    }
}