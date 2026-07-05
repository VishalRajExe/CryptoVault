package com.vishal.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Aggregate platform numbers shown on the admin dashboard's stat cards. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalOrders;
    private long totalWithdrawals;
    private long pendingWithdrawals;
    private BigDecimal totalWalletBalance;
    private long totalTransactions;
}
