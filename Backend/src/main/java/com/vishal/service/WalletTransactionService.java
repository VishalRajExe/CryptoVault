package com.vishal.service;

import com.vishal.domain.WalletTransactionType;
import com.vishal.model.Wallet;
import com.vishal.model.WalletTransaction;

import java.util.List;

public interface WalletTransactionService {
    WalletTransaction createTransaction(Wallet wallet,
                                        WalletTransactionType type,
                                        String transferId,
                                        String purpose,
                                        java.math.BigDecimal amount
    );

    List<WalletTransaction> getTransactions(Wallet wallet, WalletTransactionType type);

}
