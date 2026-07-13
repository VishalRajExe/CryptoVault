package com.vishal.service;

import com.vishal.domain.OtpVerificationResult;
import com.vishal.domain.VerificationType;
import com.vishal.model.User;
import com.vishal.model.VerificationCode;
import com.vishal.repository.VerificationRepository;
import com.vishal.utils.OtpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class VerificationServiceImpl implements VerificationService{

    @Autowired
    private VerificationRepository verificationRepository;

    @Override
    public VerificationCode sendVerificationOTP(User user, VerificationType verificationType) {

        VerificationCode verificationCode = new VerificationCode();

        verificationCode.setOtp(OtpUtils.generateOTP());
        verificationCode.setUser(user);
        verificationCode.setVerificationType(verificationType);
        verificationCode.setEmail(user.getEmail());
        verificationCode.setMobile(user.getMobile());
        // Set expiration time to 10 minutes from now
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        return verificationRepository.save(verificationCode);
    }

    @Override
    public VerificationCode findVerificationById(Long id) throws Exception {
        var verificationCodeOptional = verificationRepository.findById(id);
        if (verificationCodeOptional.isEmpty()) {
            throw new Exception("verification not found");
        }
        return verificationCodeOptional.get();
    }

    @Override
    public VerificationCode findUsersVerification(User user) throws Exception {
        return verificationRepository.findByUserId(user.getId());
    }

    @Override
    public OtpVerificationResult verifyOtp(String otp, VerificationCode verificationCode) {
        // Check if OTP has expired
        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            return OtpVerificationResult.EXPIRED;
        }
        // Check if OTP matches
        if (otp.equals(verificationCode.getOtp())) {
            return OtpVerificationResult.SUCCESS;
        }
        return OtpVerificationResult.INVALID;
    }

    @Override
    public void deleteVerification(VerificationCode verificationCode) {
        verificationRepository.delete(verificationCode);
    }

}
