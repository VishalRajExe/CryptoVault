package com.vishal.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "OTP is required")
	private String otp;
}
