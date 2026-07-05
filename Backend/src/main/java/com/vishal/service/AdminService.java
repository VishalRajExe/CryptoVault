package com.vishal.service;

import com.vishal.model.Order;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.response.AdminStatsResponse;

import java.util.List;

public interface AdminService {

    List<User> getAllUsers();

    List<Order> getAllOrders();

    List<Wallet> getAllWallets();

    AdminStatsResponse getStats();
}
