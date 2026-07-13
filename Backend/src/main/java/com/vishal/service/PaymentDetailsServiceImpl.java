package com.vishal.service;

import com.vishal.exception.UserException;
import com.vishal.model.PaymentDetails;
import com.vishal.model.User;
import com.vishal.repository.PaymentDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PaymentDetailsServiceImpl implements PaymentDetailsService {

    @Autowired
    private PaymentDetailsRepository paymentDetailsRepository;

    @Override
    public PaymentDetails addPaymentDetails(String accountNumber,
                                            String accountHolderName,
                                            String ifsc,
                                            String bankName,
                                            User user
    ) throws UserException {
        // Validate inputs before touching the database
        if (accountNumber == null || accountNumber.isBlank()) {
            throw new UserException("Account number is required.");
        }
        if (accountHolderName == null || accountHolderName.isBlank()) {
            throw new UserException("Account holder name is required.");
        }
        if (ifsc == null || ifsc.isBlank()) {
            throw new UserException("IFSC code is required.");
        }
        if (bankName == null || bankName.isBlank()) {
            throw new UserException("Bank name is required.");
        }

        // BUGFIX: previously this always inserted a new row, causing a
        // DataIntegrityViolationException (duplicate key) on the second call.
        // Now we upsert: update the existing record if it exists, create otherwise.
        PaymentDetails existing = paymentDetailsRepository.getPaymentDetailsByUserId(user.getId());
        if (existing != null) {
            existing.setAccountNumber(accountNumber);
            existing.setAccountHolderName(accountHolderName);
            existing.setIfsc(ifsc);
            existing.setBankName(bankName);
            return paymentDetailsRepository.save(existing);
        }

        PaymentDetails paymentDetails = new PaymentDetails();
        paymentDetails.setAccountNumber(accountNumber);
        paymentDetails.setAccountHolderName(accountHolderName);
        paymentDetails.setIfsc(ifsc);
        paymentDetails.setBankName(bankName);
        paymentDetails.setUser(user);
        return paymentDetailsRepository.save(paymentDetails);
    }

    @Override
    public PaymentDetails getUsersPaymentDetails(User user) {
        return paymentDetailsRepository.getPaymentDetailsByUserId(user.getId());
    }
}
