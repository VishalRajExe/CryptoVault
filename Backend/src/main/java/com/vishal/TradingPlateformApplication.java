package com.vishal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class.
 */
@SpringBootApplication
@EnableCaching
public class TradingPlateformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradingPlateformApplication.class, args);
    }

}