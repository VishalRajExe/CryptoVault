package com.vishal.request;

import com.vishal.domain.OrderType;

import com.vishal.model.Coin;
import lombok.Data;

import java.math.BigDecimal;


@Data
public class CreateOrderRequest {
    private String coinId;
    private double quantity;
    private OrderType orderType;
}
