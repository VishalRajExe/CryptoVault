package com.vishal.service;

import com.vishal.exception.UserException;
import com.vishal.model.PaymentDetails;
import com.vishal.model.User;

public interface PaymentDetailsService {
    public PaymentDetails addPaymentDetails(String accountNumber,
                                             String accountHolderName,
                                             String ifsc,
                                             String bankName,
                                             User user
    ) throws UserException;

    public PaymentDetails getUsersPaymentDetails(User user);
}

