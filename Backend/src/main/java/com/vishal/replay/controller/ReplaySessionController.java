package com.vishal.replay.controller;

import com.vishal.replay.model.ReplaySession;
import com.vishal.replay.service.ReplaySessionService;
import com.vishal.service.UserService;
import com.vishal.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing replay sessions and controls.
 */
@RestController
@RequestMapping("/api/replay/sessions")
public class ReplaySessionController {

    @Autowired
    private ReplaySessionService replaySessionService;

    @Autowired
    private UserService userService;

    /**
     * Extracts the user ID from the JWT token.
     *
     * @param jwt the JWT token from the Authorization header
     * @return the user ID
     */
    private Long getUserId(String jwt) {
        if (jwt == null || jwt.isEmpty()) {
            return null;
        }
        try {
            User user = userService.findUserProfileByJwt(jwt);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    // Create a new replay session
    @PostMapping
    public ResponseEntity<ReplaySession> createSession(@RequestHeader("Authorization") String jwt,
                                                       @RequestParam String name,
                                                       @RequestParam String description,
                                                       @RequestParam String symbol,
                                                       @RequestParam String timeframe,
                                                       @RequestParam Long startTime,
                                                       @RequestParam Long endTime,
                                                       @RequestParam Double initialBalance,
                                                       @RequestParam Double replaySpeed) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.createSession(userId, name, description, symbol, timeframe, startTime, endTime, initialBalance, replaySpeed);
        return ResponseEntity.ok(session);
    }

    // Get all sessions for the user
    @GetMapping
    public ResponseEntity<List<ReplaySession>> getSessions(@RequestHeader("Authorization") String jwt) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<ReplaySession> sessions = replaySessionService.getSessionsByUserId(userId);
        return ResponseEntity.ok(sessions);
    }

    // Get a specific session by ID
    @GetMapping("/{sessionId}")
    public ResponseEntity<ReplaySession> getSession(@RequestHeader("Authorization") String jwt,
                                                    @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.getSessionById(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Start the replay session
    @PutMapping("/{sessionId}/start")
    public ResponseEntity<ReplaySession> startSession(@RequestHeader("Authorization") String jwt,
                                                      @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.startSession(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Pause the replay session
    @PutMapping("/{sessionId}/pause")
    public ResponseEntity<ReplaySession> pauseSession(@RequestHeader("Authorization") String jwt,
                                                      @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.pauseSession(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Resume the replay session
    @PutMapping("/{sessionId}/resume")
    public ResponseEntity<ReplaySession> resumeSession(@RequestHeader("Authorization") String jwt,
                                                       @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.resumeSession(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Stop the replay session
    @PutMapping("/{sessionId}/stop")
    public ResponseEntity<ReplaySession> stopSession(@RequestHeader("Authorization") String jwt,
                                                     @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.stopSession(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Reset the replay session to initial state
    @PostMapping("/{sessionId}/reset")
    public ResponseEntity<ReplaySession> resetSession(@RequestHeader("Authorization") String jwt,
                                                      @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.resetSession(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Delete the replay session
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@RequestHeader("Authorization") String jwt,
                                              @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        replaySessionService.deleteSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }

    // Update replay speed
    @PutMapping("/{sessionId}/speed")
    public ResponseEntity<ReplaySession> updateReplaySpeed(@RequestHeader("Authorization") String jwt,
                                                           @PathVariable Long sessionId,
                                                           @RequestParam Double replaySpeed) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.updateReplaySpeed(sessionId, userId, replaySpeed);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Jump to a specific date/time
    @PutMapping("/{sessionId}/jump/date")
    public ResponseEntity<ReplaySession> jumpToDate(@RequestHeader("Authorization") String jwt,
                                                    @PathVariable Long sessionId,
                                                    @RequestParam Long targetTime) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.jumpToDate(sessionId, userId, targetTime);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Jump to a specific candle index
    @PutMapping("/{sessionId}/jump/candle")
    public ResponseEntity<ReplaySession> jumpToCandle(@RequestHeader("Authorization") String jwt,
                                                      @PathVariable Long sessionId,
                                                      @RequestParam int candleIndex) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.jumpToCandle(sessionId, userId, candleIndex);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Move to the previous candle
    @PutMapping("/{sessionId}/previous")
    public ResponseEntity<ReplaySession> previousCandle(@RequestHeader("Authorization") String jwt,
                                                        @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.previousCandle(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Move to the next candle
    @PutMapping("/{sessionId}/next")
    public ResponseEntity<ReplaySession> nextCandle(@RequestHeader("Authorization") String jwt,
                                                    @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.nextCandle(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Restart the replay from the beginning
    @PutMapping("/{sessionId}/restart")
    public ResponseEntity<ReplaySession> restartReplay(@RequestHeader("Authorization") String jwt,
                                                       @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.restartReplay(sessionId, userId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Skip forward by a specified number of candles
    @PutMapping("/{sessionId}/skip/forward")
    public ResponseEntity<ReplaySession> skipForward(@RequestHeader("Authorization") String jwt,
                                                     @PathVariable Long sessionId,
                                                     @RequestParam int skipCount) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.skipForward(sessionId, userId, skipCount);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // Skip backward by a specified number of candles
    @PutMapping("/{sessionId}/skip/backward")
    public ResponseEntity<ReplaySession> skipBackward(@RequestHeader("Authorization") String jwt,
                                                      @PathVariable Long sessionId,
                                                      @RequestParam int skipCount) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        ReplaySession session = replaySessionService.skipBackward(sessionId, userId, skipCount);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    public static class ReplayOrderRequest {
        private String symbol;
        private Double quantity;
        private String orderType;
        private Double price;

        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }
        public Double getQuantity() { return quantity; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }
        public String getOrderType() { return orderType; }
        public void setOrderType(String orderType) { this.orderType = orderType; }
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
    }

    private java.util.Map<String, Object> formatOrder(com.vishal.replay.model.ReplayOrder o) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", o.getId());
        map.put("orderType", o.getOrderSide().name());
        map.put("price", o.getPrice());
        map.put("status", "SUCCESS");
        map.put("timestamp", o.getCreatedAt());
        
        java.util.Map<String, Object> orderItem = new java.util.HashMap<>();
        orderItem.put("quantity", o.getQuantity());
        
        java.util.Map<String, Object> coin = new java.util.HashMap<>();
        String base = "BTC";
        if (o.getSymbol().contains("/")) {
            base = o.getSymbol().split("/")[0].toUpperCase();
        } else {
            base = o.getSymbol().toUpperCase();
        }
        coin.put("symbol", base);
        coin.put("name", base + " Coin");
        coin.put("image", "https://assets.coingecko.com/coins/images/1/large/bitcoin.png");
        
        try {
            List<java.util.Map<String, Object>> portfolio = replaySessionService.getPortfolio(o.getReplaySession().getId(), o.getUserId());
            if (portfolio != null) {
                for (java.util.Map<String, Object> m : portfolio) {
                    java.util.Map<String, Object> c = (java.util.Map<String, Object>) m.get("coin");
                    if (c != null && c.get("symbol").toString().equalsIgnoreCase(base)) {
                        coin.put("name", c.get("name").toString());
                        coin.put("image", c.get("image").toString());
                        break;
                    }
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        
        orderItem.put("coin", coin);
        map.put("orderItem", orderItem);
        return map;
    }

    // Place a virtual order
    @PostMapping("/{sessionId}/orders")
    public ResponseEntity<java.util.Map<String, Object>> placeOrder(@RequestHeader("Authorization") String jwt,
                                                                   @PathVariable Long sessionId,
                                                                   @RequestBody ReplayOrderRequest req) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        com.vishal.replay.model.ReplayOrder order = replaySessionService.placeOrder(
                sessionId, userId, req.getSymbol(), req.getQuantity(), req.getOrderType(), req.getPrice());
        return ResponseEntity.ok(formatOrder(order));
    }

    // Get all orders for a session
    @GetMapping("/{sessionId}/orders")
    public ResponseEntity<List<java.util.Map<String, Object>>> getOrders(@RequestHeader("Authorization") String jwt,
                                                                         @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<com.vishal.replay.model.ReplayOrder> orders = replaySessionService.getOrders(sessionId, userId);
        List<java.util.Map<String, Object>> formatted = new java.util.ArrayList<>();
        if (orders != null) {
            for (com.vishal.replay.model.ReplayOrder o : orders) {
                formatted.add(formatOrder(o));
            }
        }
        return ResponseEntity.ok(formatted);
    }

    // Get portfolio holdings for a session
    @GetMapping("/{sessionId}/portfolio")
    public ResponseEntity<List<java.util.Map<String, Object>>> getPortfolio(@RequestHeader("Authorization") String jwt,
                                                                            @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<java.util.Map<String, Object>> portfolio = replaySessionService.getPortfolio(sessionId, userId);
        return ResponseEntity.ok(portfolio);
    }

    // Get wallet details for a session
    @GetMapping("/{sessionId}/wallet")
    public ResponseEntity<com.vishal.replay.model.ReplayWallet> getWallet(@RequestHeader("Authorization") String jwt,
                                                                          @PathVariable Long sessionId) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        com.vishal.replay.model.ReplayWallet wallet = replaySessionService.getWallet(sessionId, userId);
        return ResponseEntity.ok(wallet);
    }
}