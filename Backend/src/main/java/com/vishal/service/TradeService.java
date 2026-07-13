package com.vishal.service;

import com.vishal.model.Order;
import com.vishal.model.User;
import com.vishal.model.Coin;

/**
 * Service interface for trade operations.
 */
public interface TradeService {

    /**
     * Executes a buy asset operation.
     *
     * @param coin      the cryptocurrency to buy
     * @param quantity  the quantity to buy
     * @param user      the user initiating the trade
     * @return the created order
     * @throws Exception if the trade fails
     */
    Order buyAsset(Coin coin, double quantity, User user) throws Exception;

    /**
     * Executes a sell asset operation.
     *
     * @param coin      the cryptocurrency to sell
     * @param quantity  the quantity to sell
     * @param user      the user initiating the trade
     * @return the created order
     * @throws Exception if the trade fails
     */
    Order sellAsset(Coin coin, double quantity, User user) throws Exception;
}