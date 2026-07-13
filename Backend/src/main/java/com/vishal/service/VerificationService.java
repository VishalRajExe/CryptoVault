package com.vishal.service;

import com.vishal.domain.OtpVerificationResult;
import com.vishal.domain.VerificationType;
import com.vishal.model.User;
import com.vishal.model.VerificationCode;

public interface VerificationService {
    VerificationCode sendVerificationOTP(User user, VerificationType verificationType);

    VerificationCode findVerificationById(Long id) throws Exception;

    VerificationCode findUsersVerification(User user) throws Exception;

    /**
     * Verifies the given OTP against the stored verification code.
     * Returns SUCCESS, EXPIRED, or INVALID.
     */
    OtpVerificationResult verifyOtp(String otp, VerificationCode verificationCode);

    void deleteVerification(VerificationCode verificationCode);
}