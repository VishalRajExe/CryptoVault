package com.vishal.service;

import com.vishal.model.Notification;
import com.vishal.model.User;
import com.vishal.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public Notification create(User user, String type, String message, java.math.BigDecimal amount) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setAmount(amount);
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getForUser(User user) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());
    }

    @Override
    public List<Notification> getAll() {
        return notificationRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public void markAllReadForUser(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());
        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }
}
