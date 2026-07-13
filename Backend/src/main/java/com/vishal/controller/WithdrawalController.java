package com.vishal.controller;

import com.vishal.domain.USER_ROLE;
import com.vishal.domain.WalletTransactionType;
import com.vishal.exception.UserException;
import com.vishal.exception.WalletException;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.model.WalletTransaction;
import com.vishal.model.Withdrawal;
import com.vishal.service.UserService;
import com.vishal.service.WalletService;
import com.vishal.service.WalletTransactionService;
import com.vishal.service.WithdrawalService;
import com.vishal.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WithdrawalController {

    @Autowired
    private WithdrawalService withdrawalService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserService userService;

    @Autowired
    private WalletTransactionService walletTransactionService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/api/withdrawal/{amount}")
    public ResponseEntity<?> withdrawalRequest(
            @PathVariable java.math.BigDecimal amount,
            @RequestHeader("Authorization")String jwt) throws Exception {

        // BUGFIX: amount and balance were never validated before creating the
        // withdrawal request and deducting funds.
        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new WalletException("Withdrawal amount must be greater than zero.");
        }

        User user=userService.findUserProfileByJwt(jwt);

        // Withdrawals require email verification. Admin accounts are exempt.
        if (user.getRole() != USER_ROLE.ROLE_ADMIN && !user.isVerified()) {
            throw new UserException("Email verification required before withdrawing. Please verify your account.");
        }

        Wallet userWallet=walletService.getUserWallet(user);

        if (userWallet.getBalance().compareTo(amount) < 0) {
            throw new WalletException("Insufficient wallet balance for this withdrawal.");
        }

        Withdrawal withdrawal=withdrawalService.requestWithdrawal(amount,user);
        walletService.addBalanceToWallet(userWallet, withdrawal.getAmount().negate());

        WalletTransaction walletTransaction = walletTransactionService.createTransaction(
                userWallet,
                WalletTransactionType.WITHDRAWAL,null,
                "bank account withdrawal",
                withdrawal.getAmount()
        );

        notificationService.create(user, "WITHDRAWAL_REQUESTED",
                "Withdrawal request for $" + amount + " submitted.", amount);

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @PatchMapping("/api/admin/withdrawal/{id}/proceed/{accept}")
    public ResponseEntity<?> proceedWithdrawal(
            @PathVariable Long id,
            @PathVariable boolean accept,
            @RequestHeader("Authorization")String jwt) throws Exception {

        // The admin making this call - used only to authorize the action, NOT as the
        // wallet to refund (see bugfix below).
        userService.findUserProfileByJwt(jwt);

        Withdrawal withdrawal=withdrawalService.procedWithdrawal(id,accept);

        if(!accept){
            // BUGFIX: this previously credited the refund to the ADMIN'S OWN wallet
            // (fetched from the JWT of whoever called this endpoint) instead of the
            // wallet belonging to the user who actually requested the withdrawal -
            // meaning a rejected withdrawal silently transferred the user's money to
            // whichever admin clicked "reject".
            Wallet requesterWallet = walletService.getUserWallet(withdrawal.getUser());
            walletService.addBalanceToWallet(requesterWallet, withdrawal.getAmount());
            notificationService.create(withdrawal.getUser(), "WITHDRAWAL_DECLINED",
                    "Your withdrawal request for $" + withdrawal.getAmount() + " was declined and refunded.",
                    withdrawal.getAmount());
        } else {
            notificationService.create(withdrawal.getUser(), "WITHDRAWAL_APPROVED",
                    "Your withdrawal request for $" + withdrawal.getAmount() + " was approved.",
                    withdrawal.getAmount());
        }
        
        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @GetMapping("/api/withdrawal")
    public ResponseEntity<List<Withdrawal>> getWithdrawalHistory(

            @RequestHeader("Authorization")String jwt) throws Exception {
        User user=userService.findUserProfileByJwt(jwt);

        List<Withdrawal> withdrawal=withdrawalService.getUsersWithdrawalHistory(user);

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @GetMapping("/api/admin/withdrawal")
    public ResponseEntity<List<Withdrawal>> getAllWithdrawalRequest(

            @RequestHeader("Authorization")String jwt) throws Exception {
        User user=userService.findUserProfileByJwt(jwt);

        List<Withdrawal> withdrawal=withdrawalService.getAllWithdrawalRequest();

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }
}
