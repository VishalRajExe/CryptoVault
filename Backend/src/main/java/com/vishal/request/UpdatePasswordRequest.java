package com.vishal.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.vishal.domain.VerificationType;

@Data
public class UpdatePasswordRequest {

    @NotBlank(message = "Send to is required")
    private String sendTo;

    @NotNull(message = "Verification type is required")
    private VerificationType verificationType;
}
