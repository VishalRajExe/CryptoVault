package com.vishal.repository;

import com.vishal.domain.WalletTransactionType;
import com.vishal.model.Wallet;
import com.vishal.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction,Long> {

    List<WalletTransaction> findByWalletOrderByDateDesc(Wallet wallet);

}
