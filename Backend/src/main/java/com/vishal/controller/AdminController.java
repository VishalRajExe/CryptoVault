package com.vishal.controller;

import com.vishal.model.Notification;
import com.vishal.model.Order;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.response.AdminStatsResponse;
import com.vishal.service.AdminService;
import com.vishal.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * All endpoints here are already gated to ROLE_ADMIN by AppConfig's
 * `.requestMatchers("/api/admin/**").hasRole("ADMIN")` security rule - no
 * additional per-method role checks are needed.
 *
 * Note: withdrawal approve/decline (GET /api/admin/withdrawal and
 * PATCH /api/admin/withdrawal/{id}/proceed/{accept}) already existed in
 * WithdrawalController before this change and are left there unmodified.
 */
@RestController
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/api/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return new ResponseEntity<>(adminService.getAllUsers(), HttpStatus.OK);
    }

    @GetMapping("/api/admin/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return new ResponseEntity<>(adminService.getAllOrders(), HttpStatus.OK);
    }

    @GetMapping("/api/admin/wallets")
    public ResponseEntity<List<Wallet>> getAllWallets() {
        return new ResponseEntity<>(adminService.getAllWallets(), HttpStatus.OK);
    }

    @GetMapping("/api/admin/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return new ResponseEntity<>(adminService.getStats(), HttpStatus.OK);
    }

    /** Full "who did what" activity feed across every user on the platform. */
    @GetMapping("/api/admin/activity")
    public ResponseEntity<List<Notification>> getAllActivity() {
        return new ResponseEntity<>(notificationService.getAll(), HttpStatus.OK);
    }
}
