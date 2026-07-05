package com.vishal.controller;

import com.vishal.model.Notification;
import com.vishal.model.User;
import com.vishal.service.NotificationService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @GetMapping("/api/notifications")
    public ResponseEntity<List<Notification>> getMyNotifications(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        return new ResponseEntity<>(notificationService.getForUser(user), HttpStatus.OK);
    }

    @PatchMapping("/api/notifications/mark-read")
    public ResponseEntity<String> markAllRead(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        notificationService.markAllReadForUser(user);
        return new ResponseEntity<>("Notifications marked as read.", HttpStatus.OK);
    }
}
