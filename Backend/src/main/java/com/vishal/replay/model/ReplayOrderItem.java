package com.vishal.replay.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entity representing a replay order item (fill) for market replay.
 */
@Entity
@Table(name = "replay_order_items")
public class ReplayOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The order this item belongs to */
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private ReplayOrder replayOrder;

    /** Execution price */
    @Column(name = "price", nullable = false)
    private Double price;

    /** Executed quantity */
    @Column(name = "quantity", nullable = false)
    private Double quantity;

    /** Fee charged for this fill */
    @Column(name = "fee", nullable = false)
    private Double fee;

    /** Timestamp of execution */
    @Column(name = "executed_at", nullable = false)
    private Long executedAt;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ReplayOrder getReplayOrder() {
        return replayOrder;
    }

    public void setReplayOrder(ReplayOrder replayOrder) {
        this.replayOrder = replayOrder;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getFee() {
        return fee;
    }

    public void setFee(Double fee) {
        this.fee = fee;
    }

    public Long getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Long executedAt) {
        this.executedAt = executedAt;
    }
}