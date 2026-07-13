package com.vishal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private User user;

    @Pattern(regexp = "^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{11,71}$", message = "Invalid Bitcoin address")
    private String btcAddress;

    @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Invalid Ethereum address")
    private String ethAddress;

    @Pattern(regexp = "^[1-9A-HJ-NP-Za-km-z]{32,44}$", message = "Invalid Solana address")
    private String solAddress;

    @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Invalid USDT (ERC20) address")
    private String usdtErc20Address;

    @Pattern(regexp = "^T[1-9A-HJ-NP-Za-km-z]{33}$", message = "Invalid USDT (TRC20) address")
    private String usdtTrc20Address;

    @Pattern(regexp = "^T[1-9A-HJ-NP-Za-km-z]{33}$", message = "Invalid TRON address")
    private String trxAddress;

    private BigDecimal balance = BigDecimal.ZERO;
}
