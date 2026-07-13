package com.vishal.replay.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import com.vishal.replay.domain.ReplayOrderType;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a replay order for market replay.
 */
@Entity
@Table(name = "replay_orders")
public class ReplayOrder {

    public enum ReplayOrderStatus {
        PENDING, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED, EXPIRED
    }

    public enum ReplayOrderSide {
        BUY, SELL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The replay session this order belongs to */
    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private ReplaySession replaySession;

    /** The user who placed this order */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Trading symbol (e.g., BTC, ETH) */
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    /** Side of the order (BUY or SELL) */
    @Enumerated(EnumType.STRING)
    @Column(name = "order_side", nullable = false, length = 10)
    private ReplayOrderSide orderSide;

    /** Type of the order (MARKET, LIMIT, STOP, STOP_LIMIT) */
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    private ReplayOrderType orderType;

    /** Price of the order (for limit orders) */
    @Column(name = "price")
    private Double price;

    /** Stop price (for stop and stop_limit orders) */
    @Column(name = "stop_price")
    private Double stopPrice;

    /** Quantity ordered */
    @Column(name = "quantity", nullable = false)
    private Double quantity;

    /** Quantity filled */
    @Column(name = "filled_quantity", nullable = false)
    private Double filledQuantity;

    /** Average fill price */
    @Column(name = "average_price")
    private Double averagePrice;

    /** Current status of the order */
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    private ReplayOrderStatus orderStatus;

    /** Time in force (e.g., GTC, IOC, FOK) */
    @Column(name = "time_in_force", length = 10)
    private String timeInForce;

    /** Timestamp when the order was created */
    @Column(name = "created_at", nullable = false)
    private Long createdAt;

    /** Timestamp when the order was last updated */
    @Column(name = "updated_at", nullable = false)
    private Long updatedAt;

    /** The order items (fills) for this order */
    @OneToMany(mappedBy = "replayOrder", orphanRemoval = true)
    private List<ReplayOrderItem> orderItems = new ArrayList<>();

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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public ReplayOrderSide getOrderSide() {
        return orderSide;
    }

    public void setOrderSide(ReplayOrderSide orderSide) {
        this.orderSide = orderSide;
    }

    public ReplayOrderType getOrderType() {
        return orderType;
    }

    public void setOrderType(ReplayOrderType orderType) {
        this.orderType = orderType;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getStopPrice() {
        return stopPrice;
    }

    public void setStopPrice(Double stopPrice) {
        this.stopPrice = stopPrice;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getFilledQuantity() {
        return filledQuantity;
    }

    public void setFilledQuantity(Double filledQuantity) {
        this.filledQuantity = filledQuantity;
    }

    public Double getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(Double averagePrice) {
        this.averagePrice = averagePrice;
    }

    public ReplayOrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(ReplayOrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getTimeInForce() {
        return timeInForce;
    }

    public void setTimeInForce(String timeInForce) {
        this.timeInForce = timeInForce;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ReplayOrderItem> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<ReplayOrderItem> orderItems) {
        this.orderItems = orderItems;
    }

    public void addOrderItem(ReplayOrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.setReplayOrder(this);
    }

    public void removeOrderItem(ReplayOrderItem orderItem) {
        orderItems.remove(orderItem);
        orderItem.setReplayOrder(null);
    }
}