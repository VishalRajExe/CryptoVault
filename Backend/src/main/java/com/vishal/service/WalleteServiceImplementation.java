package com.vishal.service;


import com.vishal.domain.OrderStatus;
import com.vishal.domain.OrderType;
import com.vishal.domain.WalletTransactionType;
import com.vishal.exception.WalletException;
import com.vishal.model.*;

import com.vishal.repository.WalletRepository;
import com.vishal.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service

public class WalleteServiceImplementation implements WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;



    public Wallet genrateWallete(User user) {
        Wallet wallet=new Wallet();
        wallet.setUser(user);
        wallet.setBalance(BigDecimal.ZERO);
        return walletRepository.save(wallet);
    }

    @Override
    public Wallet getUserWallet(User user) throws WalletException {

        Wallet wallet = walletRepository.findByUserId(user.getId());
        if (wallet != null) {
            return wallet;
        }

        wallet = genrateWallete(user);
        return wallet;
    }


    @Override
    public Wallet findWalletById(Long id) throws WalletException {
        Optional<Wallet> wallet=walletRepository.findById(id);
        if(wallet.isPresent()){
            return wallet.get();
        }
        throw new WalletException("Wallet not found with id "+id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Wallet walletToWalletTransfer(User sender, Wallet receiverWallet, Long amount) throws WalletException {

        // BUGFIX: previously any amount (including 0 or negative) was accepted, and
        // nothing stopped a user from "transferring" money to their own wallet.
        if (amount == null || amount <= 0) {
            throw new WalletException("Transfer amount must be greater than zero.");
        }

        Wallet senderWallet = getUserWallet(sender);

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new WalletException("Cannot transfer funds to your own wallet.");
        }

        if (senderWallet.getBalance().compareTo(BigDecimal.valueOf(amount)) < 0) {
            throw new WalletException("Insufficient balance...");
        }

        BigDecimal senderBalance = senderWallet.getBalance().subtract(BigDecimal.valueOf(amount));
        senderWallet.setBalance(senderBalance);
        walletRepository.save(senderWallet);


        BigDecimal receiverBalance = receiverWallet.getBalance();
        receiverBalance = receiverBalance.add(BigDecimal.valueOf(amount));
        receiverWallet.setBalance(receiverBalance);
        walletRepository.save(receiverWallet);

        return senderWallet;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Wallet payOrderPayment(Order order, User user) throws WalletException {

        // BUGFIX: previously there was no guard here at all, so calling this twice for
        // the same order (e.g. the frontend retrying, or a user hitting both
        // POST /api/orders/pay and PUT /api/wallet/order/{id}/pay) would silently
        // debit/credit the wallet a second time for the same trade.
        if (order.getStatus() == OrderStatus.SUCCESS) {
            throw new WalletException("This order has already been paid for.");
        }

        Wallet wallet = getUserWallet(user);

        WalletTransaction walletTransaction=new WalletTransaction();
        walletTransaction.setWallet(wallet);
        walletTransaction.setPurpose(order.getOrderType()+ " " + order.getOrderItem().getCoin().getId() );

        walletTransaction.setDate(LocalDate.now());
        walletTransaction.setTransferId(order.getOrderItem().getCoin().getSymbol());


        if(order.getOrderType().equals(OrderType.BUY)){
            walletTransaction.setType(WalletTransactionType.BUY_ASSET);
            walletTransaction.setAmount(-order.getPrice().longValue());

            // BUGFIX: the original check compared the balance AFTER subtraction
            // against the order price again ("newBalance.compareTo(order.getPrice())"),
            // which is nonsensical - it could reject perfectly affordable purchases
            // (whenever the leftover balance was smaller than the price just paid,
            // which is the normal case) while also failing to reliably block
            // purchases the wallet genuinely couldn't afford. The correct check is
            // simply: does the current balance cover the price?
            if (wallet.getBalance().compareTo(order.getPrice()) < 0) {
                throw new WalletException("Insufficient funds for this transaction.");
            }

            BigDecimal newBalance = wallet.getBalance().subtract(order.getPrice());
            wallet.setBalance(newBalance);
        }
        else if(order.getOrderType().equals(OrderType.SELL)){
            walletTransaction.setType(WalletTransactionType.SELL_ASSET);
            walletTransaction.setAmount(order.getPrice().longValue());
            BigDecimal newBalance = wallet.getBalance().add(order.getPrice());
            wallet.setBalance(newBalance);
        }


        walletTransactionRepository.save(walletTransaction);
        walletRepository.save(wallet);
        return wallet;
    }

    @Override
    public Wallet addBalanceToWallet(Wallet wallet, Long money) throws WalletException {

        BigDecimal newBalance = wallet.getBalance().add(BigDecimal.valueOf(money));

        // BUGFIX: this check existed in the code but was commented out, so a wallet's
        // balance could be driven negative (e.g. by a withdrawal larger than the
        // available balance, or two concurrent withdrawals).
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new WalletException("Insufficient funds for this transaction.");
        }

        wallet.setBalance(newBalance);

        walletRepository.save(wallet);
        return wallet;
    }



}
