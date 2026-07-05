package com.vishal.service;

import com.vishal.model.Order;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.repository.*;
import com.vishal.domain.WithdrawalStatus;
import com.vishal.response.AdminStatsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WithdrawalRepository withdrawalRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Override
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Never leak password hashes through the admin API, same guarantee the
        // regular user-profile endpoints already give.
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    @Override
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        long totalWithdrawals = withdrawalRepository.count();
        long pendingWithdrawals = withdrawalRepository.findAll().stream()
                .filter(w -> w.getStatus() == WithdrawalStatus.PENDING)
                .count();
        long totalTransactions = walletTransactionRepository.count();

        BigDecimal totalWalletBalance = walletRepository.findAll().stream()
                .map(Wallet::getBalance)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminStatsResponse(
                totalUsers, totalOrders, totalWithdrawals, pendingWithdrawals,
                totalWalletBalance, totalTransactions
        );
    }
}
