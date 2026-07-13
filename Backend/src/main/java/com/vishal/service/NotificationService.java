package com.vishal.service;

import com.vishal.model.Notification;
import com.vishal.model.User;

import java.util.List;

public interface NotificationService {

    /** Creates and persists a notification for one user. Fire-and-forget: callers
     *  should not let a notification failure block the action that triggered it. */
    Notification create(User user, String type, String message, java.math.BigDecimal amount);

    List<Notification> getForUser(User user);

    List<Notification> getAll();

    void markAllReadForUser(User user);
}
