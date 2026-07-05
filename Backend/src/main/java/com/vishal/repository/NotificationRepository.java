package com.vishal.repository;

import com.vishal.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByTimestampDesc(Long userId);

    // Used by the admin "full activity" tab - every notification across every
    // user, newest first.
    List<Notification> findAllByOrderByTimestampDesc();
}
