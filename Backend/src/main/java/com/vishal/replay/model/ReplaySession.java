package com.vishal.replay.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entity representing a replay session.
 */
@Entity
@Table(name = "replay_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReplaySession {

    public enum ReplayStatus {
        CREATED,
        PLAYING,
        PAUSED,
        STOPPED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who owns this session */
    private Long userId;

    /** Name of the session */
    private String name;

    /** Description of the session */
    private String description;

    /** Trading symbol (e.g., BTC, ETH) */
    private String symbol;

    /** Candle interval (e.g., 1m, 5m, 1h, 1d) */
    private String timeframe;

    /** Start time of the replay in milliseconds since epoch */
    private Long startTime;

    /** End time of the replay in milliseconds since epoch */
    private Long endTime;

    /** Current replay time in milliseconds since epoch (open time of the last revealed candle) */
    @Column(name = "`current_time`")
    private Long currentTime;

    /** Replay speed multiplier (e.g., 1.0 for 1x, 2.0 for 2x) */
    private Double replaySpeed;

    /** Current status of the replay session */
    @Enumerated(EnumType.STRING)
    private ReplayStatus replayStatus;

    /** Quote currency in which the initial balance is denominated (e.g., USDT, USD) */
    private String quoteCurrency;

    /** Initial virtual balance for the session (in quote currency) */
    private Double initialBalance;

    /** Timestamp when the session was created */
    private Long createdAt;

    /** Timestamp when the session was last updated */
    private Long updatedAt;
}