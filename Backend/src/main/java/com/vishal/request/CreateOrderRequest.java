package com.vishal.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import com.vishal.domain.OrderType;

@Data
public class CreateOrderRequest {

	@NotBlank(message = "Coin ID is required")
	private String coinId;

	@NotNull(message = "Quantity is required")
	@Positive(message = "Quantity must be positive")
	private double quantity;

	@NotNull(message = "Order type is required")
	private OrderType orderType;
}
