package com.vishal.replay.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Entity representing a portfolio for a replay session.
 * A portfolio belongs to exactly one replay session and contains multiple wallets (one per currency).
 */
@Entity
@Table(name = "replay_portfolios")
public class ReplayPortfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** One portfolio belongs to one replay session */
    @OneToOne
    @JoinColumn(name = "session_id", referencedColumnName = "id", nullable = false)
    private ReplaySession replaySession;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ReplaySession getReplaySession() {
        return replaySession;
    }

    public void setReplaySession(ReplaySession replaySession) {
        this.replaySession = replaySession;
    }
}