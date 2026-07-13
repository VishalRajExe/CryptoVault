package com.vishal.service;

import com.vishal.model.Order;
import com.vishal.model.OrderItem;
import com.vishal.model.User;
import com.vishal.domain.OrderType;
import com.vishal.domain.OrderStatus;
import com.vishal.repository.OrderRepository;
import com.vishal.model.Coin;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for trade operations.
 */
@Service
public class TradeServiceImpl implements TradeService {

    private final OrderRepository orderRepository;
    private final WalletService walletService;

    @Autowired
    public TradeServiceImpl(OrderRepository orderRepository, WalletService walletService) {
        this.orderRepository = orderRepository;
        this.walletService = walletService;
    }

    @Override
    @Transactional
    public Order buyAsset(Coin coin, double quantity, User user) throws Exception {
        return executeTrade(coin, quantity, user, OrderType.BUY);
    }

    @Override
    @Transactional
    public Order sellAsset(Coin coin, double quantity, User user) throws Exception {
        return executeTrade(coin, quantity, user, OrderType.SELL);
    }

    /**
     * Executes a trade (buy or sell) for the given coin and quantity.
     *
     * @param coin      the cryptocurrency to trade
     * @param quantity  the quantity to trade
     * @param user      the user initiating the trade
     * @param orderType the type of order (BUY or SELL)
     * @return the created order
     * @throws Exception if the trade fails
     */
    private Order executeTrade(Coin coin, double quantity, User user, OrderType orderType) throws Exception {
        double price = coin.getCurrentPrice() * quantity;
        Order order = new Order();
        order.setUser(user);

        OrderItem orderItem = new OrderItem();
        orderItem.setCoin(coin);
        orderItem.setQuantity(quantity);
        order.setOrderItem(orderItem);

        order.setOrderType(orderType);
        order.setPrice(BigDecimal.valueOf(price));
        order.setTimestamp(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        Order savedOrder = orderRepository.save(order);
        walletService.payOrderPayment(savedOrder, user);
        return savedOrder;
    }
}