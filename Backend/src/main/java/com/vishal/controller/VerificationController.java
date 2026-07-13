package com.vishal.controller;

import com.vishal.domain.OtpVerificationResult;
import com.vishal.domain.VerificationType;
import com.vishal.exception.UserException;
import com.vishal.model.User;
import com.vishal.model.VerificationCode;
import com.vishal.service.EmailService;
import com.vishal.service.UserService;
import com.vishal.service.VerificationService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class VerificationController {
    private final VerificationService verificationService;
    private final UserService userService;
    private final com.vishal.repository.UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    public VerificationController(VerificationService verificationService, UserService userService, com.vishal.repository.UserRepository userRepository) {
        this.verificationService = verificationService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * Send verification OTP (email or mobile)
     * @param verificationType type of verification (EMAIL or MOBILE)
     * @param jwt JWT token for authentication
     * @return Response indicating OTP was sent
     */
    @PostMapping("/api/users/verification/{verificationType}/send-otp")
    public ResponseEntity<String> sendVerificationOTP(
            @PathVariable VerificationType verificationType,
            @RequestHeader("Authorization") String jwt)
            throws Exception {

        User user = userService.findUserProfileByJwt(jwt);

        // Delete any existing verification code to ensure we send a fresh OTP
        VerificationCode existingCode = verificationService.findUsersVerification(user);
        if (existingCode != null) {
            verificationService.deleteVerification(existingCode);
        }

        // Generate and send new OTP
        VerificationCode verificationCode = verificationService.sendVerificationOTP(user, verificationType);

        if (verificationType.equals(VerificationType.EMAIL)) {
            emailService.sendVerificationOtpEmail(user.getEmail(), verificationCode.getOtp());
        }
        // For mobile, we would integrate with SMS service here
        // For now, just logging or storing the OTP (in a real app, you'd send via SMS)

        return ResponseEntity.ok("Verification OTP sent successfully.");
    }

    /**
     * Verify OTP for email or mobile verification
     * @param jwt JWT token for authentication
     * @param otp OTP code to verify
     * @return Response with updated user if verification successful
     */
    @PatchMapping("/api/users/verification/verify-otp/{otp}")
    public ResponseEntity<User> verifyOTP(
            @RequestHeader("Authorization") String jwt,
            @PathVariable String otp) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);

        VerificationCode verificationCode = verificationService.findUsersVerification(user);

        if (verificationCode == null) {
            throw new Exception("No verification code found. Please request a new OTP first.");
        }

        OtpVerificationResult result = verificationService.verifyOtp(otp, verificationCode);

        if (result == OtpVerificationResult.SUCCESS) {
            // Delete used verification code
            verificationService.deleteVerification(verificationCode);

            // Update user verification status
            User verifiedUser = userService.verifyUser(user);
            verifiedUser.setStatus(com.vishal.domain.UserStatus.VERIFIED);
            verifiedUser = userRepository.save(verifiedUser);
            verifiedUser.setPassword(null);

            return ResponseEntity.ok(verifiedUser);
        } else if (result == OtpVerificationResult.EXPIRED) {
            verificationService.deleteVerification(verificationCode);
            throw new Exception("OTP has expired. Please request a new one.");
        } else {
            throw new Exception("Invalid OTP. Please check and try again.");
        }
    }

    /**
     * Resend verification OTP (same as send-otp but with clearer intent)
     * @param verificationType type of verification (EMAIL or MOBILE)
     * @param jwt JWT token for authentication
     * @return Response indicating OTP was resent
     */
    @PostMapping("/api/users/verification/{verificationType}/resend-otp")
    public ResponseEntity<String> resendVerificationOTP(
            @PathVariable VerificationType verificationType,
            @RequestHeader("Authorization") String jwt)
            throws Exception {

        // This is identical to send-otp - always generate a new code
        User user = userService.findUserProfileByJwt(jwt);

        // Delete any existing verification code to ensure we send a fresh OTP
        VerificationCode existingCode = verificationService.findUsersVerification(user);
        if (existingCode != null) {
            verificationService.deleteVerification(existingCode);
        }

        // Generate and send new OTP
        VerificationCode verificationCode = verificationService.sendVerificationOTP(user, verificationType);

        if (verificationType.equals(VerificationType.EMAIL)) {
            emailService.sendVerificationOtpEmail(user.getEmail(), verificationCode.getOtp());
        }
        // For mobile, we would integrate with SMS service here

        return ResponseEntity.ok("Verification OTP resent successfully.");
    }
}