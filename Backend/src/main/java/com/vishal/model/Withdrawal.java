package com.vishal.model;

import com.vishal.domain.WithdrawalStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Withdrawal {
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Id
    private Long id;

    private WithdrawalStatus status;

    private java.math.BigDecimal amount;

    @ManyToOne
    private User user;

    private LocalDateTime date;
}
