package com.vishal.service;


import com.vishal.exception.WalletException;
import com.vishal.model.Order;
import com.vishal.model.User;
import com.vishal.model.Wallet;

import java.math.BigDecimal;


public interface WalletService {


    Wallet getUserWallet(User user) throws WalletException;

    public Wallet addBalanceToWallet(Wallet wallet, java.math.BigDecimal money) throws WalletException;

    public Wallet withdrawBalanceFromWallet(Wallet wallet, java.math.BigDecimal money) throws WalletException;

    public Wallet findWalletById(Long id) throws WalletException;

    public Wallet walletToWalletTransfer(User sender,Wallet receiverWallet, java.math.BigDecimal amount) throws WalletException;

    public Wallet payOrderPayment(Order order, User user) throws WalletException;


}