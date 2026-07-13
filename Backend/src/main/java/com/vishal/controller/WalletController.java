package com.vishal.controller;

import com.vishal.domain.USER_ROLE;
import com.vishal.domain.WalletTransactionType;
import com.vishal.exception.UserException;
import com.vishal.model.*;
import com.vishal.response.PaymentResponse;
import com.vishal.service.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
public class WalletController {

    @Autowired
    private WalletService walleteService;

    @Autowired
    private UserService userService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private WalletTransactionService walletTransactionService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ExchangeRateService exchangeRateService;

    // -----------------------------------------------------------------------
    // GET /api/wallet
    // -----------------------------------------------------------------------
    @GetMapping("/api/wallet")
    public ResponseEntity<?> getUserWallet(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != USER_ROLE.ROLE_ADMIN && !user.isVerified()) {
            throw new UserException("Email verification required. Please verify your account to access your wallet.");
        }
        Wallet wallet = walleteService.getUserWallet(user);
        return new ResponseEntity<>(wallet, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------
    // GET /api/wallet/transactions
    // -----------------------------------------------------------------------
    @GetMapping("/api/wallet/transactions")
    public ResponseEntity<List<WalletTransaction>> getWalletTransaction(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Wallet wallet = walleteService.getUserWallet(user);
        List<WalletTransaction> transactions = walletTransactionService.getTransactions(wallet, null);
        return new ResponseEntity<>(transactions, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------
    // PUT /api/wallet/deposit/amount/{amount}
    //
    // The `amount` path variable is in RUPEES (INR).
    // BUGFIX: previously the raw INR amount was added directly to the USD wallet,
    // so ₹10,000 became $10,000. We now convert using the live exchange rate
    // before crediting the wallet.
    // -----------------------------------------------------------------------
    @PutMapping("/api/wallet/deposit/amount/{amount}")
    public ResponseEntity<PaymentResponse> depositMoney(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long amount) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);

        if (user.getRole() != USER_ROLE.ROLE_ADMIN && !user.isVerified()) {
            throw new UserException("Email verification required before making deposits. Please verify your account.");
        }

        if (amount == null || amount <= 0) {
            throw new UserException("Deposit amount must be greater than zero.");
        }

        Wallet wallet = walleteService.getUserWallet(user);

        // Convert INR → USD using live exchange rate
        BigDecimal usdAmount = exchangeRateService.convertInrToUsd(amount);

        // Credit the wallet with the converted USD amount (rounded to 2 decimal places)
        walleteService.addBalanceToWallet(wallet, usdAmount);

        notificationService.create(user, "DEPOSIT",
                "Deposited ₹" + amount + " (≈ $" + usdAmount + " USD) to your wallet.", usdAmount);

        PaymentResponse res = new PaymentResponse();
        res.setPayment_url("Deposit successful. ₹" + amount + " converted to approximately $" + usdAmount + " USD.");
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------
    // PUT /api/wallet/deposit  (Razorpay/Stripe callback)
    // -----------------------------------------------------------------------
    @PutMapping("/api/wallet/deposit")
    public ResponseEntity<Wallet> addMoneyToWallet(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(name = "order_id") Long orderId,
            @RequestParam(name = "payment_id") String paymentId
    ) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);

        if (user.getRole() != USER_ROLE.ROLE_ADMIN && !user.isVerified()) {
            throw new UserException("Email verification required before making deposits. Please verify your account.");
        }

        Wallet wallet = walleteService.getUserWallet(user);

        PaymentOrder order = paymentService.getPaymentOrderById(orderId);
        Boolean status = paymentService.ProccedPaymentOrder(order, paymentId);

        if (status) {
            // The PaymentOrder amount was created in INR. Convert to USD before crediting the wallet.
            java.math.BigDecimal usdAmount = exchangeRateService.convertInrToUsd(order.getAmount());

            wallet = walleteService.addBalanceToWallet(wallet, usdAmount);
            notificationService.create(user, "DEPOSIT",
                    "Deposited ₹" + order.getAmount() + " (≈ $" + usdAmount + " USD) via " + order.getPaymentMethod() + ".", usdAmount);
        }

        return new ResponseEntity<>(wallet, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------
    // PUT /api/wallet/{walletId}/transfer
    // -----------------------------------------------------------------------
    @PutMapping("/api/wallet/{walletId}/transfer")
    public ResponseEntity<Wallet> walletToWalletTransfer(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long walletId,
            @RequestBody WalletTransaction req
    ) throws Exception {
        User senderUser = userService.findUserProfileByJwt(jwt);

        if (senderUser.getRole() != USER_ROLE.ROLE_ADMIN && !senderUser.isVerified()) {
            throw new UserException("Email verification required before transferring funds. Please verify your account.");
        }

        Wallet reciverWallet = walleteService.findWalletById(walletId);
        Wallet wallet = walleteService.walletToWalletTransfer(senderUser, reciverWallet, req.getAmount());

        walletTransactionService.createTransaction(
                wallet,
                WalletTransactionType.WALLET_TRANSFER, reciverWallet.getId().toString(),
                req.getPurpose(),
                req.getAmount().negate()
        );

        walletTransactionService.createTransaction(
                reciverWallet,
                WalletTransactionType.WALLET_TRANSFER, wallet.getId().toString(),
                req.getPurpose(),
                req.getAmount()
        );

        notificationService.create(senderUser, "WALLET_TRANSFER_SENT",
                "Sent $" + req.getAmount() + " to wallet #" + reciverWallet.getId() + ".", req.getAmount());
        if (reciverWallet.getUser() != null) {
            notificationService.create(reciverWallet.getUser(), "WALLET_TRANSFER_RECEIVED",
                    "Received $" + req.getAmount() + " from " + senderUser.getFullName() + ".", req.getAmount());
        }

        return new ResponseEntity<>(wallet, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------
    // PUT /api/wallet/order/{orderId}/pay
    // -----------------------------------------------------------------------
    @PutMapping("/api/wallet/order/{orderId}/pay")
    public ResponseEntity<Wallet> payOrderPayment(
            @PathVariable Long orderId,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        System.out.println("-------- " + orderId);
        Order order = orderService.getOrderById(orderId);
        Wallet wallet = walleteService.payOrderPayment(order, user);
        return new ResponseEntity<>(wallet, HttpStatus.OK);
    }
}
