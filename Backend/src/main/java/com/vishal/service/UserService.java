package com.vishal.service;


import com.vishal.domain.VerificationType;
import com.vishal.exception.UserException;
import com.vishal.model.User;


public interface UserService {

	public User findUserProfileByJwt(String jwt) throws UserException;
	
	public User findUserByEmail(String email) throws UserException;
	
	public User findUserById(Long userId) throws UserException;

	public User verifyUser(User user) throws UserException;

	public User enabledTwoFactorAuthentication(VerificationType verificationType,
											   String sendTo, User user) throws UserException;

//	public List<User> getPenddingRestaurantOwner();

	User updatePassword(User user, String newPassword);

	void sendUpdatePasswordOtp(String email,String otp);

	/** Added so the Security page's "Mobile number" card can actually save a
	 *  number - previously there was no backend support for this at all. */
	User updateMobile(User user, String mobile) throws UserException;

//	void sendPasswordResetEmail(User user);
}
