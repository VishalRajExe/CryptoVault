package com.vishal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A single activity-feed entry: "who did what". Created automatically by the
 * service layer whenever a user does something notable (signs up, deposits,
 * withdraws, places an order, transfers funds, etc) and surfaced two ways:
 *   - GET /api/notifications        - the current user's own notification bell
 *   - GET /api/admin/activity       - every notification across all users, for
 *                                      the admin "full activity" tab
 *
 * NOTE: this was previously a plain @Data POJO with no @Entity annotation and no
 * repository - it was defined but never actually used or persisted anywhere.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    /** Short machine-readable category, e.g. "DEPOSIT", "ORDER_BUY", "WITHDRAWAL". */
    private String type;

    /** Human-readable text shown in the bell / activity feed, e.g. "Deposited $100". */
    private String message;

    /** Optional dollar amount associated with the event, for display formatting. */
    private java.math.BigDecimal amount;

    private LocalDateTime timestamp = LocalDateTime.now();

    private boolean isRead = false;
}
