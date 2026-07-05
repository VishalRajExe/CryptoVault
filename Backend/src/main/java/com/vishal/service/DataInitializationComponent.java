package com.vishal.service;

import com.vishal.domain.USER_ROLE;


import com.vishal.model.User;
import com.vishal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WatchlistService watchlistService;


    private PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializationComponent(UserRepository userRepository,
                                       PasswordEncoder passwordEncoder,
                                       WatchlistService watchlistService
                                       ) {
        this.userRepository = userRepository;
        this.passwordEncoder=passwordEncoder;
        this.watchlistService = watchlistService;

    }

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        String adminUsername = "admin@vishal.com";

        if (userRepository.findByEmail(adminUsername)==null) {
            User adminUser = new User();

            adminUser.setPassword(passwordEncoder.encode("Admin@123"));
            adminUser.setFullName("Vishal Admin");
            adminUser.setEmail(adminUsername);
            adminUser.setRole(USER_ROLE.ROLE_ADMIN);
            User admin=userRepository.save(adminUser);

            // BUGFIX: the seeded admin account never had a watchlist created for it
            // (unlike users created through normal signup), so the very first call to
            // GET /api/watchlist as the admin would fail with a "not found" error.
            watchlistService.createWatchList(admin);
        }
    }

}
